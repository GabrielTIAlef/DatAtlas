# DatAtlas — passagem para implantação Oracle

Registro histórico de preparação do pacote. As autorizações e pendências abaixo
descrevem aquela etapa; não são instruções atuais de execução. A implantação e
a publicação posteriores estão registradas em [ORACLE-DEPLOYMENT.md](ORACLE-DEPLOYMENT.md)
e [CI.md](CI.md).


Data: 13/11/2026. Versão do produto: 1.2.0.

## 1. Objetivo e autorização do usuário

Preparar e publicar o DatAtlas na Oracle do usuário, usando recursos existentes e sem custos adicionais. O projeto é independente do Agente de Inteligência Operacional (Projeto 1). Preserve sua aplicação, implantação, domínio, n8n, serviços, dados e configurações.

Este documento acompanha o código local; **nenhuma implantação Oracle foi executada na preparação deste pacote**. O usuário não autorizou criar recursos pagos, ativar faturamento, ampliar cotas, publicar no GitHub ou fazer push. Se alguma dessas ações se tornar necessária, explique a necessidade antes de prosseguir. Continue autonomamente com inspeção, preparação, implementação e testes autorizados, sem pedir confirmação para decisões rotineiras.

## 2. Localizar a entrega

- Projeto no computador: `<diretorio-local-privado>`.
- Guia de uso e arquitetura: `README.md`.
- API: `backend/main.py`.
- Orçamento de requisições Gemini: `backend/gemini_budget.py`.
- Interface: `frontend/src/`, com build pronto em `frontend/dist/`.
- Logo: `frontend/public/branding/datatlas-mark.svg` e `datatlas-logo.svg`.
- Demonstração: `demo/vendas.csv`, dados inteiramente sintéticos.
- Testes: `tests/` e `frontend/e2e/`.
- Dependências: `requirements.txt`, `requirements-dev.txt`, `requirements-lock.txt`, `frontend/package.json` e `frontend/package-lock.json`.
- Modelo de configuração sem segredos: `.env.example`.
- Evidências: `docs/VALIDACAO.md`, `docs/REVISAO-UX.md`, capturas PNG e relatório HTML de demonstração.
- O ZIP transferível inclui os fontes, o build, a demonstração e estes documentos. Não inclui ambientes instalados, chave, `.env`, contador SQLite ou arquivos de usuários.

Não confunda o nome da pasta legada `ai-analytics-copilot` com o nome público: **DatAtlas**. Não há necessidade de renomear a pasta Windows. O diretório de implantação no Linux pode ser um diretório próprio, como `/opt/datatlas`, depois de verificar que ele não existe ou não contém outros dados.

## 3. Produto e comportamento que devem ser preservados

Aplicação self-service de exploração de datasets arbitrários, e não monitoramento operacional predefinido. Upload CSV/XLSX, prévia, tipos inferidos, qualidade, estatísticas, filtros automáticos, gráficos, ranking, assistente e relatório HTML imprimível como PDF.

- Nome e logo **DatAtlas**. Seção principal **Painel analítico**, além de Qualidade e Dados.
- Filtros automáticos após 240 ms de pausa, combinados com E. Botão **Limpar filtros** visível, removendo regras e seleção.
- Clique na barra/ranking seleciona uma categoria; novo clique desfaz. Indicadores, qualidade, tabela, pergunta e exportação usam o mesmo recorte.
- Gráfico/ranking mantêm o contexto dos filtros de coluna sem a própria seleção visual, permitindo trocar de categoria. O escopo está identificado na tela.
- Top 20, ordenação decrescente. Percentuais somente para contagem/somas não negativas, com denominador de todos os grupos do contexto. Barras do ranking usam o maior valor absoluto como base.
- Atualizações preservam o painel; respostas antigas são canceladas/ignoradas. Exportação e novas perguntas ficam bloqueadas enquanto o recorte está desatualizado ou com erro.
- Assistente recolhível/expansível, conversa preservada entre seções na sessão. Gemini automático no envio de uma pergunta, sem checkbox. Não chamar Gemini ao abrir páginas ou mudar filtros.
- Ajuda **?** junto às ações. Não restaurar os textos de workspace, status local/gratuito, subtítulo antigo, apresentação de portfólio, rodapé descritivo ou o bloco de privacidade no chat que o usuário pediu para remover. Informações essenciais permanecem na ajuda e no README.

## 4. Stack, execução e arquitetura

