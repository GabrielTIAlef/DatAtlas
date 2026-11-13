import React from 'react';
import {format,percent,filterLabel,filterNames} from './lib';

export function Icon({name,size=20,...props}) {
  const paths = {
    dashboard:<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="18" width="7" height="3" rx="1"/></>,
    quality:<><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/></>,
    table:<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/></>,
    upload:<><path d="M12 16V3m-4 4 4-4 4 4M4 15v5h16v-5"/></>,
    download:<><path d="M12 3v13m-4-4 4 4 4-4M4 16v5h16v-5"/></>,
    spark:<><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/></>,
    close:<path d="m6 6 12 12M6 18 18 6"/>,
    plus:<path d="M12 5v14M5 12h14"/>,
    filter:<><path d="M3 5h18l-7 8v6l-4 2v-8z"/></>,
    chevron:<path d="m9 5 7 7-7 7"/>,
    expand:<><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></>,
    arrow:<path d="M4 12h16m-6-6 6 6-6 6"/>,
    trash:<><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]||paths.spark}</svg>;
}
export function EmptyState({title,children,compact=false}) {
  return <div className={`empty-state ${compact?'compact':''}`}><span className="empty-symbol"><Icon name="table" size={28}/></span><h2>{title}</h2>{children}</div>;
}
export function DataTable({data}) {
  if (!data.rows) return <EmptyState title="Nenhuma linha neste recorte" compact><p>Remova ou ajuste os filtros para continuar.</p></EmptyState>;
  return <div className="table-scroll" tabIndex="0" role="region" aria-label="Prévia dos dados com rolagem"><table><caption className="sr-only">Primeiras {Math.min(100,data.rows)} linhas do recorte. Cálculos usam todas as linhas.</caption><thead><tr><th className="row-number">#</th>{data.columns.map(c=><th key={c.name} title={c.name}>{c.name}<span>{c.type}</span></th>)}</tr></thead><tbody>{data.preview.map((row,i)=><tr key={i}><td className="row-number">{i+1}</td>{data.columns.map(c=><td key={c.name} className={c.type==='número'?'numeric':''} title={format(row[c.name])}>{row[c.name]==null?<span className="null-value">Nulo</span>:format(row[c.name])}</td>)}</tr>)}</tbody></table></div>;
}
export function FilterPanel({rules,setRules,columns,selection,onClearSelection,locked}) {
  const patch = (id,values) => setRules(items=>items.map(r=>r.id===id?{...r,...values}:r));
  const count = rules.filter(r=>r.column&&(r.op==='isnull'||r.value!=='')).length + (selection?1:0);
  return <section className="filter-panel" aria-label="Filtros da análise"><div className="filter-heading"><div><Icon name="filter" size={17}/><h2>Filtros</h2><span className="muted">{count ? `${count} ativo${count===1?'':'s'}` : 'Toda a base'}</span></div><div className="filter-actions"><span className="auto-tag">Aplicação automática</span><button className="text-button" disabled={locked||(!rules.length&&!selection)} onClick={()=>{setRules([]);onClearSelection();}}>Limpar filtros</button><button className="button small" disabled={locked||rules.length>=8} onClick={()=>setRules(items=>[...items,{id:crypto.randomUUID(),column:'',op:'eq',value:''}])}><Icon name="plus" size={15}/>Adicionar filtro</button></div></div>
  {rules.length>0&&<div className="filter-rules">{rules.map((r,i)=><div className="filter-rule" key={r.id}><span className="rule-join">{i===0?'Onde':'E'}</span><label><span className="sr-only">Coluna do filtro {i+1}</span><select aria-label={`Coluna do filtro ${i+1}`} value={r.column} disabled={locked} onChange={e=>patch(r.id,{column:e.target.value,value:''})}><option value="">Escolha uma coluna</option>{columns.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select></label><label><span className="sr-only">Operador do filtro {i+1}</span><select aria-label={`Operador do filtro ${i+1}`} disabled={locked} value={r.op} onChange={e=>patch(r.id,{op:e.target.value})}>{Object.entries(filterNames).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="filter-value"><span className="sr-only">Valor do filtro {i+1}</span><input aria-label={`Valor do filtro ${i+1}`} maxLength={2000} disabled={locked||r.op==='isnull'} value={r.value} placeholder={r.op==='isnull'?'Sem valor necessário':'Valor…'} onChange={e=>patch(r.id,{value:e.target.value})}/></label><button className="icon-button" aria-label={`Remover filtro ${i+1}`} disabled={locked} onClick={()=>setRules(items=>items.filter(f=>f.id!==r.id))}><Icon name="close" size={16}/></button></div>)}<p className="field-hint">Filtros combinados com E. Números com ponto decimal; datas em AAAA-MM-DD.</p></div>}
  {selection&&<div className="selection-strip"><span>Seleção no gráfico</span><button className="chip" disabled={locked} onClick={onClearSelection} title={filterLabel(selection)}>{filterLabel(selection)}<Icon name="close" size={13}/><span className="sr-only">Remover seleção</span></button></div>}
  </section>;
}
export function Kpis({data,total}) {
  const ratio=total?data.rows/total:0;
  return <div className="kpi-grid"><article className="kpi featured"><span>Linhas no recorte</span><strong>{format(data.rows)}</strong><small>{percent(ratio)} de {format(total)} linhas</small><div className="kpi-track"><i style={{width:`${ratio*100}%`}}/></div></article>{[[data.column_count,'Colunas','Campos da base'],[data.nulls,'Células ausentes','Não são linhas ausentes'],[data.duplicates,'Linhas duplicadas','Repetições completas adicionais']].map(([value,title,hint])=><article className="kpi" key={title}><span>{title}</span><strong title={format(value)}>{format(value)}</strong><small>{hint}</small></article>)}</div>;
}
export function Quality({data,onNullFilter,locked}) {
  return <section className="panel"><div className="panel-heading"><div><h2>Qualidade por coluna</h2><p>Estatísticas do recorte atual. Nenhum valor é removido automaticamente.</p></div><span className="label-tag">{data.columns.length} colunas</span></div><details className="context-help"><summary>Como interpretar os resultados</summary><p>Nulos não entram nas estatísticas. Duplicatas comparam a linha inteira. Outliers estão fora de Q1 − 1,5 × IQR e Q3 + 1,5 × IQR; são alertas, não erros confirmados. Desvio padrão amostral. Clique na quantidade de nulos para analisar as linhas daquela coluna.</p></details><div className="table-scroll" tabIndex="0" role="region" aria-label="Qualidade das colunas com rolagem"><table><thead><tr>{['Coluna','Tipo','Nulos','Únicos','Outliers','Média','Mediana','Mínimo','Máximo','Desvio','Limites IQR'].map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{data.columns.map(c=><tr key={c.name}><th scope="row" title={c.name}>{c.name}</th><td><span className="label-tag">{c.type}</span></td><td>{c.nulls>0?<button className="cell-button" disabled={locked} onClick={()=>onNullFilter(c.name)} aria-label={`Filtrar nulos de ${c.name}`}>{format(c.nulls)}<Icon name="filter" size={11}/></button>:0}</td><td>{format(c.unique)}</td><td>{format(c.outliers)}</td>{['mean','50%','min','max','std'].map(k=><td key={k} className="numeric">{format(c.stats?.[k])}</td>)}<td className="numeric">{c.bounds?.map(format).join(' a ')||'—'}</td></tr>)}</tbody></table></div></section>;
}
