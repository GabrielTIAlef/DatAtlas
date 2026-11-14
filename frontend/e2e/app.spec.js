import {readFile} from 'node:fs/promises';
import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
  page.createdDatasets=[];page.scriptErrors=[];
  page.on('pageerror',error=>page.scriptErrors.push(error.message));
  page.on('response',async response=>{if(/\/api\/(upload\?|demo)/.test(response.url())&&response.ok()){try{page.createdDatasets.push((await response.json()).id);}catch{/* Página pode fechar após upload. */}}});
  await page.route('**/ask',route=>route.continue({postData:JSON.stringify({...route.request().postDataJSON(),consent:false})}));
  await page.goto('/');
});
test.afterEach(async({page})=>{
  for(const id of page.createdDatasets)await page.request.delete(`/api/datasets/${id}`);
  expect(page.scriptErrors).toEqual([]);
});
async function demo(page){await page.getByRole('button',{name:'Usar demonstração'}).click();await expect(page.getByText('Recorte atualizado',{exact:true})).toBeVisible();}
async function rule(page,column,value,operator='eq'){
  await page.getByRole('button',{name:'Adicionar filtro'}).click();
  const number=await page.locator('.filter-rule').count();
  await page.getByLabel(`Coluna do filtro ${number}`,{exact:true}).selectOption(column);
  if(operator!=='eq')await page.getByLabel(`Operador do filtro ${number}`,{exact:true}).selectOption(operator);
  if(operator!=='isnull')await page.getByLabel(`Valor do filtro ${number}`,{exact:true}).fill(value);
  await expect(page.getByText('Recorte atualizado',{exact:true})).toBeVisible();
}

