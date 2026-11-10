import { useState } from 'react'
import { resumoMes, resumoAno, brl, variacao, MESES, MESES_LONGOS } from '../finance.js'
import { Screen, Title, Back, Sec, Note, Chips, Kpis, Bars, Legend, W, GR, OR, MUT } from '../ui.jsx'

export default function Relatorio({ tx, ir, periodo, setPeriodo, max }) {
  const [visao, setVisao] = useState('mes')
  const { ano, mes } = periodo
  const ateMes = ano === max.ano ? max.mes : 11
  const res = MESES.map((_, m) => (m <= ateMes ? resumoMes(tx, ano, m) : null))
  const resAnt = MESES.map((_, m) => resumoMes(tx, ano - 1, m))
  const r = res[mes] || resumoMes(tx, ano, mes)
  const ant = mes === 0 ? resumoMes(tx, ano - 1, 11) : res[mes - 1]
  const cmp = (a, b, inv) => { const v = variacao(a, b); return v ? { d: v.txt + ' vs ' + MESES[mes === 0 ? 11 : mes - 1].toLowerCase(), c: (inv ? v.p <= 0 : v.p >= 0) ? GR : OR } : { d: 'sem mês anterior', c: MUT } }
  const mxM = Math.max(1, ...res.filter(Boolean).map((x) => Math.max(x.receita, x.custos)))
  const tA = resumoAno(tx, ano, ateMes), tP = resumoAno(tx, ano - 1, ateMes)
  const temAnt = tP.receita > 0
  const mxY = Math.max(1, ...res.filter(Boolean).map((x) => x.receita), ...resAnt.map((x) => x.receita))
  const melhor = res.reduce((b, x, i) => (x && (b < 0 || x.receita > res[b].receita) ? i : b), -1)
  const mesesComDados = res.filter((x) => x && x.receita > 0).length || 1

  return (
    <Screen>
      <Back onClick={() => ir('gestao')} />
      <Title a="Relatório" b="financeiro" />
      <Chips items={[['mes', 'Mês a mês'], ['ano', 'Ano todo']]} value={visao} onChange={setVisao} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
        <button onClick={() => setPeriodo({ ano: ano - 1, mes: 11 })} style={{ minWidth: 44, minHeight: 40, borderRadius: 20, border: '1px solid rgba(255,255,255,.18)', background: 'transparent', color: W, cursor: 'pointer' }}>‹</button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 500 }}>{ano}</div>
        <button onClick={() => ano < max.ano && setPeriodo({ ano: ano + 1, mes: ano + 1 === max.ano ? max.mes : 0 })} style={{ minWidth: 44, minHeight: 40, borderRadius: 20, border: '1px solid rgba(255,255,255,.18)', background: 'transparent', color: ano < max.ano ? W : '#4a4a50', cursor: ano < max.ano ? 'pointer' : 'default' }}>›</button>
      </div>
      {visao === 'mes' ? (
        <>
          <Sec>Faturamento por mês · toque em um mês</Sec>
          <Bars items={MESES.map((l, m) => ({ l, active: m === mes, h1: res[m] ? (res[m].receita / mxM) * 100 : 0, c1: m === mes ? W : 'rgba(242,242,242,.45)', h2: res[m] ? (res[m].custos / mxM) * 100 : 0, c2: 'rgba(255,255,255,.22)', t: res[m] ? `${l}: ${brl(res[m].receita)}` : l, onClick: res[m] ? () => setPeriodo({ ano, mes: m }) : undefined }))} />
          <Legend items={[[W, 'Faturamento'], ['rgba(255,255,255,.35)', 'Custos do estúdio']]} />
          <Sec>{MESES_LONGOS[mes]} {ano}{ano === max.ano && mes === max.mes ? ' · mês atual' : ''}</Sec>
          <Kpis items={[
            { l: 'FATURAMENTO', v: brl(r.receita), ...cmp(r.receita, ant?.receita) },
            { l: 'CUSTOS', v: brl(r.custos), d: r.receita ? Math.round((r.custos / r.receita) * 100) + '% do faturamento' : '—' },
            { l: 'LUCRO', v: brl(r.lucro), vc: r.lucro < 0 ? OR : W, d: r.receita ? 'margem ' + Math.round(r.margem * 100) + '%' : '—', c: r.lucro >= 0 ? GR : OR },
            { l: 'TICKET MÉDIO', v: brl(r.ticket), ...cmp(r.ticket, ant?.ticket) },
            { l: 'ATENDIMENTOS', v: String(r.sessoes), ...cmp(r.sessoes, ant?.sessoes) },
            { l: 'SAÍDAS PESSOAIS', v: brl(r.pessoal), d: 'fora dos custos', c: r.pessoal ? OR : MUT },
          ]} />
        </>
      ) : (
        <>
          <Sec>Visão geral · {ano}{temAnt ? ' × ' + (ano - 1) : ''}</Sec>
          <Bars items={MESES.map((l, m) => ({ l, h1: res[m] ? (res[m].receita / mxY) * 100 : 0, c1: W, h2: temAnt ? (resAnt[m].receita / mxY) * 100 : undefined, c2: 'rgba(255,255,255,.28)', t: `${l}: ${brl(res[m]?.receita || 0)}${temAnt ? ' (' + (ano - 1) + ': ' + brl(resAnt[m].receita) + ')' : ''}`, onClick: res[m] ? () => { setPeriodo({ ano, mes: m }); setVisao('mes') } : undefined }))} />
          <Legend items={temAnt ? [[W, String(ano)], ['rgba(255,255,255,.35)', String(ano - 1)]] : [[W, String(ano)]]} />
          <Kpis items={[
            { l: 'FATURAMENTO ' + ano, v: brl(tA.receita), d: 'jan a ' + MESES[ateMes].toLowerCase() },
            temAnt ? { l: 'MESMO PERÍODO ' + (ano - 1), v: brl(tP.receita), d: variacao(tA.receita, tP.receita).txt + ' de crescimento', c: tA.receita >= tP.receita ? GR : OR } : { l: 'CUSTOS NO ANO', v: brl(tA.custos), d: 'fixos, variáveis e impostos' },
            { l: 'LUCRO NO ANO', v: brl(tA.lucro), d: 'margem ' + Math.round(tA.margem * 100) + '%', c: tA.lucro >= 0 ? GR : OR },
            { l: 'MÉDIA POR MÊS', v: brl(tA.receita / mesesComDados), d: 'faturamento' },
            { l: 'MELHOR MÊS', v: melhor >= 0 && res[melhor].receita ? MESES[melhor] : '—', d: melhor >= 0 ? brl(res[melhor].receita) : '' },
            { l: 'ATENDIMENTOS', v: String(tA.sessoes), d: 'ticket médio ' + brl(tA.ticket) },
          ]} />
        </>
      )}
      <Note>Estimativa para organização. Confirme com seu contador.</Note>
    </Screen>
  )
}
