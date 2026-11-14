# DatAtlas — da planilha ao recorte verificável

## Contexto e finalidade

Estudo autoral para apresentar competências de análise de dados, BI e IA aplicada.
O cenário é uma planilha heterogênea que precisa ser compreendida antes de apoiar
interpretações. A demonstração utiliza dados fictícios de vendas.

O projeto reúne exploração da base, estatísticas, agregações, filtros, perguntas
e comunicação de resultados. A interface permite observar o raciocínio em ação;
a implantação não é apresentada como impacto empresarial ou produto adotado.

## Perguntas orientadoras

1. Quais problemas de qualidade merecem investigação?
2. Como conferir a população usada em cada número?
3. O percentual do ranking considera só os grupos visíveis ou o contexto completo?
4. Uma pergunta e um relatório continuam ligados aos filtros escolhidos?
5. A IA precisa receber os registros ou gerar os valores da resposta?

## Contribuição e decisões

O trabalho apresentado envolve leitura de CSV/XLSX, validação e perfil da base,
contratos da API, coordenação da análise na interface e integração do assistente.

- **Qualidade antes de correção automática:** nulos, duplicatas e IQR são
  apresentados como evidências. O projeto não remove registros silenciosamente
  nem afirma que todo valor extremo é erro.
- **Recorte explícito:** filtros de coluna são combinados com E. A seleção visual
  afeta os indicadores, a prévia, a pergunta e o relatório. O gráfico e o ranking
  mantêm as outras categorias para permitir navegação, com escopo indicado.
- **Denominador adequado:** o ranking mostra até 20 grupos, mas os percentuais
  elegíveis usam todos os grupos. Média, extremos e somas negativas não recebem
  percentuais de participação inadequados.
- **IA separada do cálculo:** o modelo retorna uma operação permitida e um alias
  de coluna. O contrato é validado; Pandas calcula o resultado e devolve o recorte
  nas evidências. O fallback local mantém as operações suportadas.
- **Comunicação consistente:** o relatório recalcula a seleção solicitada e
  registra filtros e estatísticas, em vez de exportar números antigos da tela.

Veja [a API e os cálculos](../backend/main.py),
[o controle das consultas](../frontend/src/useAnalysis.js),
[a visualização](../frontend/src/ChartPanel.jsx) e
[os testes de ranking](../tests/test_ranking.py).

## Exemplo: como interpretar a base de demonstração

O CSV publicado tem 363 linhas, sete colunas, duas células ausentes e três
duplicatas completas além da primeira ocorrência. Um registro de receita
42.000 foi deliberadamente inserido pelo gerador como extremo.

| Seleção | Linhas | Soma da coluna receita |
| --- | ---: | ---: |
| Sem filtro | 363 | 419.683,10 |
| Região Sul | 68 | 66.179,10 |
| Região Sul e canal Digital | 25 | 24.259,80 |

Os resultados foram conferidos diretamente em [vendas.csv](../demo/vendas.csv).
O teste deve confirmar que a pergunta e o relatório retornam os mesmos números
sob a mesma seleção. A soma não exclui duplicatas ou extremos automaticamente.

Interpretar o recorte Digital como queda de receita seria incorreto: trata-se
de uma subpopulação, não de uma comparação temporal. Da mesma forma, um alerta
IQR apenas direciona investigação; é necessário conhecer a origem e o processo
de registro antes de corrigir ou excluir o valor.

Essas observações demonstram cuidado com qualidade, denominadores e interpretação.
Não se atribui moeda, receita contábil ou resultado real a essa amostra fictícia.

## Competências que o caso permite avaliar

| Competência | Evidência |
| --- | --- |
| Análise exploratória | Perfil por coluna, estatísticas, nulos, duplicatas e alertas |
| BI e visualização | Recortes coordenados, ranking, percentuais e exportação |
| Python e contratos | Pandas, leitura CSV/XLSX, FastAPI e Pydantic |
| IA aplicada | Operações restritas, aliases, cálculo local e evidências |
| Qualidade da entrega | pytest, Playwright, lint, lockfiles e CI |
| Privacidade no escopo | Dados efêmeros, propriedade por sessão e envio limitado ao provedor |

## Limites e escolhas para discussão

O projeto é descritivo. Não realiza previsão, inferência causal, análise de
campanhas ou recomendações comerciais validadas. Identificadores numéricos e
tipos inferidos merecem contrato explícito em uma evolução. O gráfico de linha
atual segue o ranking, sem garantia de ordenação cronológica.

Os dados permanecem na memória de um processo. Persistência, contas e grandes
volumes não foram acrescentados apenas para ampliar a stack. Um banco não é
necessário para demonstrar este fluxo de exploração temporária.

Os controles não detectam ou anonimizam automaticamente dados pessoais. A
demonstração pública e as evidências usam registros sintéticos; avaliar o projeto
não exige enviar planilhas pessoais ou dados de uma antiga empresa.

## Evidências e reprodução

- [Captura desktop](revisao-desktop.png) e [mobile](revisao-mobile.png).
- [Relatório sintético exportado](exemplo-relatorio.html).
- [Registro histórico de validação](VALIDACAO.md) e [CI](CI.md).
- [README com roteiro completo de execução](../README.md).

Resultados empresariais, economia de tempo e adoção por equipes não foram medidos
neste estudo. A evidência é o comportamento do fluxo e a coerência dos números
sob recortes definidos.
