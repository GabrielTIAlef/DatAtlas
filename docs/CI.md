# Validação automática no GitHub

O titular autorizou publicar o DatAtlas em um repositório público próprio, separado do Projeto 1. O workflow `.github/workflows/validate.yml` executa em push, pull request e manualmente: Python 3.12 via `requirements-linux.lock`, Node 24, `npm ci`, lint/build da interface, pytest/Ruff e jornadas Playwright em Chromium. O servidor de teste roda somente no runner, não na VM Oracle.

Não incluir `.env`, chaves, cookies, datasets reais, `.venv`, dumps, estado SQLite, arquivos da pasta `.local` ou `node_modules`. O workflow usa `GEMINI_ENABLED=false`; os testes que verificam respostas Gemini usam mocks. Não há chave Google ou acesso SSH nos Secrets/Actions e nenhum teste remoto depende da Oracle ou dos arquivos do Projeto 1.

O runner padrão do repositório público não exige ativação de plano pago. Não foi configurado runner maior, implantação automática nem integração paga. Em falha de navegador, evidências ficam como artefato por sete dias, somente com dados sintéticos.
