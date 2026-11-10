// Componentes visuais copiados do protótipo (mesmos estilos de cards, títulos e botões).

export const W = '#F2F2F2', GR = '#5CC98A', OR = '#F29B4B', MUT = '#d2d2d6', DIM = '#8a8a90'

export const cardBg = 'linear-gradient(160deg,rgba(38,38,42,.15),rgba(14,14,16,.12))'
export const card = {
  background: cardBg,
  border: '1px solid rgba(255,255,255,.16)',
  borderTopColor: 'rgba(255,255,255,.4)',
  borderBottomColor: 'rgba(0,0,0,.7)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35),inset 0 -2px 0 rgba(0,0,0,.55),inset 1px 0 0 rgba(255,255,255,.1),inset -1px 0 0 rgba(0,0,0,.35),0 14px 26px rgba(0,0,0,.65),0 3px 5px rgba(0,0,0,.6)',
  borderRadius: 16,
  color: W,
}
export const btnPrimary = { border: 0, background: 'linear-gradient(180deg,#FFFFFF,#D4D4D7)', boxShadow: '0 8px 22px rgba(0,0,0,.6),inset 0 1px 0 #fff', color: '#0A0A0C', borderRadius: 24, minHeight: 50, fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%' }
export const btnDisabled = { ...btnPrimary, background: 'rgba(255,255,255,.08)', boxShadow: 'none', color: '#6b6b70', cursor: 'default' }
export const btnGhost = { border: '1px solid #F2F2F2', background: 'transparent', color: W, borderRadius: 24, minHeight: 46, fontSize: 14, cursor: 'pointer', width: '100%' }
export const input = { minHeight: 50, boxSizing: 'border-box', width: '100%', border: '1px solid rgba(255,255,255,.18)', background: 'rgba(10,10,12,.55)', color: W, borderRadius: 14, padding: '0 14px', fontSize: 15, outline: 'none' }

export const Screen = ({ children, style }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fi .2s ease', ...style }}>{children}</div>

export const Title = ({ a, b }) => (
  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30 }}>
    {a} <span style={{ color: '#fff', fontFamily: "'UnifrakturCook',serif", fontWeight: 700 }}>{b}</span>
  </div>
)

export const Sec = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <span style={{ fontSize: 11, letterSpacing: '.12em', color: MUT, textTransform: 'uppercase' }}>{children}</span>
    <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
  </div>
)

export const Note = ({ children }) => <div style={{ fontSize: 12, color: MUT, lineHeight: 1.5 }}>{children}</div>

export const Back = ({ onClick, label = 'Gestão' }) => (
  <button onClick={onClick} style={{ alignSelf: 'flex-start', minHeight: 44, border: 0, background: 'none', fontSize: 13, cursor: 'pointer', padding: 0, color: MUT }}>‹ {label}</button>
)

export const Toast = ({ msg, erro }) => msg ? (
  <div style={{ border: `1px solid ${erro ? 'rgba(242,155,75,.55)' : 'rgba(92,201,138,.5)'}`, background: erro ? 'rgba(242,155,75,.08)' : 'rgba(92,201,138,.08)', color: erro ? OR : GR, borderRadius: 14, padding: '11px 14px', fontSize: 13 }}>
    {erro ? '' : '✓ '}{msg}
  </div>
) : null

export const chipStyle = (on) => ({ flex: 'none', minHeight: 44, border: `1px solid ${on ? W : 'rgba(255,255,255,.12)'}`, borderRadius: 22, padding: '0 14px', fontSize: 12, cursor: 'pointer', background: on ? 'rgba(255,255,255,.12)' : 'transparent', color: on ? W : '#c9c9cd', transition: 'all .15s' })

export const Chips = ({ items, value, onChange, wrap }) => (
  <div style={{ display: 'flex', gap: 6, overflowX: wrap ? 'visible' : 'auto', flexWrap: wrap ? 'wrap' : 'nowrap', paddingBottom: 4 }}>
    {items.map(([k, label]) => <button key={k} onClick={() => onChange(k)} style={chipStyle(value === k)}>{label}</button>)}
  </div>
)

export const Kpis = ({ items }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
    {items.map((k) => (
      <div key={k.l} style={{ ...card, padding: '12px 14px' }}>
        <div style={{ fontSize: 10, letterSpacing: '.1em', color: MUT }}>{k.l}</div>
        <div style={{ fontSize: 22, fontWeight: 500, marginTop: 2, color: k.vc || W }}>{k.v}</div>
        <div style={{ fontSize: 11, color: k.c || MUT }}>{k.d}</div>
      </div>
    ))}
  </div>
)