test('seleção coordenada, toggle e relatório com recorte correto',async({page})=>{
  await demo(page);
  await expect(page.locator('.kpi').first()).toContainText('363');
  await page.getByRole('button',{name:'Selecionar Sul',exact:true}).click();
  await expect(page.locator('.kpi').first()).toContainText('68');
  await expect(page.getByRole('button',{name:'Remover seleção Sul',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'Selecionar Norte',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Exportar relatório'}).click();
  // O endpoint e o conteúdo do download são verificados no teste de exportação abaixo.
  await page.getByRole('button',{name:'Remover seleção Sul',exact:true}).click();
  await expect(page.locator('.kpi').first()).toContainText('363');
  await rule(page,'canal','Digital');
  await page.getByRole('button',{name:'Selecionar Sul',exact:true}).click();
  await expect(page.getByText('Recorte atualizado',{exact:true})).toBeVisible();
  const preview=page.locator('.preview-panel tbody');
  await expect(preview).toContainText('Digital');
  expect(await preview.locator('tr').count()).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Limpar filtros'}).click();
  await expect(page.locator('.kpi').first()).toContainText('363');
});

test('clique na barra filtra; valores também acessíveis por teclado no ranking',async({page})=>{
  await demo(page);
  await page.locator('.recharts-bar-rectangle').first().click();
  await expect(page.locator('.selection-strip')).toBeVisible();
  await expect(page.getByText('Recorte atualizado',{exact:true})).toBeVisible();
  const button=page.getByRole('button',{name:'Selecionar Sul',exact:true});
  await button.focus();await page.keyboard.press('Enter');
  await expect(page.locator('.kpi').first()).toContainText('68');
  await page.getByRole('button',{name:'Sul',exact:false}).filter({hasText:'regiao'}).click();
  await expect(page.locator('.kpi').first()).toContainText('363');
});

test('filtros automáticos se combinam, remoção individual e recorte vazio',async({page})=>{
  await demo(page);await rule(page,'regiao','Sul');
  await expect(page.locator('.kpi').first()).toContainText('68');
  await rule(page,'receita','500','gte');
  await expect(page.getByRole('button',{name:'Limpar filtros'})).toBeVisible();
  await page.getByLabel('Valor do filtro 1',{exact:true}).fill('inexistente');
  await expect(page.locator('.kpi').first().locator('strong')).toHaveText('0');
  await expect(page.getByRole('heading',{name:'Nenhuma linha neste recorte'})).toBeVisible();
  await page.getByRole('button',{name:'Remover filtro 1',exact:true}).click();
  await expect(page.locator('.kpi').first().locator('strong')).not.toHaveText('0');
});

test('assistente mantém conversa entre seções e rotula evidências antigas',async({page})=>{
  await demo(page);
  await page.getByRole('button',{name:'Perguntar aos dados',exact:true}).click();
  await page.getByLabel('Sua pergunta').fill('Qual a soma de receita?');
  await page.getByRole('button',{name:'Enviar',exact:true}).click();
  await expect(page.locator('.assistant-message')).toContainText('Soma de receita:');
  await page.locator('.assistant-message summary').click();
  await expect(page.locator('.assistant-message pre')).toContainText('"operation": "sum"');
  await page.getByRole('dialog').getByRole('button',{name:'Fechar assistente',exact:true}).click();
  await page.getByRole('navigation',{name:'Seções da análise'}).getByRole('button',{name:'Qualidade'}).click();
  await expect(page.getByRole('heading',{name:'Qualidade por coluna'})).toBeVisible();
  await page.getByRole('button',{name:'Perguntar aos dados',exact:true}).click();
  await expect(page.locator('.assistant-message')).toContainText('Soma de receita:');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Perguntar aos dados',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Filtrar nulos de receita'}).click();
  await expect(page.locator('.kpi').first().locator('strong')).toHaveText('1');
  await page.getByRole('button',{name:'Perguntar aos dados',exact:true}).click();
  await expect(page.locator('.message-context')).toContainText('363 linhas · 0 filtros');
  await expect(page.locator('.assistant-context')).toContainText('1 linhas · 1 filtros');
});

test('respostas fora de ordem não sobrescrevem filtros recentes nem deslocam o painel',async({page})=>{
  await demo(page);
  await page.route('**/analyze',async route=>{
    const q=route.request().postDataJSON();
    const response=await route.fetch();
    if(q.filters.some(f=>f.value==='Norte'))await new Promise(resolve=>setTimeout(resolve,1100));
    try{await route.fulfill({response});}catch{/* Resposta antiga abortada pelo cliente. */}
  });
  await page.getByRole('button',{name:'Adicionar filtro'}).click();
  await page.getByLabel('Coluna do filtro 1',{exact:true}).selectOption('regiao');
  const first=page.waitForRequest(r=>r.url().endsWith('/analyze')&&r.postDataJSON().filters.some(f=>f.value==='Norte'));
  await page.getByLabel('Valor do filtro 1',{exact:true}).fill('Norte');await first;
  await expect(page.getByRole('button',{name:'Exportar relatório'})).toBeDisabled();
  await expect(page.locator('.chart-panel')).toBeVisible();
  await page.getByLabel('Valor do filtro 1',{exact:true}).fill('Sul');
  await expect(page.locator('.kpi').first()).toContainText('68');
  await page.waitForTimeout(1250);
  await expect(page.locator('.kpi').first()).toContainText('68');
  await expect(page.getByLabel('Valor do filtro 1',{exact:true})).toBeFocused();
});

test('erro mantém dados e bloqueia exportação até tentar novamente',async({page})=>{
  await demo(page);
  await page.route('**/analyze',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({detail:'Falha simulada para validar recuperação.'})}));
  await page.getByRole('button',{name:'Adicionar filtro'}).click();
  await page.getByLabel('Coluna do filtro 1',{exact:true}).selectOption('regiao');
  await page.getByLabel('Valor do filtro 1',{exact:true}).fill('Sul');
  await expect(page.getByRole('alert')).toContainText('Falha simulada');
  await expect(page.locator('.chart-panel')).toBeVisible();
  await expect(page.getByRole('button',{name:'Exportar relatório'})).toBeDisabled();
  await page.unroute('**/analyze');
  await page.getByRole('button',{name:'Tentar novamente'}).click();
  await expect(page.locator('.kpi').first()).toContainText('68');
  await expect(page.getByRole('button',{name:'Exportar relatório'})).toBeEnabled();
});

