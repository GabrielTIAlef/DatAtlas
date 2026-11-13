# DatAtlas na Oracle — entrega de 13/11/2026

**URL:** https://datatlas.inteligencia-operacional.duckdns.org/

**Modalidade atual:** acesso público sem tela de login, autorizado posteriormente pelo titular. Os datasets são isolados por sessão de navegador. Não há cadastro de contas nem histórico persistente.

## Atualização: acesso público sem usuário e senha

O titular pediu explicitamente a remoção do login após a primeira implantação. A autenticação Basic foi substituída no ambiente ativo por sessões assinadas com HMAC-SHA256. O cookie `__Host-datatlas_session` tem Secure, HttpOnly, SameSite Strict, caminho `/`, sem Domain, validade de 30 minutos e renovação durante o uso. O segredo fica somente no arquivo protegido do serviço e não é enviado ao navegador.

Cada dataset registra o proprietário da sessão. Análise, pergunta, relatório e exclusão recusam outra sessão com 404; também recusam o uso do ID sem cookie válido. Cookies ausentes, alterados ou expirados não dão acesso a bases anteriores. Há até duas bases por sessão, três no servidor, mantidos os tetos de memória e processamento. As cotas Gemini e os limites do Nginx não foram aumentados. O primeiro projeto não foi alterado.

O endereço público foi testado sem nenhuma credencial. CSV, análise, pergunta local e relatório funcionaram; duas sessões foram impedidas de acessar/excluir dados uma da outra. **49 testes pytest** passaram, incluindo assinatura/expiração do cookie e isolamento nas quatro operações. As jornadas de navegador foram adaptadas para limpar somente os datasets da própria sessão e executadas sem credenciais. O segredo de sessão permanece após reinício; os datasets continuam efêmeros.

Snapshot específico dessa mudança: `/var/backups/datatlas/before-public-sessions/`, com ambiente anterior protegido e arquivo da aplicação. A reversão administrativa para a modalidade anterior exige restaurar o ambiente e o arquivo da aplicação desse snapshot e reiniciar somente o DatAtlas. O rollback geral documentado abaixo continua desativando apenas o DatAtlas.

As seções seguintes registram a implantação inicial com acesso pessoal e suas verificações. As referências a login descrevem essa modalidade anterior, que continua disponível no código como opção de recuperação, mas está **desativada no site atual**. As credenciais antigas não são necessárias para utilizar a aplicação.

O código veio do ZIP `DatAtlas-Oracle-1.2.0.zip`, SHA-256 `81c8d3f9d9d3f45d9b8a6ce78b85fb2653f3e1ec8e4fc2cf4b2e6244f0b2e378`. Os 49 arquivos listados no manifesto original conferiram. O ZIP e o projeto local original não foram alterados. Os fontes adaptados estão nesta pasta separada e em `/opt/datatlas`. A publicação no GitHub não fez parte da implantação inicial; posteriormente o titular a autorizou expressamente no repositório próprio `GabrielTIAlef/DatAtlas`, sem arquivos privados ou segredos. O workflow de testes não acessa a Oracle nem o Google.

## Acesso do titular

No PowerShell, consulte as credenciais diretamente pelo SSH já autorizado:

```powershell
ssh -i "F:\Downloads\keyprivate.key" ubuntu@137.131.236.116 "sudo cat /etc/datatlas/access.txt"
```

Use o usuário e a senha mostrados somente na janela de login do navegador. Não cole essa saída no chat. O acesso HTTP é redirecionado para HTTPS; nunca envie a senha por HTTP.

A chave SSH local estava com permissões amplas após a mudança de pasta. A ACL foi restringida ao usuário e SYSTEM para o OpenSSH aceitá-la, sem copiar ou exibir seu conteúdo. A ACL anterior foi preservada somente na pasta privada local de preparação. Não restaurar permissões amplas para tentar corrigir acesso.

## Recursos e separação do primeiro projeto

