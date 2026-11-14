# Validação da revisão — 13/11/2026

Registro histórico da revisão inicial de interface, anterior ao acesso público por
sessão. As contagens abaixo descrevem aquela etapa. Para a revisão atual, consulte
[REVISAO_PORTFOLIO.md](REVISAO_PORTFOLIO.md); para a evolução da implantação,
[ORACLE-DEPLOYMENT.md](ORACLE-DEPLOYMENT.md).


## Ambiente

Windows, Python 3.12.10 e bibliotecas já presentes no ambiente `.venv`; Node 24.22.1 do runtime disponível; Chrome existente no computador. FastAPI servido em `127.0.0.1:8012`. Nenhuma nova infraestrutura ou dependência de aplicação foi instalada. Testes usam a demonstração local sintética e CSVs/XLSX artificiais controlados; nenhum dataset pessoal foi enviado a provedores externos.

## Resultados

- **29 testes pytest aprovados.** Upload CSV/XLSX, limites de tamanho/linhas/colunas/células, arquivos corrompidos, fórmulas, ZIP expansivo, cabeçalhos inválidos, filtros incompatíveis, JSON excessivo, expiração/capacidade, Host/Origin, HTML escapado, prompt injection sem execução, perguntas não suportadas, Gemini automático, formato JSON Schema, credencial externa, orçamento diário e fallback, dialeto brasileiro, coluna única, profiling e fluxo completo.
- Testes de recorte validam: combinação de filtros e seleção; contexto mais amplo do gráfico; API anterior sem `selection`; nulo verdadeiro versus categoria literal `(nulo)`; seleção numérica, data e texto longo; ranking com valores negativos; métricas totalmente nulas; top 20 cujo percentual usa todos os 31 grupos do contexto.
- **14 jornadas Playwright aprovadas no Chrome.** Seleção/toggle por barra e ranking; seleção por teclado; filtros automáticos combinados; limpeza individual/global; recorte vazio; assistente e conversa entre telas; evidências antigas identificadas; respostas de análise fora de ordem simuladas; dados anteriores mantidos em erro; recuperação; exportação do recorte e leitura do arquivo efetivamente baixado; retry de exportação após mudar a seleção; upload inválido preservando base; textos/valores longos; exclusão; dataset de 5.000 registros com prévia de 100 linhas e ranking de 20 grupos.
- Responsividade em desktop, tablet e celular; checagem de cabeçalho durante rolagem, ausência de transbordamento horizontal, diálogo dentro da tela e movimento reduzido. Textos essenciais testados com contraste mínimo 4,5:1; link de pular para conteúdo e foco de teclado verificados.
- **ESLint, Ruff check, Ruff format e build Vite aprovados.** Aplicação e gráficos em bundles separados, sem aviso de chunk acima de 500 kB. Nenhum erro JavaScript nas jornadas aprovadas.

## Artefatos

- `revisao-desktop.png`: painel desktop.
- `revisao-tablet.png`: reorganização tablet.
- `revisao-mobile.png`: painel móvel.
- `revisao-assistente-mobile.png`: assistente aberto em tela móvel.
- `exemplo-relatorio.html`: arquivo realmente baixado durante o teste, com dados sintéticos e filtros de canal/região.

As capturas foram inspecionadas visualmente. Textos pequenos, contraste, cabeçalho e posicionamento do assistente foram ajustados durante a verificação. As tabelas mantêm rolagem horizontal interna, sem ampliar a página.

## Limitações observadas

Há um aviso de descontinuação de `httpx` no adaptador TestClient da versão de Starlette instalada; os testes passam. A migração desse adaptador é manutenção futura, sem relação com a interface.

Gemini também foi validado com credencial real fornecida pelo usuário via arquivo externo, sem expor seu conteúdo. O modelo `gemini-3.1-flash-lite` respondeu à pergunta de soma de receita da demonstração: 419.683,10, calculados localmente e registrados nas evidências. Os testes de navegador usam o modo local explicitamente para evitar chamadas externas repetidas. Cotas e disponibilidade do provedor continuam se aplicando. Não houve teste com dados pessoais, certificação de acessibilidade completa, teste de carga com concorrência hostil ou benchmark no limite máximo de 50.000 linhas. O aplicativo continua sendo de uso pessoal local, sem login.

## Como reproduzir

Abra `Iniciar.cmd` e `http://127.0.0.1:8012`. Use **Usar demonstração**, selecione **Sul**, combine `canal = Digital`, faça uma pergunta e exporte. Os comandos de testes estão no README. Para usar outro navegador, informe `CHROME_PATH` ao Playwright.

## Atualização DatAtlas

Identidade e logo vetorial D/A próprias, título **Painel analítico**, botão **Limpar filtros** sempre disponível (desabilitado quando não há nada para limpar), remoção dos textos solicitados e ajuda **?** movida para as ações do painel. Credencial referenciada por `.env` ignorado, sem cópia do segredo. SDK, modelo, timeout e tentativa única seguem o padrão do primeiro projeto; ele não foi alterado. A validação real exigiu ajustar o envio de schema para `response_json_schema`, compatível com o formato aceito pelo provedor.
