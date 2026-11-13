import {useEffect,useRef,useState} from 'react';
import {api} from './lib';

export function useAnalysis(dataset, query) {
  const [snapshot,setSnapshot] = useState(null);
  const [error,setError] = useState(null);
  const [retryCount,setRetryCount] = useState(0);
  const [fetching,setFetching] = useState(false);
  const sequence = useRef(0);
  const key = JSON.stringify(query);
  const id = dataset?.id;
  useEffect(() => {
    const current = ++sequence.current;
    const controller = new AbortController();
    setError(null);
    if (!id) { setSnapshot(null); setFetching(false); return; }
    setFetching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await api(`/datasets/${id}/analyze`, JSON.parse(key), {signal:controller.signal});
        const data = await response.json();
        if (current === sequence.current) {
          setSnapshot({id,key,query:JSON.parse(key),data});
          setFetching(false);
        }
      } catch (e) {
        if (e.name !== 'AbortError' && current === sequence.current) {
          setError({message:e.message,status:e.status,key});
          setFetching(false);
        }
      }
    }, 240);
    return () => { clearTimeout(timer);controller.abort(); };
  }, [id,key,retryCount]);
  const visible = snapshot?.id===id ? snapshot : null;
  const pending = Boolean(id && (fetching || !visible || visible.key!==key));
  return {snapshot:visible,error,pending,ready:Boolean(visible && visible.key===key && !fetching && !error),retry:()=>setRetryCount(n=>n+1)};
}