- Mesma VM Oracle existente: Ubuntu 24.04.5 x86_64, E2.1.Micro, 952 MiB RAM e aproximadamente 41 GiB de disco livres antes da instalação.
- Usuário Linux próprio `datatlas`, sem shell interativo, fonte em `/opt/datatlas` e ambiente Python 3.12 próprio em `/opt/datatlas/.venv`.
- Serviço `datatlas.service`, somente `127.0.0.1:8012`, um worker. Sem Docker, Redis, banco de datasets ou n8n novo.
- Nginx usa um virtual host adicional: `/etc/nginx/sites-available/datatlas`, com link em `sites-enabled/datatlas`. Não foi editado o virtual host do primeiro projeto, nem seus serviços, dados, ambiente ou código.
- O DNS `datatlas.inteligencia-operacional.duckdns.org` já resolvia para a VM. Não foi necessário token DuckDNS ou cadastro de outro serviço.
- Certificado Let's Encrypt próprio do DatAtlas, vencimento inicial em **11/02/2027**. O timer de renovação já existente verifica todos os certificados; a renovação simulada deste certificado passou. Nenhum certificado antigo foi substituído.
- Foram comparados **28 arquivos** do primeiro projeto com a fotografia anterior. Permaneceram idênticos, e o PID da API original não mudou. A saúde pública continuou respondendo normalmente durante os testes.

Nenhum plano, faturamento, cota, shape, volume, IP ou recurso pago foi criado/ativado. Isso não é uma auditoria da fatura global Oracle/Google. Mantêm-se as condições e cotas gratuitas já confirmadas pelo titular; a Oracle pode retomar VMs ociosas e não oferece garantia de disponibilidade para esta demonstração.

## Alterações implementadas

1. `backend/security.py`: hosts/origens explícitos, sem wildcard; origem deve corresponder ao endereço e esquema reais. Host público exige modo pessoal protegido; configuração incompleta falha fechada. Cabeçalho `X-Forwarded-Proto` fornecido diretamente ao backend não contorna HTTPS.
2. Autenticação HTTP Basic em toda a aplicação, incluindo assets, upload, análise, IA e relatório, somente por HTTPS externo. Senha aleatória de alta entropia; o processo recebe apenas seu hash SHA-256. Há uma única conta do titular, sem cadastro de usuários. ID aleatório não substitui autenticação.
3. Proxy transmite o Host real e o esquema TLS, substitui cabeçalhos encaminhados do cliente e usa somente o backend local. Uvicorn confia em cabeçalhos de proxy somente de `127.0.0.1`.
4. Nginx limita corpo a 5 MiB, requisições a 5/s por IP com pequena tolerância de pico, perguntas a 6/min por IP com tolerância de 2 e até 8 conexões simultâneas. A API mantém o limite JSON de 32 KiB e todos os validadores de arquivo existentes.
5. Upload, demonstração, análise e pergunta compartilham um processamento pesado por vez. Bases têm teto adicional de **24 MiB por dataset** e **48 MiB no total**, além das três bases e dos limites de arquivo/linhas/colunas. Bases muito largas podem ser recusadas antes de 5 MiB; o erro orienta reduzir linhas/colunas.
6. Serviço com limite de 250 MiB de memória, pressão de memória a partir de 180 MiB, até 128 MiB de swap e CPU limitada a 35%. Threads numéricas limitadas a uma. Escrita somente no estado do DatAtlas; fonte e demais pastas protegidas. Reinício em falha com intervalo e limite de tentativas, evitando ciclos contínuos.
7. Ajuda da interface esclarece memória no servidor, acesso pessoal, perda das bases no reinício e envio limitado ao Gemini. Os textos e comportamentos removidos na revisão original não foram restaurados.
8. O lockfile do frontend precisava de entradas opcionais de plataforma para aceitar `npm ci`. Foram adicionadas 50 entradas, sem alterar versões dos pacotes que já estavam fixados. Build recompilado com Node 24.22.3, ESLint e Vite. O servidor não precisa de Node.
9. `requirements-linux.lock` registra as versões efetivamente instaladas na VM, dentro dos limites originais. Foram usadas wheels; nenhum compilador ou pacote de interface gráfica foi instalado na VM.

## Segredos, Gemini e dados

