# Revisão de design e experiência — 13/11/2026

Implementação baseada nas instruções fornecidas em `Texto colado.txt`, aplicada exclusivamente ao Copiloto de Análise de Dados. Não houve publicação, push, mudanças no Projeto 1, n8n ou Oracle.

## Estado encontrado

A pasta possuía dependências Python/Node e arquivos gerados, mas não estavam disponíveis os fontes da API/interface, a interface compilada, os atalhos ou o README da entrega anterior. Não era um repositório Git local, portanto não havia histórico local para restaurar esses arquivos. A base foi reconstituída conforme o escopo e os contratos da entrega anterior, sem apagar as pastas existentes, e validada junto com a revisão. Bibliotecas já disponíveis foram reutilizadas; nenhuma dependência de aplicação nova foi instalada.

## Mudanças concretas

| Área | Resultado |
|---|---|
| Identidade | Paleta verde preservada, contraste reforçado, tamanhos de texto maiores e componentes com tokens comuns. Ícones locais em SVG, sem fontes remotas. |
| Organização | Cabeçalho disponível durante a rolagem, três seções claras: Painel analítico, Qualidade e Dados. Assistente saiu da navegação para um widget recolhível. |
| Densidade | Margens e preenchimentos consistentes. Gráfico/ranking alinhados pelo topo, sem forçar alturas iguais. Indicadores compactos; ajuda secundária recolhível. |
| Filtros | Regras com aplicação automática após 240 ms de pausa, combinadas com E; remoção individual e limpeza global. Sem botão Aplicar. |
| Seleção visual | Barras e ranking selecionam/desfazem o grupo. Marcador e estado selecionado distinguem o recorte. Filtros de qualidade permitem investigar nulos por coluna. |
| Ranking | Posições numeradas, destaque discreto para três primeiros, barras proporcionais e participação somente quando semanticamente válida. Valores acessíveis por teclado. |
| Atualização | Dados anteriores permanecem visíveis e rotulados; abort/cancelamento e sequência impedem sobrescrita por resposta antiga. Foco e DOM principal preservados. |
| Erros | Mensagem útil, dados anteriores preservados e ação Tentar novamente. Upload inválido não substitui a análise atual. |
| Exportação | Bloqueada durante atualização ou recorte inválido. Captura a consulta atual; retry usa o recorte atual, mesmo se ele mudou após a falha anterior. |
| Assistente | Flutuante, recolhível/expansível, conversa mantida entre seções, mensagens roláveis, envio/erro/limites e evidências por consulta. Gemini automático no envio da pergunta; sem checkbox ou bloco auxiliar no chat. |
| Acessibilidade | Foco visível, atalho para conteúdo, campos nomeados, regiões de rolagem focáveis, controles por teclado, contraste em textos essenciais e preferência por movimento reduzido. |
| Telas pequenas | Indicadores em duas colunas, ações reorganizadas, tabelas com rolagem interna. Acesso ao assistente encaixado no cabeçalho móvel, sem cobrir controles do gráfico. |

## Significado dos recortes

Indicadores, dados, qualidade, perguntas e relatório usam filtros de coluna **e** seleção visual. Gráfico e ranking usam os filtros de coluna e mantêm as demais categorias para trocar a seleção. Esse contexto mais amplo é identificado no gráfico e no ranking. O relatório exporta apenas o recorte selecionado.

Não foram criados indicadores de tendência, período anterior ou metas sem dados de suporte. As linhas de gráfico continuam ordenadas pelo valor, não pela data. Percentuais do ranking usam o total de todos os grupos do contexto, inclusive os fora do top 20; não são usados para médias/extremos ou somas negativas. Uma seleção nula usa operador `isnull`, distinto de uma categoria textual chamada `(nulo)`.

## Contratos e manutenção

Endpoints anteriores preservados. Consulta ganhou `selection` opcional; análise ganhou `context_chart`, `context_rows` e `applied_query`. `chart`, `labels`, `values`, filtros e formato principal de perguntas/relatórios continuam disponíveis. Grupos retornam filtros tipados pelo servidor, sem usar rótulo truncado como identificador.

O frontend foi separado em componentes, helper de API e hook de análise. O build foi dividido em aplicação e biblioteca de gráficos; não há aviso de bundle acima de 500 kB nesta entrega. Os arquivos de fonte e scripts de execução voltaram a estar presentes na pasta final.

## Fora do escopo e limitações

Sem hospedagem, autenticação, persistência de datasets ou banco externo. O modo local continua disponível. Gemini configurado com credencial externa, leitura apenas no servidor, orçamento diário e fallback; validado com mocks e uma resposta real sobre dados sintéticos. Não há anonimização automática, seletor de aba, editor de tipos, previsão ou SQL livre. Chat é da sessão/dataset, não um histórico persistido. Não houve auditoria independente de segurança ou certificação completa de acessibilidade. Consulte `VALIDACAO.md` para evidências e alcance dos testes.

## Identidade DatAtlas

Nome aplicado ao produto, título do navegador, API, relatório e documentação. Logo vetorial em `frontend/public/branding/datatlas-mark.svg` e versão horizontal em `datatlas-logo.svg`: monograma D/A com referência a orientação e leitura de dados. Arquivos leves e escaláveis, sem fonte remota ou dependência adicionada. O nome da pasta local permanece igual para preservar os atalhos e o ambiente instalado.

A seção principal chama-se **Painel analítico**, pois explora datasets arbitrários e não monitora uma operação predefinida. Foram removidos subtítulo de marca, rótulos de workspace, status local/gratuito, rodapé descritivo e apresentação lateral. A ajuda **?** fica ao lado das ações. Informações essenciais de limites e envio de dados permanecem dentro da ajuda e do README.
