# DatAtlas — Análise de Dados

[Abrir demonstração](https://datatlas.inteligencia-operacional.duckdns.org/) · [Testes automáticos](https://github.com/GabrielTIAlef/DatAtlas/actions/workflows/validate.yml)

Aplicação local self-service para explorar CSV/XLSX: qualidade, estatísticas, filtros combinados, gráficos e ranking interativos, perguntas com evidências e relatório exportável. Python 3.12 + FastAPI + Pandas + React + Recharts. Projeto de portfólio independente do Agente de Inteligência Operacional, sem dependência de n8n, Oracle ou infraestrutura externa.

**Implantação Oracle em 13/11/2026:** https://datatlas.inteligencia-operacional.duckdns.org/, com HTTPS e acesso público sem login. Cada navegador recebe uma sessão protegida, e os datasets são vinculados a ela. Os dados são temporários. Consulte [operação, testes e rollback](docs/ORACLE-DEPLOYMENT.md). O código é publicado neste repositório próprio, separado do Agente de Inteligência Operacional, após autorização do titular.

![Painel DatAtlas com dados sintéticos](docs/revisao-desktop.png)

## Abrir o aplicativo

1. Na pasta do projeto, dê dois cliques em **Iniciar.cmd**.
2. Mantenha a janela aberta e acesse **http://127.0.0.1:8012**.
3. Clique em **Usar demonstração** ou carregue uma planilha sua, preferencialmente anonimizada.
4. Para encerrar, pressione Ctrl+C na janela do servidor.

A interface compilada já está incluída. Não precisa de Node em execução, Docker ou banco de dados. O painel funciona localmente; a IA usa a configuração do Gemini no servidor e dispõe de fallback local. A execução é gratuita, sem recursos de cloud criados.

Se o ambiente Python não existir, execute `powershell -NoProfile -ExecutionPolicy Bypass -File .\setup.ps1`. Ele usa o Python 3.12 instalado em `%LOCALAPPDATA%\Programs\Python\Python312`; para outro local use `-PythonExe 'C:\caminho\python.exe'`. Bibliotecas são instaladas somente no ambiente `.venv` do projeto. Para mudar a porta, edite `start.ps1`.

## Fluxo e interações

- **Painel analítico:** indicadores, gráfico, ranking, insights descritivos e prévia dos dados.
- **Qualidade:** tipos inferidos, nulos, únicos, outliers e estatísticas. A quantidade de nulos por coluna permite filtrar as linhas daquela coluna.
- **Dados:** primeiras 100 linhas do recorte, com rolagem interna e cabeçalhos disponíveis.
- **Assistente:** botão flutuante em todas as seções; expande, recolhe e conserva a conversa durante a navegação. As evidências de cada resposta registram o recorte original daquela pergunta. Trocar/excluir o dataset inicia outra conversa.

### Filtros automáticos e seleção visual

Clique em **Adicionar filtro**, escolha a coluna, operador e valor. Não existe botão Aplicar: mudanças válidas são enviadas após uma breve pausa de digitação (240 ms). Filtros se combinam com **E**; até 8 regras de coluna mais uma seleção visual. Cada regra pode ser removida; **Limpar filtros** remove regras e seleção.

Clique em uma barra ou em um item do ranking para filtrar os indicadores, prévia, qualidade, assistente e exportação. Clique no item selecionado novamente ou remova o marcador para desfazer. O ranking oferece a mesma interação por teclado, além dos valores acessíveis sem depender do tooltip.

**Gráfico e ranking mantêm o contexto dos filtros de coluna, excluindo somente a própria seleção visual.** Isso permite trocar de categoria sem limpar tudo. O escopo está indicado na interface. Os outros componentes usam o recorte completo, incluindo a seleção. Não há comparações fictícias com períodos anteriores ou conclusões causais.

O ranking é ordenado do maior para o menor e mostra até 20 grupos. As barras são proporcionais ao maior valor absoluto nesse ranking. Percentuais aparecem apenas para contagem ou soma não negativa, com denominador de todos os grupos do contexto, inclusive os não exibidos. Média, mínimo, máximo ou somas com valores negativos não recebem percentuais de participação. A visualização de linha segue o ranking, não a cronologia.

Durante atualização, os dados anteriores permanecem visíveis, com indicação de que ainda não correspondem à seleção. Respostas antigas são canceladas/ignoradas. A exportação e novas perguntas ficam bloqueadas até que o recorte atual esteja validado. Em caso de erro, os dados não desaparecem; há mensagem e ação de tentar novamente. Erro num novo upload preserva o dataset anterior.

### Relatório

**Exportar relatório** baixa HTML com dataset, data/hora UTC, número de linhas, filtros, seleção, estatísticas, insights e agregações do recorte exportado. Não inclui categorias fora da seleção, embora o gráfico interativo da tela mantenha esse contexto para navegação. O endpoint recalcula o recorte solicitado; não reutiliza números antigos da interface. Abra o HTML no navegador e use Imprimir → Salvar PDF. O relatório ainda não incorpora o gráfico como imagem.

## Demonstração

`demo/vendas.csv`: 363 linhas sintéticas, 7 colunas, 2 células ausentes, 3 duplicatas completas e um valor extremo deliberado. Não contém dados pessoais reais. Gerador determinístico: `scripts/generate_demo.py` (preserva a base se ela já existir).

Experimente selecionar **Sul** no ranking: 68 linhas e soma de receita de aproximadamente **66.179,10**. O assistente responde “Qual a soma de receita?” com o mesmo valor e as evidências. Combine com `canal = Digital` e confira a mudança coordenada nos componentes. Os cálculos usam ponto flutuante, com arredondamento apenas de exibição; não substituem escrituração contábil.

## Como funciona

```text
React / navegador (assets e gráficos locais)
   → FastAPI em 127.0.0.1:8012
   → validação CSV/XLSX → Pandas em memória
   → filtros de coluna → contexto do gráfico e ranking
   → seleção visual → indicadores, prévia, perguntas e relatório
   → Gemini no envio da pergunta para escolher operação e alias válidos
```

Não foi necessário DuckDB para este volume. Use somente um processo/worker: os datasets estão na memória desse processo. `backend/main.py` preserva os endpoints `/api/status`, `/api/upload`, `/api/demo`, `/api/datasets/{id}/analyze`, `/ask`, `/report` e exclusão. A revisão adiciona `selection` opcional à consulta, `context_chart`, itens tipados e `applied_query` à resposta, mantendo `chart`, `labels`, `values` e os filtros anteriores compatíveis.

`frontend/src` separa gestão de consultas, filtros, tabela, qualidade, gráficos e assistente. `frontend/dist` contém o build pronto. `tests` valida a API; `frontend/e2e` valida fluxos reais no navegador; `docs` reúne decisões, resultados e capturas. Nenhuma credencial é necessária no frontend.

## Segurança, privacidade e limites

| Recurso | Limite/comportamento |
|---|---|
| Arquivo | 5 MiB, CSV ou XLSX |
| Dataset | 50.000 linhas e 60 colunas |
| Texto | Célula até 2.000 caracteres; cabeçalho único até 100 |
| XLSX | Primeira aba; sem fórmulas/macros; até 30 MiB descompactados e 1.000 entradas ZIP |
| Upload | Um processamento por vez |
| Memória | Até 3 datasets no servidor e 2 por sessão pública; 24 MiB por base e 48 MiB no total; 30 min sem acesso, com limpeza na próxima operação |
| JSON | Até 32 KiB por requisição |
| Pergunta | Até 500 caracteres; uma em envio por vez na interface |

CSV aceita vírgula, ponto e vírgula, tabulação e barra vertical; UTF-8/BOM e fallback Windows-1252. `;` usa vírgula decimal. Campos por linha devem ser consistentes. Datas ISO são reconhecidas; datas brasileiras ambíguas permanecem texto. Tipos são inferidos: identificadores numéricos podem perder zeros à esquerda. Não há editor de tipos ou seletor de aba neste MVP.

Nulos são ignorados nas estatísticas; desvio padrão é amostral. Duplicatas comparam a linha inteira além da primeira ocorrência. Outliers: fora de `Q1 − 1,5 × IQR` e `Q3 + 1,5 × IQR`; não são removidos. Com IQR zero, valores diferentes do intervalo degenerado podem ser marcados. Grupo cuja métrica está inteiramente nula permanece sem valor, inclusive na soma.

O arquivo original nunca é modificado. Não salvamos uploads em disco, nem executamos fórmulas, macros, código Python, SQL ou instruções de células. Textos da interface e relatório são escapados. Host/Origin são validados sem wildcard, e a API escuta somente em localhost. O acesso público usa uma sessão por navegador, em cookie assinado, Secure, HttpOnly, SameSite Strict e restrito ao host. Análise, pergunta, relatório e exclusão conferem o proprietário; conhecer apenas o ID de um dataset não permite acessá-lo. Não há contas, histórico de usuários ou recuperação de sessão. Abas do mesmo perfil de navegador compartilham a sessão; não compartilhar cookies ou perfil com outras pessoas. No modo local, os hosts continuam restritos a localhost.

Exclua o dataset pelo botão da interface para liberar a memória imediatamente. Reiniciar/encerrar o servidor apaga as bases. Recarregar a página perde sua referência na interface; não há persistência ou histórico em disco. O relatório pode conter dados sensíveis. Não há detecção/anonimização automática de PII; revise os dados e exportações antes de compartilhar.

## Gemini e custo

O Gemini é acionado automaticamente ao enviar uma pergunta. Usa o SDK `google-genai`, o modelo `gemini-3.1-flash-lite`, timeout de 15 segundos e uma única tentativa, seguindo o padrão do Projeto 1. Não existem checkbox ou confirmação por pergunta. Não há chamadas ao abrir a aplicação ou mudar filtros.

A configuração local usa `GEMINI_KEY_FILE` no `.env` ignorado, apontando para o arquivo de chave informado pelo usuário. A credencial continua nesse arquivo externo; não é copiada para o frontend, repositório ou relatório. Também é possível usar `GEMINI_API_KEY`/`GOOGLE_API_KEY` no ambiente. Se o arquivo estiver inacessível, a configuração estiver desativada ou o provedor falhar, o cálculo local continua disponível.

O arquivo `.env.example` não contém credenciais. Um orçamento local persistente limita a 30 tentativas por dia (`GEMINI_DAILY_LIMIT`); o contador fica em `.local/gemini-quota.sqlite3`, ignorado pelo Git, sem perguntas ou dados. As cotas do Google também se aplicam. Nenhum faturamento, assinatura, recurso de cloud ou aumento de cota foi configurado. O modelo possui opção gratuita conforme a [documentação de preços do Google](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite); o orçamento local limita requisições, não determina o plano de cobrança da conta. Mantenha o projeto do provedor no Free Tier.

O provedor recebe somente a pergunta, aliases das colunas numéricas e a contagem de linhas. Não enviamos células, categorias, amostras ou dataset completo. O texto digitado pode conter dados pessoais: revise-o antes de enviar. A ajuda do botão **?** mantém essas informações acessíveis sem ocupar o chat.

A IA retorna somente uma operação permitida e um alias, validados por JSON Schema e Pydantic; os valores finais são calculados pelo Pandas. Não executa código, SQL ou instruções da planilha. Confirme operação, coluna e filtros nas evidências. Perguntas compostas, previsões e inferência causal continuam fora do escopo. A integração foi validada com uma chamada real sobre a demonstração sintética, além de testes simulados para falhas e limites.

## Desenvolvimento e testes

Python 3.12 e Node 24. A entrega reaproveita as bibliotecas locais; nenhuma dependência de aplicação foi adicionada para a revisão visual. O navegador dos testes é o Chrome existente; ajuste `CHROME_PATH` se necessário. `requirements-lock.txt` e `frontend/package-lock.json` registram as dependências.

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check backend tests scripts
.\.venv\Scripts\python.exe -m ruff format --check backend tests scripts
cd frontend
npm ci --no-audit --no-fund
npm run lint
npm run build
# Servidor em outra janela:
npm run test:e2e
```

Se `npm` não estiver disponível no PATH mas `node` estiver, as ferramentas já instaladas também funcionam diretamente: `node node_modules/eslint/bin/eslint.js .`, `node node_modules/vite/bin/vite.js build`, `node node_modules/@playwright/test/cli.js test`. Node não é necessário para uso cotidiano da interface pronta.

Consulte `docs/REVISAO-UX.md` e `docs/VALIDACAO.md` para os resultados locais originais e `docs/ORACLE-DEPLOYMENT.md` para os testes da implantação. A revisão pública passou em **49 testes pytest** e **14 jornadas Playwright** pelo domínio real, sem login. O workflow do GitHub também testa API/segurança, Ruff, frontend e navegador sem chave Gemini: veja [CI](docs/CI.md). O DatAtlas usa somente a VM Oracle existente, sem novos serviços pagos.

## Próximos passos

Seletor de aba, editor de tipos, histogramas/correlação, séries temporais cronológicas, perguntas por grupo, relatório com gráficos e políticas configuráveis de PII. Antes de multiusuário: autorização por proprietário, isolamento de dados e revisão de segurança. O Projeto 1 e sua implantação Oracle permanecem independentes.
