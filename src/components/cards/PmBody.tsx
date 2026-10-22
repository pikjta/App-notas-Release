import { useApp } from '../../App';
import type { PmCard } from '../../lib/model';
import { cellText, COLORS, progress, stateInfo, tableProgress } from '../../lib/pm';

/** Vista compacta de una Tabla PM en el tablero: progreso y primeras filas. */
export function PmBody({ card }: { card: PmCard }) {
  const { state, openPm } = useApp();
  const pm = card.pm;
  const pct = tableProgress(pm);
  const title = pm.cols.find((c) => c.type === 'text');
  const status = pm.cols.find((c) => c.type === 'status');
  const prog = pm.cols.find((c) => c.type === 'progress');
  return (
    <div className="pm-compact">
      {pct !== null && (
        <div className="progress-row">
          <div className="progress"><span style={{ width: pct + '%' }} /></div>
          <span className="small muted">{pct}%</span>
        </div>
      )}
      <div className="small muted">{pm.rows.length} {pm.rows.length === 1 ? 'tarea' : 'tareas'}</div>
      {pm.rows.slice(0, 6).map((r) => {
        const si = status ? stateInfo(status, r.cells[status.id]) : null;
        const [bg, fg] = si ? COLORS[si.ph.color] ?? COLORS.gray : COLORS.gray;
        return (
          <div key={r.id} className="pm-mini-row">
            <span className="grow ellipsis">{title ? cellText(pm, title, r, state.tags) || 'Sin título' : 'Fila'}</span>
            {si && <span className="pill" style={{ background: bg, color: fg }}>{si.st.name}</span>}
            {prog && <span className="progress mini"><span style={{ width: progress(pm, prog, r) + '%' }} /></span>}
          </div>
        );
      })}
      {pm.rows.length > 6 && <div className="small muted">+{pm.rows.length - 6} más</div>}
      <button className="tool small-btn" onClick={() => openPm(card.id)}>Abrir tabla</button>
    </div>
  );
}