export const Rows = ({ items, empty = 'Nada por aqui ainda.' }) => (
  <div style={{ ...card, padding: '4px 14px' }}>
    {items.length === 0 && <div style={{ padding: '18px 0', fontSize: 13, color: MUT, textAlign: 'center' }}>{empty}</div>}
    {items.map((r, i) => (
      <div key={r.key || i} onClick={r.onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i === items.length - 1 ? 0 : '1px solid rgba(255,255,255,.07)', cursor: r.onClick ? 'pointer' : 'default' }}>
        {r.n != null && <span style={{ width: 22, flex: 'none', fontSize: 12, color: DIM }}>{r.n}</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{r.a}</div>
          {r.b && <div style={{ fontSize: 12, color: MUT }}>{r.b}</div>}
          {r.bar != null && <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,.08)', marginTop: 6 }}><div style={{ height: 3, borderRadius: 2, background: r.barC || W, width: Math.max(0, Math.min(100, r.bar)) + '%' }} /></div>}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: r.vc || W, textAlign: 'right', whiteSpace: 'nowrap' }}>{r.v}</span>
        {r.extra}
      </div>
    ))}
  </div>
)

// Gráfico de barras: cada item pode ter duas barras (ex.: entrou e saiu).
export const Bars = ({ items, height = 130 }) => (
  <div style={{ ...card, padding: '14px 12px 10px' }}>
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height }}>
      {items.map((b, i) => (
        <button key={i} onClick={b.onClick} title={b.t} style={{ flex: 1, height: '100%', border: 0, background: 'none', padding: 0, cursor: b.onClick ? 'pointer' : 'default', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
          <span style={{ width: b.h2 != null ? '42%' : '60%', height: Math.max(0, b.h1) + '%', minHeight: b.h1 > 0 ? 2 : 0, borderRadius: '3px 3px 1px 1px', background: b.c1, border: b.bd1 || 0, boxSizing: 'border-box', transition: 'height .3s' }} />
          {b.h2 != null && <span style={{ width: '42%', height: Math.max(0, b.h2) + '%', minHeight: b.h2 > 0 ? 2 : 0, borderRadius: '3px 3px 1px 1px', background: b.c2, transition: 'height .3s' }} />}
        </button>
      ))}
    </div>
    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
      {items.map((b, i) => <span key={i} onClick={b.onClick} style={{ cursor: b.onClick ? 'pointer' : 'default', flex: 1, textAlign: 'center', fontSize: 9, color: b.active ? W : DIM, fontWeight: b.active ? 700 : 400 }}>{b.l}</span>)}
    </div>
  </div>
)

export const Legend = ({ items }) => (
  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: MUT, flexWrap: 'wrap' }}>
    {items.map(([c, l, dashed]) => (
      <span key={l}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: dashed ? 'transparent' : c, border: dashed ? `1px dashed ${c}` : 0, boxSizing: 'border-box', marginRight: 5 }} />{l}</span>
    ))}
  </div>
)

export const MonthNav = ({ ano, mes, onChange, MESES_LONGOS, max }) => {
  const prev = () => onChange(mes === 0 ? { ano: ano - 1, mes: 11 } : { ano, mes: mes - 1 })
  const isMax = max && (ano > max.ano || (ano === max.ano && mes >= max.mes))
  const next = () => !isMax && onChange(mes === 11 ? { ano: ano + 1, mes: 0 } : { ano, mes: mes + 1 })
  const b = (on) => ({ minWidth: 44, minHeight: 44, borderRadius: 22, border: '1px solid rgba(255,255,255,.18)', background: 'transparent', color: on ? W : '#4a4a50', fontSize: 18, cursor: on ? 'pointer' : 'default' })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={prev} style={b(true)} aria-label="Mês anterior">‹</button>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{MESES_LONGOS[mes]} {ano}</div>
      <button onClick={next} style={b(!isMax)} aria-label="Próximo mês">›</button>
    </div>
  )
}

// Rosca (donut) feita com conic-gradient.
export const Donut = ({ parts, center, sub, size = 170 }) => {
  const tot = parts.reduce((a, p) => a + Math.max(0, p.v), 0) || 1
  let acc = 0
  const stops = parts.filter((p) => p.v > 0).map((p) => { const a = acc; acc += (p.v / tot) * 360; return `${p.c} ${a}deg ${acc}deg` }).join(',')
  return (
    <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%', background: stops ? `conic-gradient(${stops})` : 'rgba(255,255,255,.08)', flex: 'none' }}>
      <div style={{ position: 'absolute', inset: size * 0.17, borderRadius: '50%', background: '#0c0c0e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxShadow: 'inset 0 2px 8px rgba(0,0,0,.8)' }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{center}</div>
        <div style={{ fontSize: 10, color: MUT, lineHeight: 1.3, padding: '0 8px' }}>{sub}</div>
      </div>
    </div>
  )
}
