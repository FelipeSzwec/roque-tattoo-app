import { useState } from 'react'
import { resumoMes, lancMes, brl, brl2, dataBR, FORMA_LABEL, MESES, MESES_LONGOS } from '../finance.js'
import { Screen, Title, Back, Toast, Sec, Kpis, Bars, Legend, Chips, MonthNav, card, btnPrimary, W, GR, OR, MUT } from '../ui.jsx'

export default function Caixa({ tx, ir, periodo, setPeriodo, max, toast }) {
  const [filtro, setFiltro] = useState('todos')
  const { ano, mes } = periodo
  const r = resumoMes(tx, ano, mes)
  const meses = Array.from({ length: 6 }, (_, i) => { const d = new Date(ano, mes - 5 + i, 1); return { a: d.getFullYear(), m: d.getMonth() } })
  const res = meses.map(({ a, m }) => resumoMes(tx, a, m))
  const mx = Math.max(1, ...res.map((x) => Math.max(x.entradas, x.saidas)))
  let lista = lancMes(tx, ano, mes)
  if (filtro === 'entrada' || filtro === 'saida') lista = lista.filter((t) => t.tipo === filtro)
  if (filtro === 'pessoal') lista = lista.filter((t) => t.grupo === 'pessoal')

  return (
    <Screen>
      <Back onClick={() => ir('gestao')} />
      <Title a="Entrou ×" b="saiu" />
      <Toast {...(toast || {})} />
      <MonthNav ano={ano} mes={mes} onChange={setPeriodo} MESES_LONGOS={MESES_LONGOS} max={max} />
      <div style={{ ...card, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 11, letterSpacing: '.1em', color: MUT }}>SOBROU NO CAIXA</div>
        <div style={{ fontSize: 30, fontWeight: 500, color: r.saldo < 0 ? OR : W }}>{brl(r.saldo)}</div>
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 8, background: 'rgba(255,255,255,.1)' }}>
          <span style={{ width: (r.entradas ? Math.min(100, (r.saidas / r.entradas) * 100) : 100) + '%', background: r.saidas > r.entradas ? OR : 'rgba(255,255,255,.55)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 2 }}>
          <span style={{ color: GR }}>Entrou {brl(r.entradas)}</span><span style={{ color: MUT }}>Saiu {brl(r.saidas)}</span>
        </div>
      </div>
      <Sec>Últimos 6 meses</Sec>
      <Bars items={meses.map(({ a, m }, i) => ({ l: MESES[m], active: a === ano && m === mes, h1: (res[i].entradas / mx) * 100, c1: a === ano && m === mes ? GR : 'rgba(92,201,138,.45)', h2: (res[i].saidas / mx) * 100, c2: a === ano && m === mes ? W : 'rgba(255,255,255,.3)', t: `${MESES[m]}: entrou ${brl(res[i].entradas)}, saiu ${brl(res[i].saidas)}`, onClick: () => setPeriodo({ ano: a, mes: m }) }))} />
      <Legend items={[[GR, 'Entrou'], [W, 'Saiu']]} />
      <Kpis items={[
        { l: 'CUSTOS DO ESTÚDIO', v: brl(r.custos), d: 'fixos, variáveis e impostos' },
        { l: 'PESSOAL', v: brl(r.pessoal), d: 'retiradas e gastos seus', c: r.pessoal ? OR : MUT },
      ]} />
      <Sec>Lançamentos</Sec>
      <Chips items={[['todos', 'Todos'], ['entrada', 'Entradas'], ['saida', 'Saídas'], ['pessoal', 'Pessoal']]} value={filtro} onChange={setFiltro} />
      <div style={{ ...card, padding: '4px 14px' }}>
        {lista.length === 0 && <div style={{ padding: '18px 0', fontSize: 13, color: MUT, textAlign: 'center' }}>Nenhum lançamento neste mês.</div>}
        {lista.map((t, i) => (
          <button key={t.id} onClick={() => ir('lancar', { editando: t })} style={{ display: 'flex', width: '100%', textAlign: 'left', alignItems: 'center', gap: 10, padding: '10px 0', border: 0, borderBottom: i === lista.length - 1 ? 0 : '1px solid rgba(255,255,255,.07)', background: 'none', color: W, cursor: 'pointer' }}>
            <span style={{ width: 36, flex: 'none', fontSize: 12, color: MUT }}>{dataBR(t.data)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descricao || t.categoria}</div>
              <div style={{ fontSize: 12, color: t.grupo === 'pessoal' ? OR : MUT }}>{t.categoria} · {FORMA_LABEL[t.forma_pagamento] || '—'}{t.exemplo ? ' · exemplo' : ''}</div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', color: t.tipo === 'entrada' ? GR : t.grupo === 'pessoal' ? OR : W }}>{t.tipo === 'entrada' ? '+ ' : '− '}{brl2(t.valor)}</span>
          </button>
        ))}
      </div>
      <button onClick={() => ir('lancar', { editando: null })} style={btnPrimary}>+ Lançar entrada ou saída</button>
    </Screen>
  )
}
