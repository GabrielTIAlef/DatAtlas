import React,{useEffect,useRef,useState} from 'react';
import {api,filterLabel,format} from './lib';
import {Icon} from './components';

export default function Assistant({dataset,snapshot,ready,open,setOpen}) {
  const [expanded,setExpanded]=useState(false),[question,setQuestion]=useState('');
  const [sending,setSending]=useState(false),[messages,setMessages]=useState([]),[error,setError]=useState('');
  const input=useRef(null),body=useRef(null),trigger=useRef(null),controller=useRef(null),retry=useRef(null);
  useEffect(()=>{if(open)input.current?.focus();},[open]);
  useEffect(()=>{if(body.current)body.current.scrollTop=body.current.scrollHeight;},[messages,sending]);
  useEffect(()=>()=>controller.current?.abort(),[]);
  const close=()=>{setOpen(false);trigger.current?.focus();};
  const filters=snapshot?[...snapshot.query.filters,...(snapshot.query.selection?[snapshot.query.selection]:[])]:[];
  async function send(retryPayload) {
    if(!dataset||!ready||sending)return;
    const payload=retryPayload||{...snapshot.query,question:question.trim()};
    if(payload.question.length<3)return;
    retry.current=payload;
    setSending(true);setError('');setQuestion('');
    controller.current=new AbortController();
    const id=crypto.randomUUID();
    setMessages(items=>[...items,{id,question:payload.question,query:payload,rows:snapshot.data.rows,dataset:dataset.name}]);
    try {
      const response=await api(`/datasets/${dataset.id}/ask`,payload,{signal:controller.current.signal});
      const answer=await response.json();
      setMessages(items=>items.map(m=>m.id===id?{...m,answer}:m));
    } catch(e) {
      if(e.name!=='AbortError'){setError(e.message);setMessages(items=>items.map(m=>m.id===id?{...m,failed:true}:m));}
    } finally {setSending(false);}
  }
  const numeric=snapshot?.data.columns.find(c=>c.type==='número')?.name;
  return <><button ref={trigger} className="assistant-launcher" aria-expanded={open} aria-controls="assistant-panel" onClick={()=>open?close():setOpen(true)}><Icon name={open?'close':'spark'}/><span>{open?'Fechar assistente':'Perguntar aos dados'}</span></button><section id="assistant-panel" className={`assistant-panel ${expanded?'expanded':''}`} hidden={!open} role="dialog" aria-modal="false" aria-labelledby="assistant-title" onKeyDown={e=>{if(e.key==='Escape')close();}}><div className="assistant-heading"><span className="assistant-mark"><Icon name="spark"/></span><div><h2 id="assistant-title">Assistente de análise</h2><span>DatAtlas</span></div><button className="icon-button" aria-label={expanded?'Recolher assistente':'Expandir assistente'} aria-pressed={expanded} onClick={()=>setExpanded(v=>!v)}><Icon name="expand" size={17}/></button><button className="icon-button" aria-label="Fechar assistente" onClick={close}><Icon name="close" size={18}/></button></div>
  <div className="assistant-context"><strong>{dataset?dataset.name:'Nenhum dataset'}</strong><span>{snapshot?`${format(snapshot.data.rows)} linhas · ${filters.length} filtros`:'Carregue uma base para começar.'}</span>{!ready&&dataset&&<span className="context-warning">Aguarde a atualização do recorte antes de enviar.</span>}</div>
  <div className="assistant-messages" ref={body} role="log" aria-label="Conversa da sessão" aria-relevant="additions text">{!messages.length&&<div className="assistant-welcome"><Icon name="spark" size={28}/><h3>Uma pergunta, um valor verificável.</h3><p>Consulte contagem, qualidade, soma, média, mínimo ou máximo. Cada resposta registra o recorte usado.</p><div className="suggestions">{['Quantas linhas temos?','Qual a qualidade dos dados?',...(numeric?[`Qual a média de ${numeric}?`]:[])].map(s=><button key={s} disabled={!ready} onClick={()=>{setQuestion(s);input.current?.focus();}}>{s}</button>)}</div></div>}{messages.map(m=><div className="chat-turn" key={m.id}><p className="user-message">{m.question}</p><div className="message-context">{format(m.rows)} linhas · {m.query.filters.length+(m.query.selection?1:0)} filtros na consulta</div>{m.answer&&<div className="assistant-message"><span className="source-badge">{m.answer.source}</span><p>{m.answer.answer}</p><details><summary>Evidências e recorte usados</summary><p>{m.answer.note}</p><ul>{[...m.query.filters,...(m.query.selection?[m.query.selection]:[])].map((f,i)=><li key={i}>{filterLabel(f)}</li>)}</ul><pre>{JSON.stringify(m.answer.evidence,null,2)}</pre></details></div>}{m.failed&&<p className="message-error">Esta pergunta não foi concluída.</p>}</div>)}{sending&&<p className="sending" role="status"><span className="live-dot"/>Calculando resposta…</p>}</div>
  {error&&<div className="chat-error" role="alert">{error}<button disabled={!ready||sending} className="text-button" onClick={()=>{if(JSON.stringify(retry.current?.filters)===JSON.stringify(snapshot.query.filters)&&JSON.stringify(retry.current?.selection)===JSON.stringify(snapshot.query.selection))send(retry.current);else {setQuestion(retry.current?.question||'');setError('O recorte mudou. Revise a pergunta e envie novamente.');}}}>Tentar novamente</button></div>}
  <form className="assistant-composer" onSubmit={e=>{e.preventDefault();send();}}><label className="sr-only" htmlFor="chat-question">Sua pergunta</label><textarea ref={input} id="chat-question" rows={2} maxLength={500} minLength={3} required value={question} onChange={e=>setQuestion(e.target.value)} placeholder={dataset?'Ex.: Qual a soma de receita?':'Carregue um dataset primeiro'} disabled={!dataset||sending}/><div className="composer-actions"><span>{question.length}/500</span><button className="button primary small" disabled={!ready||sending||question.trim().length<3} type="submit">{sending?'Enviando…':'Enviar'}<Icon name="arrow" size={16}/></button></div></form></section></>;
}
