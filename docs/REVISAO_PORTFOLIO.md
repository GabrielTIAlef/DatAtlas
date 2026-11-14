# Revisão de apresentação e evidências — 13/11/2026

Base inspecionada: `ee19b1dfc8c236e7e49c303dc98b1c101559581e`, branch `main`.

## Objetivo

Apresentar o DatAtlas como estudo de análise exploratória, qualidade dos dados,
coerência de indicadores e IA com cálculo verificável. O foco é a avaliação do
conhecimento e das decisões do autor por recrutadores.

## Alterações desta revisão

- README inicia pelo problema, atuação e decisões, com links para evidências.
- Exemplo analítico mostra a base completa, Sul e Sul + Digital; os valores foram
  conferidos no CSV sintético, sem atribuir resultado empresarial à amostra.
- [Estudo de caso](ESTUDO_DE_CASO.md) detalha qualidade, denominadores, interpretação
  dos recortes e separação entre IA e cálculo.
- Instruções de uso e contratos técnicos foram preservados em blocos expansíveis.
- Caminhos pessoais de diretório/chave foram substituídos por referências genéricas
  nos documentos de implantação. Isso não altera versões históricas do Git.
- Um item de pendências que ainda tratava isolamento por sessão como não implementado
  foi corrigido, de acordo com código, testes e registro de atualização existentes.
- Registros históricos de validação e preparação receberam indicação de contexto,
  para não serem confundidos com o estado atual.
- Duas jornadas Playwright passaram a salvar relatório e capturas em
  `testInfo.outputPath`, dentro da pasta de resultados, em vez de sobrescrever
  as evidências versionadas em `docs/` durante a execução da suíte.

Nenhuma mudança funcional ou nova dependência de aplicação foi necessária nesta
rodada. Não foi executado script de implantação nem alteração em VM.

## Verificações executadas nesta rodada

Windows, Python 3.12, ambiente virtual novo a partir de `requirements-lock.txt`;
Node 24 e frontend instalado pelo lockfile. O backend de teste foi servido somente
em loopback, porta dedicada 8023. Não se utilizou `.env` de outra instalação.

| Verificação | Resultado |
| --- | --- |
| pytest | 49 aprovados |
| Ruff check | Aprovado |
| Ruff format --check | 20 arquivos conformes |
| ESLint | Aprovado |
| Build Vite | Aprovado, saída isolada em diretório ignorado |
| Playwright / Chrome local | 14 jornadas aprovadas |
| Regressão após ajustar destino dos artefatos | As duas jornadas alteradas reaprovadas |
| Contagens/somas da demo | Conferidas diretamente no CSV, com Decimal |

Gemini estava desativado no servidor de teste. Os casos de integração usam mocks
e fallback, sem consumo real do provedor. As jornadas de navegador utilizaram
apenas dados sintéticos; não testaram o domínio público nesta revisão.

O build local gerou os mesmos nomes de bundles publicados, mas seus arquivos não
foram substituídos por esta revisão documental. Não houve deploy automático.

Aviso observado: a combinação instalada de Starlette/TestClient avisa sobre a
descontinuação do adaptador `httpx`. Os testes passaram. O gerenciador também
avisou sobre suporte da versão ESLint 9. Não foram realizadas atualizações
maiores de dependências sem necessidade para este escopo.

## Segurança e limites da inspeção

Foi executada busca por padrões de chaves Google/GitHub/AWS, chaves privadas,
URLs de banco com senha e caminhos pessoais em 68 blobs alcançáveis do histórico.
Não houve correspondência dos padrões de segredo; apareceram caminhos pessoais
em dois documentos, generalizados na versão proposta. A busca não certifica
ausência de segredos em todos os formatos, imagens, caches ou referências internas.

Não foram inspecionados console Oracle/Google, faturas, credenciais privadas,
serviços corporativos ou o estado atual da VM. A documentação operacional mantém
seu caráter de registro histórico.

## Limites mantidos

Tipos inferidos podem alterar identificadores com zeros iniciais; linha do gráfico
segue ranking; valores monetários usam ponto flutuante; dados ficam temporariamente
em memória. A descrição continua explícita. Não se atribuem causalidade, previsão,
impacto financeiro ou escala produtiva aos resultados da demonstração.

O CI da versão inspecionada estava aprovado:
https://github.com/GabrielTIAlef/DatAtlas/actions/runs/43528744808 .
Este registro descreve verificações locais anteriores à publicação das propostas.