- A chave foi lida do arquivo externo autorizado `F:\APIKEY.txt` e transmitida por stdin em conexão SSH criptografada. Não passou por argumento de comando, frontend, ZIP, Git ou resposta do chat.
- Arquivo da VM: `/etc/datatlas/gemini-key.txt`, root:datatlas, modo 0640, em diretório 0750. O serviço consegue ler; o usuário do primeiro aplicativo não consegue. A configuração `/etc/datatlas/app.env` fica em modo 0600.
- A chave foi comparada em memória com a chave já confirmada Free do primeiro aplicativo: é a mesma. Nenhuma configuração ou chave do primeiro projeto foi alterada. Ambos compartilham cotas do mesmo projeto Google.
- Modelo `gemini-3.1-flash-lite`, SDK 1.75.0, timeout 15 s e uma tentativa por pergunta. Mantido `response_json_schema`, sem reintroduzir o formato que rejeitava `additional_properties`.
- Orçamento próprio de **30 tentativas/dia**, em `/var/lib/datatlas/gemini-quota.sqlite3`, separado do orçamento do primeiro projeto. Persistiu após reinício. O orçamento limita tentativas, não custo; não ativa ou verifica administrativamente o faturamento do Google.
- O modelo recebe apenas a pergunta com aliases numéricos e contagem de linhas. Não recebe células, categorias, amostras ou o dataset completo. Dados pessoais digitados na pergunta ainda podem ser enviados: a ajuda alerta o titular.
- A primeira checagem real acionou o fallback. A autenticação ao modelo foi validada por consulta de metadados, e uma nova pergunta sintética retornou `Gemini + cálculo local`, soma **419.683,10** em 363 linhas. Não foi possível atribuir uma causa definitiva ao primeiro fallback; falhas transitórias e respostas inválidas continuam sendo tratadas explicitamente.
- Logs de fallback registram somente classe da exceção e código numérico, nunca sua mensagem, pergunta, chave ou células. Teste específico verifica isso. Access logs do novo virtual host e do Uvicorn foram desativados para não registrar nomes de arquivos/datasets nas URLs.
- Não se salvam uploads em disco. São até três bases na memória de um único processo, com expiração de 30 minutos sem acesso e limpeza na próxima operação. Reinício apaga todas as bases; recarregar a página perde a referência da interface. Sem histórico/recuperação de datasets.

## Testes realizados

- **40 testes pytest**: os 29 originais e novos testes de domínio, origem, HTTPS/proxy, autenticação da página/assets/API, configuração incompleta, impossibilidade de liberar host externo pelo modo local, limites de memória/concorrência e ausência de segredos em logs de erro. A suíte não usa a chave real.
- **14 jornadas Playwright no Chrome pelo domínio HTTPS real**, com credenciais injetadas somente no processo de teste: filtros combinados, seleção e toggle, ranking/contexto, relatório/download, conversa preservada, cancelamento de respostas antigas, erros e retry, CSV/arquivo inválido, exclusão, 5.000 linhas, desktop/tablet/celular/320 px, contraste e marca DatAtlas. Perguntas dessas jornadas forçaram cálculo local para não consumir Gemini.
- Verificação adicional pelo endereço real: CSV e XLSX válidos, arquivo corrompido, rejeição de arquivo maior que 5 MiB, IDs sem credencial recusados, origem hostil recusada e esquema do proxy coerente.
- **50.000 linhas sintéticas**: análise completa, prévia limitada a 100 e ranking top 20. Não é um teste do pior caso simultâneo de 60 colunas textuais e três datasets máximos; os limites de memória podem recusar bases complexas.
- Uma resposta real bem-sucedida do Gemini sobre a demonstração, além da tentativa inicial com fallback e testes simulados de falha/cota. Pandas calculou o número, não o provedor.
- Reinício controlado: serviço voltou, dataset de teste desapareceu e contador Gemini permaneceu igual. Inicialização no boot habilitada; não reiniciei toda a VM para não interromper o primeiro projeto.
- Verificação de ausência da chave/senha em fonte, build e journal; permissões do arquivo confirmadas e leitura pelo primeiro aplicativo recusada.
- Ruff/lint/formatação e build aprovados. `npm audit --omit=dev` não apontou vulnerabilidades conhecidas de produção na data. Não houve auditoria independente completa de segurança ou acessibilidade.
- Renovação do certificado simulada com sucesso. Porta 8012 somente em loopback; nenhuma nova regra de firewall público.
- O DatAtlas chegou a aproximadamente **157 MiB de pico** no período de testes e não teve reinícios por falha. A VM ainda tinha aproximadamente 368 MiB disponíveis numa medição com os dois aplicativos ativos. Valores pontuais não garantem desempenho sob qualquer carga.