test('exportação usa exatamente filtros e seleção atuais',async({page},testInfo)=>{
  await demo(page);await rule(page,'canal','Digital');
  await page.getByRole('button',{name:'Selecionar Sul',exact:true}).click();
  await expect(page.getByText('Recorte atualizado',{exact:true})).toBeVisible();
  const [request,response,download]=await Promise.all([
    page.waitForRequest(r=>r.url().endsWith('/report')),
    page.waitForResponse(r=>r.url().endsWith('/report')),
    page.waitForEvent('download'),
    page.getByRole('button',{name:'Exportar relatório'}).click(),
  ]);
  expect(request.postDataJSON().selection.value).toBe('Sul');
  expect(request.postDataJSON().filters[0].value).toBe('Digital');
  expect(response.status()).toBe(200);
  const reportPath=testInfo.outputPath('exemplo-relatorio.html');
  await download.saveAs(reportPath);
  expect(await readFile(reportPath,'utf8')).toContain('Sul');
  expect(download.suggestedFilename()).toBe('relatorio-analise.html');
});

test('CSV válido, arquivo inválido preserva base e textos longos não estouram a página',async({page})=>{
  const long='Categoria com um nome extremamente longo '.repeat(15);
  await page.getByLabel('Carregar arquivo',{exact:true}).setInputFiles({name:'amostra-de-categorias.csv',mimeType:'text/csv',buffer:Buffer.from(`categoria,valor\n"${long}",1000000000000000\nOutra,-5\n`)});
  await expect(page.getByText('Recorte atualizado',{exact:true})).toBeVisible();
  await page.getByLabel('Métrica',{exact:true}).selectOption('valor');
  await expect(page.getByText('Recorte atualizado',{exact:true})).toBeVisible();
  await page.getByLabel('Carregar arquivo',{exact:true}).setInputFiles({name:'corrompido.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from('invalid')});
  await expect(page.getByRole('alert')).toContainText('Não foi possível ler');
  await expect(page.locator('.dataset-name')).toContainText('amostra-de-categorias.csv');
  for(const width of [1440,900,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
});

test('desktop, tablet, celular, cabeçalho fixo e movimento reduzido',async({page},testInfo)=>{
  await demo(page);
  await page.screenshot({path:testInfo.outputPath('revisao-desktop.png'),fullPage:true});
  await page.evaluate(()=>window.scrollTo(0,500));
  expect(await page.locator('.page-heading').evaluate(el=>Math.round(el.getBoundingClientRect().top))).toBe(0);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.setViewportSize({width:900,height:1024});
  await page.screenshot({path:testInfo.outputPath('revisao-tablet.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:testInfo.outputPath('revisao-mobile.png'),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  const overlaps=await page.evaluate(()=>{
    const widget=document.querySelector('.assistant-launcher').getBoundingClientRect();
    return [...document.querySelectorAll('.mobile-nav button')].some(el=>{const r=el.getBoundingClientRect();return widget.left<r.right&&widget.right>r.left&&widget.top<r.bottom&&widget.bottom>r.top;});
  });
  expect(overlaps).toBeFalsy();
  await page.getByRole('button',{name:'Perguntar aos dados',exact:true}).click();
  await page.getByLabel('Sua pergunta').fill('Quantas linhas temos?');
  await page.getByRole('button',{name:'Enviar',exact:true}).click();
  await expect(page.locator('.assistant-message')).toContainText('363 linhas');
  await page.screenshot({path:testInfo.outputPath('revisao-assistente-mobile.png')});
  const panel=await page.locator('.assistant-panel').boundingBox();expect(panel.x).toBeGreaterThanOrEqual(0);expect(panel.x+panel.width).toBeLessThanOrEqual(390);
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.locator('.analysis-content').evaluate(e=>getComputedStyle(e).transitionDuration)).toBe('0s');
});

test('exclusão libera memória e retorna ao estado inicial',async({page})=>{
  await demo(page);await page.getByRole('button',{name:'Excluir dataset da memória'}).click();
  await expect(page.getByRole('heading',{name:'Da planilha ao primeiro insight.'})).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Dataset excluído');
});

test('tentar novamente na exportação usa o novo recorte, nunca o antigo',async({page})=>{
  await demo(page);
  await page.route('**/report',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({detail:'Exportação temporariamente indisponível.'})}));
  await page.getByRole('button',{name:'Exportar relatório'}).click();
  await expect(page.getByRole('alert')).toContainText('Exportação temporariamente');
  await page.getByRole('button',{name:'Selecionar Sul',exact:true}).click();
  await expect(page.locator('.kpi').first().locator('strong')).toHaveText('68');
  await page.unroute('**/report');
  const request=page.waitForRequest(r=>r.url().endsWith('/report'));
  await page.getByRole('button',{name:'Tentar novamente'}).click();
  expect((await request).postDataJSON().selection.value).toBe('Sul');
});

test('muitos registros mantêm a prévia limitada e o cálculo completo',async({page})=>{
  const rows=Array.from({length:5000},(_,i)=>`${i},Grupo ${i%30},${i+1}`).join('\n');
  await page.getByLabel('Carregar arquivo',{exact:true}).setInputFiles({name:'base-5000.csv',mimeType:'text/csv',buffer:Buffer.from('id,grupo,valor\n'+rows)});
  await expect(page.locator('.kpi').first().locator('strong')).toHaveText('5.000');
  await expect(page.locator('.preview-panel tbody tr')).toHaveCount(100);
  await page.getByLabel('Agrupar por',{exact:true}).selectOption('grupo');
  await page.getByLabel('Métrica',{exact:true}).selectOption('valor');
  await expect(page.getByText('Recorte atualizado',{exact:true})).toBeVisible();
  await expect(page.locator('.ranking-list li')).toHaveCount(20);
});

test('textos essenciais têm contraste e atalho de teclado fica visível',async({page})=>{
  await demo(page);
  const samples=await page.evaluate(()=>{
    const lum=rgb=>rgb.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
    const parse=s=>s.match(/[\d.]+/g).map(Number);
    return ['.kpi>span','.kpi small','.dataset-name>span','.rank-number small','.panel-heading p','.primary-nav button.active','.page-heading p'].map(selector=>{
      const el=document.querySelector(selector);const fg=parse(getComputedStyle(el).color);let parent=el,bg;
      while(parent){bg=parse(getComputedStyle(parent).backgroundColor);if(bg.length===3||bg[3]===1)break;parent=parent.parentElement;}
      const a=lum(fg.slice(0,3)),b=lum(bg?.slice(0,3)||[255,255,255]);return {selector,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
    });
  });
  for(const sample of samples)expect(sample.contrast,JSON.stringify(sample)).toBeGreaterThanOrEqual(4.5);
  await page.getByRole('link',{name:'Pular para o conteúdo'}).focus();
  await expect(page.getByRole('link',{name:'Pular para o conteúdo'})).toHaveCSS('opacity','1');
});

test('marca DatAtlas, botão de limpar e interface sem textos removidos',async({page})=>{
  await expect(page).toHaveTitle('DatAtlas · Análise de dados');
  await expect(page.getByRole('heading',{name:'Painel analítico',exact:true})).toBeVisible();
  await expect(page.locator('.brand')).toHaveText('DatAtlas');
  await expect(page.getByRole('button',{name:'Ajuda e limites'})).toBeVisible();
  const text=await page.locator('body').innerText();
  for(const removed of ['ANALYTICS COPILOT','WORKSPACE','Workspace','Local · gratuito','Análise descritiva · revise antes de decidir','· sem conta','Sobre esta análise','Ambiente local','Seus dados, nesta máquina.','PORTFÓLIO / PROJETO 02'])expect(text).not.toContain(removed);
  await demo(page);
  await expect(page.getByRole('button',{name:'Limpar filtros',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Limpar filtros',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Selecionar Sul',exact:true}).click();
  await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();
  await expect(page.locator('.kpi').first().locator('strong')).toHaveText('363');
  await page.getByRole('button',{name:'Perguntar aos dados',exact:true}).click();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByText('Privacidade e limites',{exact:true})).toHaveCount(0);
  await expect(page.getByText('Usar Gemini nesta pergunta',{exact:false})).toHaveCount(0);
});
