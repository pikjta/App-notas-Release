import { useLayoutEffect, useRef, useState } from 'react';
import { useApp } from '../../App';
import type { CheckCard } from '../../lib/model';
import { uid } from '../../lib/model';

export function CheckBody({ card }: { card: CheckCard }) {
  const { dispatch } = useApp();
  const items = card.items;
  const done = items.filter((i) => i.done && i.text).length;
  const total = items.filter((i) => i.text).length;
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [asking, setAsking] = useState(false);
  // El foco pasa al elemento nuevo en cuanto existe (antes de que llegue la siguiente tecla).
  const pending = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (pending.current) { document.getElementById('it-' + pending.current)?.focus(); pending.current = null; }
  }, [card.items]);
  const focus = (id: string) => { pending.current = id; if (document.getElementById('it-' + id)) { document.getElementById('it-' + id)?.focus(); pending.current = null; } };

  // Hijos de cada tarea: las subtareas que la siguen hasta la próxima tarea principal.
  const kids = (idx: number) => {
    const out: typeof items = [];
    for (let k = idx + 1; k < items.length && items[k].level === 1; k++) out.push(items[k]);
    return out;
  };
  const tops = items.filter((i) => i.level === 0);
  const addTask = () => { const id = uid('it'); dispatch({ t: 'addCheckItem', card: card.id, after: null, id, level: 0 }); focus(id); };
  const addSub = (topId: string) => {
    const idx = items.findIndex((i) => i.id === topId);
    const last = kids(idx).pop() ?? items[idx];
    const id = uid('it');
    dispatch({ t: 'addCheckItem', card: card.id, after: last.id, id, level: 1 });
    setCollapsed((c) => { const n = new Set(c); n.delete(topId); return n; });
    setAsking(false); focus(id);
  };
  const subClick = () => { if (!tops.length) addTask(); else if (tops.length === 1) addSub(tops[0].id); else setAsking(true); };

  let hideUntilTop = false;
  return (
    <div className="check">
      {total > 0 && (
        <div className="progress-row">
          <div className="progress" aria-label={`${done} de ${total} hechas`}><span style={{ width: `${Math.round((done / total) * 100)}%` }} /></div>
          <span className="small muted">{done}/{total}</span>
        </div>
      )}
      {items.map((it, i) => {
        if (it.level === 0) hideUntilTop = false;
        const ch = it.level === 0 ? kids(i) : [];
        if (it.level === 0 && ch.length && collapsed.has(it.id)) hideUntilTop = true;
        else if (it.level === 1 && hideUntilTop) return null;
        const doneKids = ch.filter((k) => k.done).length;
        const partial = ch.length > 0 && doneKids > 0 && doneKids < ch.length;
        const checked = ch.length ? doneKids === ch.length : it.done;
        return (
          <div key={it.id} className="check-row" style={{ paddingLeft: it.level * 22 }}>
            {it.level === 0 && (ch.length > 0
              ? <button className="fold" aria-label={collapsed.has(it.id) ? 'Desplegar subtareas' : 'Plegar subtareas'} aria-expanded={!collapsed.has(it.id)}
                  onClick={() => setCollapsed((c) => { const n = new Set(c); if (n.has(it.id)) n.delete(it.id); else n.add(it.id); return n; })}>{collapsed.has(it.id) ? '▸' : '▾'}</button>
              : <span className="fold" />)}
            <input type="checkbox" checked={checked} ref={(el) => { if (el) el.indeterminate = partial; }} aria-label="Hecha"
              onChange={() => {
                if (ch.length) ch.forEach((k) => dispatch({ t: 'checkItem', card: card.id, item: k.id, patch: { done: !checked } })); 
                dispatch({ t: 'checkItem', card: card.id, item: it.id, patch: { done: !checked } });
              }} />
            <input
              id={'it-' + it.id}
              className={'check-text' + (checked ? ' done' : '')}
              value={it.text}
              placeholder="Escribe una tarea…"
              onChange={(e) => dispatch({ t: 'checkItem', card: card.id, item: it.id, patch: { text: e.target.value } })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); const id = uid('it'); dispatch({ t: 'addCheckItem', card: card.id, after: ch.length ? ch[ch.length - 1].id : it.id, id, level: ch.length ? 0 : undefined }); focus(id); }
                // Tab: subtarea de la anterior; Mayús+Tab lo deshace.
                if (e.key === 'Tab') { e.preventDefault(); if (e.shiftKey) dispatch({ t: 'checkItem', card: card.id, item: it.id, patch: { level: 0 } }); else if (i > 0 && !ch.length) dispatch({ t: 'checkItem', card: card.id, item: it.id, patch: { level: 1 } }); }
                if (e.key === 'Backspace' && !it.text && items.length > 1) { e.preventDefault(); dispatch({ t: 'removeCheckItem', card: card.id, item: it.id }); const prev = items[i - 1]; if (prev) focus(prev.id); }
              }}
            />
            {ch.length > 0 && <span className="small muted">{doneKids}/{ch.length}</span>}
          </div>
        );
      })}
      <div className="row wrap">
        <button className="link small" onClick={addTask}>+ Añadir tarea</button>
        <button className="link small" onClick={subClick}>+ Añadir subtarea</button>
      </div>
      {asking && (
        <div className="stack small-gap" role="group" aria-label="¿Dentro de qué tarea?">
          <span className="small">¿Dentro de qué tarea?</span>
          {tops.map((t) => <button key={t.id} className="chip" onClick={() => addSub(t.id)}>{t.text || 'Sin título'}</button>)}
          <button className="link small" onClick={() => setAsking(false)}>Cancelar</button>
        </div>
      )}
    </div>
  );
}