Evidências locais: capturas `docs/revisao-*.png`, relatório `docs/exemplo-relatorio.html` e resultados da preparação em `.local/`. Esses arquivos contêm apenas dados sintéticos; a pasta de preparação não deve ser publicada.

## Operação na VM

```bash
sudo systemctl status datatlas --no-pager
sudo journalctl -u datatlas -n 50 --no-pager
sudo systemctl show datatlas -p MemoryCurrent -p MemoryPeak -p NRestarts
sudo systemctl list-timers --all | grep aio-cert-renew
sudo python3 /opt/datatlas/deploy/verify-isolation.py
```

Para reiniciar somente o DatAtlas, ciente de que apaga os datasets em memória:

```bash
sudo systemctl restart datatlas
```

Para testar código sem expor a chave do ambiente protegido:

```bash
cd /opt/datatlas
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 GEMINI_ENABLED=false .venv/bin/python -m pytest -q
.venv/bin/python -m ruff check --no-cache backend tests scripts deploy
```

Não carregar `/etc/datatlas/app.env` em um terminal que imprima o ambiente nem copiar sua saída para evidências. Para atualizações, testar primeiro e copiar somente código/build; preservar `/etc/datatlas` e `/var/lib/datatlas`.

## Backup e rollback

Snapshot protegido anterior à implantação:

```text
/var/backups/datatlas/before-20261113T223235Z/
  nginx-config.tar.gz
  aio-before.dump
  baseline.json
```

`baseline.json` contém hashes dos arquivos do primeiro projeto e seu PID, sem conteúdo de credenciais. O dump foi uma cópia consistente, sem alteração do banco original. As configurações antigas do Nginx não foram sobrescritas: a ativação acrescentou somente o arquivo/link do DatAtlas.

Para desativar somente este novo aplicativo e retirar seu virtual host:

```bash
sudo python3 /opt/datatlas/deploy/rollback.py
```

O rollback desabilita/para `datatlas.service`, remove apenas o link do DatAtlas após validar o destino e recarrega o Nginx depois de testar a configuração. Não apaga fontes, credenciais, estado ou certificados e não restaura globalmente o Nginx, o que poderia sobrescrever alterações futuras de outros aplicativos. O domínio deixa de servir o DatAtlas. Os backups ficam para inspeção/recuperação administrativa.

## Pendências e limites operacionais

- Sem multiusuário: antes de compartilhar acesso ou aceitar uploads de várias pessoas, implementar proprietários e isolamento real. Não retirar a senha apenas para abrir a página.
- Não há avisos externos de falha nem garantia 24/7; é necessária observação ao longo dos dias e respeito às condições Oracle/Gemini Free.
- Não há backup de datasets, pois eles não são persistidos. O estado persistente do DatAtlas é a cota SQLite e a configuração protegida; antes de uma migração/perda da VM, planejar sua recuperação, sem colocar segredos em ZIP público.
- **Pendência pré-existente do primeiro projeto:** o arquivo privado da tarefa de backup Windows ainda aponta para `C:\Users\gabri\Downloads\keyprivate.key`, que não existe mais. A chave está agora em `F:\Downloads\keyprivate.key`. A tarefa reportava falha antes desta implantação; não a alterei para preservar integralmente sua configuração. Os backups do banco na VM continuam independentes. Corrigir somente esse caminho em uma manutenção própria restabelece a cópia externa.
- Avisos de ferramentas de desenvolvimento: depreciação do adaptador httpx no TestClient e do ESLint 9 no gerenciador npm. Não impediram testes/build; não foram feitas atualizações maiores fora do escopo.