Python 3.12, FastAPI/Uvicorn, Pandas, openpyxl, Google Gen AI SDK; React, Vite e Recharts. O próprio FastAPI serve `frontend/dist`, com recursos locais e chamadas relativas a `/api`. Não há CDN, banco de datasets, Redis, n8n ou dependência do Projeto 1. Não adicionar infraestrutura pesada sem necessidade.

Windows: `Iniciar.cmd` chama `start.ps1`. Porta local atual: `127.0.0.1:8012`.

No Linux, recriar o ambiente; **não copiar `.venv` do Windows**. Após verificar Python/arquitetura e compatibilidade das dependências, a sequência básica é:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8012 --workers 1 --limit-concurrency 8 --timeout-keep-alive 5 --no-access-log
```

Esses comandos não configuram um serviço de produção. Primeiro confirme que a porta está livre, escolha usuário/pasta próprios e adapte a inicialização à VM real. Use um único worker: o armazenamento de datasets é por processo. Não vincular a API publicamente em `0.0.0.0` para contornar o proxy.

`requirements-lock.txt` registra o ambiente de desenvolvimento Windows, incluindo ferramentas de teste. Verifique compatibilidade no Linux/ARM64 antes de usá-lo diretamente. Se precisar resolver dependências para a VM, mantenha os limites de versões, gere um lock específico e execute os testes. Não instalar compiladores ou pacotes grandes por tentativa sem examinar as wheels disponíveis e o espaço livre.

O build incluído evita exigir Node na VM para servir a aplicação. Se alterar o frontend, use Node 24 e reconstrua com o lockfile. Os testes de navegador usam Chrome em caminho Windows por padrão; informe `CHROME_PATH` apropriado no ambiente de teste ou adapte a configuração com justificativa. Não instalar interface gráfica na VM somente para testar.

## 5. Contratos da API

| Rota | Contrato |
|---|---|
| `GET /api/status` | Modo, limites e disponibilidade de configuração Gemini; não retorna segredos |
| `POST /api/upload?name=arquivo.csv` | Corpo binário bruto do arquivo, **não multipart** |
| `POST /api/demo` | Cria uma base sintética temporária |
| `DELETE /api/datasets/{id}` | Exclui dataset da memória |
| `POST /api/datasets/{id}/analyze` | Perfil e agregações do recorte |
| `POST /api/datasets/{id}/ask` | Pergunta, resposta, origem, nota e evidências |
| `POST /api/datasets/{id}/report` | HTML como download `relatorio-analise.html` |

Consulta: `filters` (até 8), `selection` opcional, `group`, `metric`, `aggregation`. Filtro: `column`, `op` (`eq`, `contains`, `gte`, `lte`, `isnull`), `value` textual. Agregações: `sum`, `mean`, `count`, `min`, `max`.

`chart` representa o recorte completo; `context_chart` o contexto sem a seleção visual. Há `context_rows` e `applied_query`. Pergunta acrescenta `question` (3–500 caracteres). O campo legado `consent` é opcional; omitido usa Gemini quando configurado, `false` força cálculo local para compatibilidade e testes. A interface atual não envia esse campo.

## 6. Gemini: configuração e proteção de credenciais

O modelo configurado é `gemini-3.1-flash-lite`, seguindo o primeiro projeto. SDK com timeout de 15 s, uma tentativa e JSON Schema em `response_json_schema`. O formato antigo `response_schema` gerou rejeição de `additional_properties` na validação real; não reintroduzir essa regressão.

A configuração local lê a chave de **`<arquivo-privado-da-chave>`**, caminho indicado pelo usuário, por meio de `GEMINI_KEY_FILE` no `.env` ignorado. Esse caminho Windows **não funcionará na Oracle**. O arquivo e a chave **não estão neste pacote**. Não criar outra chave ou trocar a do Projeto 1 sem necessidade/autorização.

Na VM, disponibilize o mesmo segredo por um canal seguro autorizado, como arquivo acessível somente ao usuário do serviço ou variável de ambiente protegida. Não colocar a chave em código, frontend, ZIP, Git, imagem de contêiner, linha de comando exposta, relatório, logs ou resposta do chat. Não pedir ao usuário que cole a chave na conversa. Evitar passar o segredo em argumentos de shell.

Exemplo de configuração **sem valores secretos**:

```dotenv
GEMINI_ENABLED=true
GEMINI_KEY_FILE=/caminho/seguro/gemini-key.txt
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_DAILY_LIMIT=30
GEMINI_BUDGET_PATH=/caminho/persistente/datatlas/gemini-quota.sqlite3
```

Como alternativa ao arquivo, usar `GEMINI_API_KEY` ou `GOOGLE_API_KEY` no ambiente do serviço. Confirmar a leitura como usuário do serviço, sem imprimir o valor. Diretório do orçamento precisa de permissão de escrita; o arquivo da credencial deve ser somente de leitura para o serviço. Não compartilhar o contador SQLite com o Projeto 1 sem desenhar isso explicitamente.

O limite local de 30 tentativas/dia persiste em SQLite. Não amplia cotas do provedor nem garante sozinho ausência de cobrança; preservar o projeto Google no Free Tier, sem ativar faturamento. O consumo do Projeto 1 e do DatAtlas pode compartilhar cotas no mesmo projeto Google. Não contornar 429 aumentando plano ou habilitando serviços pagos. Falha, cota ou formato inválido resultam em fallback local identificado nas evidências.

O Gemini recebe somente a pergunta, aliases das colunas numéricas e contagem de linhas. Não recebe células, categorias, amostras ou o dataset inteiro. A pergunta pode conter PII digitada: preservar essa informação na ajuda. A IA escolhe operação/alias permitidos; Pandas calcula os valores. Não executar código, SQL arbitrário ou instruções de arquivos.

## 7. Adaptações obrigatórias antes de acesso público

**O MVP atual foi construído para uso local e não está pronto para exposição pública irrestrita.** A tarefa de implantação deve fazer as adaptações seguintes e validá-las, sem simplesmente remover proteções:

1. **Host/Origin:** `local_only` em `backend/main.py` aceita apenas localhost/127.0.0.1/testserver e compara Origin com esquema/Host. O domínio público será recusado hoje. Adicionar configuração explícita de hosts/origens autorizados e testes; não usar wildcard e não mascarar toda requisição como localhost para burlar a proteção. Considerar TLS e cabeçalhos do proxy confiável na validação de esquema/origem.
2. **Acesso e isolamento:** não há autenticação nem vínculo de datasets a usuários; o limite de três bases é global. Para a primeira implantação, usar acesso protegido de uso pessoal. Se o objetivo for demonstração pública de portfólio, separar uma experiência com dados sintéticos e restringir upload/API/IA; se houver múltiplos usuários reais, implementar autorização por proprietário e isolamento antes de permitir arquivos pessoais. Não tratar ID aleatório de dataset como autenticação.
3. **Proxy e HTTPS:** preferir um domínio/subdomínio próprio e configuração adicional no proxy existente. A interface usa `/api` e assets absolutos: publicar na raiz de um subdomínio é mais simples. Publicação em subpasta requer adaptar base do Vite, assets e rotas; testar, não presumir que funciona. Encaminhar Web/HTTP de forma coerente, confiando somente no proxy local.
4. **Limites:** configurar corpo de upload no proxy coerente com 5 MiB e manter validação na aplicação. Definir limites de requisição/conexão compatíveis com os recursos da VM; avaliar especialmente upload, profiling, demonstração e IA. Proteger a API inteira, não apenas a página inicial.
5. **Serviço:** usuário sem privilégios, ambiente próprio, inicialização automática, reinício controlado, permissões mínimas e diretório separado de estado/cota. Verificar RAM, disco e CPU disponíveis; avaliar memória em carga antes de aumentar limites.
6. **Segredos e logs:** configuração fora do diretório público, arquivos protegidos, nenhum payload/chave em logs. Não expor credenciais SSH ou chave Gemini nas evidências.
7. **Privacidade:** sem anonimização automática e sem persistência dos datasets. HTTPS, acesso restrito e explicação de envio da pergunta ao Gemini são necessários. Não adicionar telemetria de terceiros ou envio de datasets inteiros.

Não é necessário introduzir Docker, Kubernetes, Redis ou banco externo apenas para servir o MVP. Caso a VM já use outra abordagem, avalie reutilizar seu padrão sem aumentar custos ou afetar o Projeto 1.

## 8. Limites e semântica dos dados

- Até 5 MiB por arquivo, 50.000 linhas, 60 colunas; até 2.000 caracteres por célula textual e 100 por cabeçalho único.
- XLSX: primeira aba, sem fórmulas/macros, até 30 MiB descompactados e 1.000 entradas ZIP. Um upload processado por vez.
- Até 3 datasets globais em memória. Após 30 min sem acesso, limpeza na próxima operação. Reiniciar o serviço apaga todos os datasets. Fechar/recarregar a página perde a referência da interface. Não prometer histórico ou recuperação.
- Prévia de 100 linhas; cálculos usam todo o recorte.
- CSV UTF-8/BOM ou fallback Windows-1252; separadores vírgula, `;`, tab ou `|`; `;` usa vírgula decimal. Datas ISO inferidas; tipos podem precisar de revisão prévia.
- Nulos ignorados nas estatísticas; desvio padrão amostral; duplicatas completas além da primeira. Outliers IQR × 1,5, sem remoção automática. Soma de grupo totalmente nulo permanece nula.
- Cálculos usam ponto flutuante. Não é sistema contábil, previsão ou ferramenta de inferência causal.
- JSON limitado a 32 KiB; pergunta até 500 caracteres. Sem código/SQL/fórmulas arbitrários.

## 9. Validação já realizada

Na versão local atual: **29 testes pytest**, **14 jornadas Playwright no Chrome**, ESLint, Ruff e build Vite aprovados. Validado desktop, tablet e celular, incluindo 320 px, estados vazios, texto longo, 5.000 registros, filtros combinados, seleção/toggle, cancelamento de respostas antigas, falhas recuperáveis, exportação e retry com recorte novo, conversa entre telas, marca/textos removidos e amostras de contraste.

Gemini configurado com a credencial externa e validado com pergunta real sobre a base sintética. Soma de receita: **419.683,10**, origem `Gemini + cálculo local`. O provedor não gerou o número; selecionou a operação e o backend calculou. Os testes automáticos usam mocks/modo local para evitar chamadas externas repetidas.

Há um aviso de descontinuação do adaptador `httpx` no TestClient da versão de Starlette instalada; os testes passam. Não houve auditoria independente de segurança, certificação integral de acessibilidade ou teste de carga no máximo de 50.000 linhas.

Comandos de desenvolvimento (na raiz e depois em `frontend`):

```sh
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
.venv/bin/python -m ruff check backend tests scripts
.venv/bin/python -m ruff format --check backend tests scripts
cd frontend
npm ci --no-audit --no-fund
npm run lint
npm run build
# Com servidor de teste ativo e navegador configurado:
npm run test:e2e
```

## 10. Informações que o próximo Work precisa obter

Não presumir IP, região, tenancy, sistema operacional, CPU/arquitetura, domínio, DNS, usuário SSH, chave SSH, proxy ou nome de serviço. Eles não foram fornecidos a este projeto. Inspecionar o ambiente autorizado e consultar o contexto da implantação existente antes de pedir informações já disponíveis. Se faltar acesso, pedir somente o necessário por canal seguro, sem solicitar segredos na conversa.

Antes de modificar a VM, registrar serviços/portas existentes, uso de recursos e configurações relevantes. Fazer backup da configuração que precisar mudar. Confirmar um endereço e pasta separados do Projeto 1. Preparar rollback específico do DatAtlas; não usar reset/limpeza global e não sobrescrever diretórios de aplicações existentes.

## 11. Critérios de conclusão da implantação

- URL correta com HTTPS e política de acesso apropriada; não deixar upload/IA pessoais irrestritos.
- DatAtlas operando sem prejudicar a URL/serviços do Projeto 1.
- Demonstração, upload CSV/XLSX autorizado, erro de arquivo, qualidade, filtros, ranking, seleção, assistente e relatório validados pelo endereço real.
- Testes novos de domínio/Origin/proxy e autorização; nenhum acesso cruzado entre usuários se essa modalidade existir.
- Uma chamada Gemini sintética de verificação quando o Free Tier estiver confirmado, além de fallback testado sem consumir a API repetidamente. Não gerar respostas fictícias para aparentar integração ativa.
- Verificação de segredos: ausentes no build, resposta HTTP, ZIP, Git e logs; credenciais com permissões adequadas.
- Serviço disponível após reinício controlado, quota persistente e limites conservados. Documentar que datasets em memória não sobrevivem ao reinício.
- Entregar URL, serviços/portas/pastas criados, comandos de operação, testes realizados, estado do custo, limitações e procedimento de rollback.

Se faltar credencial, DNS, acesso SSH ou recurso gratuito suficiente, preparar tudo o que for possível e informar exatamente a dependência restante. Não afirmar que o site foi publicado sem verificar o endereço real.
