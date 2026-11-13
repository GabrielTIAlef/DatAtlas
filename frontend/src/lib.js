export const format = value => value == null ? '—' : typeof value === 'number'
  ? new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 2}).format(value) : String(value);
export const percent = value => new Intl.NumberFormat('pt-BR', {style:'percent',maximumFractionDigits:1}).format(value);
export const operationNames = {sum:'Soma',mean:'Média',count:'Contagem de linhas',min:'Mínimo',max:'Máximo'};
export const filterNames = {eq:'igual a',contains:'contém',gte:'≥',lte:'≤',isnull:'é nulo'};
export const filterLabel = f => `${f.column} ${filterNames[f.op]}${f.op === 'isnull' ? '' : ` ${f.value}`}`;
export const sameFilter = (a,b) => Boolean(a && b && a.column===b.column && a.op===b.op && a.value===b.value);
export async function api(path, body, {method='POST',signal}={}) {
  const response = await fetch(`/api${path}`, {
    method, signal,
    headers:body instanceof File ? {} : {'Content-Type':'application/json'},
    body:body===undefined ? undefined : body instanceof File ? body : JSON.stringify(body),
  });
  if (!response.ok) {
    let detail;
    try { detail = (await response.json()).detail; } catch { /* Mensagem padrão abaixo. */ }
    const error = new Error(typeof detail==='string' ? detail : 'Não foi possível concluir. Confira os campos ou tente novamente.');
    error.status = response.status;
    throw error;
  }
  return response;
}
