import { useState } from 'react'
import { resumoMes, resumoAno, pontoEquilibrio, brl, MESES_LONGOS } from '../finance.js'
import { Screen, Title, Back, Sec, Note, Chips, MonthNav, card, W, GR, OR, MUT } from '../ui.jsx'

export default function Lucro({ tx, ir, periodo, setPeriodo, max }) {
  const [visao, setVisao] = useState('mes')
  const { ano, mes } = periodo
  const r = visao === 'mes' ? resumoMes(tx, ano, mes) : resumoAno(tx, ano, ano === max.ano ? max.mes : 11)
  const nomePeriodo = visao === 'mes' ? MESES_LONGOS[mes] : ano === max.ano ? 'o ano até agora' : String(ano)
  const sobra = r.lucro - r.pessoal
  const base = Math.max(r.receita, r.custos + r.pessoal) || 1
  const linhas = [
    ['Faturamento', r.receita, GR, '+'],
    ['Custos fixos', -r.fixo, 'rgba(255,255,255,.6)', '−'],
    ['Material e variáveis', -r.variavel, 'rgba(255,255,255,.45)', '−'],
    ['Impostos', -r.imposto, 'rgba(255,255,255,.3)', '−'],
  ]
  const pe = pontoEquilibrio(r)
  const ok = r.lucro >= 0

  return (
    <Screen>
      <Back onClick={() => ir('gestao')} />
      <Title a="Lucro" b="real" />
      <Chips items={[['mes', 'Mês'], ['ano', 'Ano']]} value={visao} onChange={setVisao} />
      {visao === 'mes' ? <MonthNav ano={ano} mes={mes} onChange={setPeriodo} MESES_LONGOS={MESES_LONGOS} max={max} /> : <div style={{ fontSize: 14, fontWeight: 500, textAlign: 'center' }}>{ano}{ano === max.ano ? ' · até ' + MESES_LONGOS[max.mes] : ''}</div>}
      {r.receita + r.saidas === 0 ? (
        <div style={{ border: '1px dashed rgba(255,255,255,.18)', borderRadius: 16, padding: '30px 16px', textAlign: 'center', color: MUT, fontSize: 13 }}>Sem lançamentos neste período.</div>
      ) : (
        <>
          <div style={{ border: `1px solid ${ok ? 'rgba(92,201,138,.5)' : 'rgba(242,155,75,.55)'}`, background: ok ? 'rgba(92,201,138,.08)' : 'rgba(242,155,75,.08)', borderRadius: 16, padding: '16px 14px' }}>
            <div style={{ fontSize: 11, letterSpacing: '.1em', color: MUT }}>{ok ? 'O ESTÚDIO DEU LUCRO' : 'O ESTÚDIO DEU PREJUÍZO'} EM {nomePeriodo.toUpperCase()}</div>
            <div style={{ fontSize: 32, fontWeight: 500, color: ok ? GR : OR }}>{brl(r.lucro)}</div>
            <div style={{ fontSize: 13, color: '#e6e6ea' }}>{r.receita ? `Margem de ${Math.round(r.margem * 100)}%: de cada R$ 100 faturados, sobram R$ ${Math.max(0, Math.round(r.margem * 100))} depois dos custos.` : 'Nenhuma receita lançada.'}</div>
          </div>
          <Sec>Do faturamento ao lucro</Sec>
          <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {linhas.map(([l, v, c, s]) => (
              <div key={l}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#e6e6ea' }}>{l}</span><b style={{ fontWeight: 500 }}>{s} {brl(Math.abs(v))}</b></div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.06)', marginTop: 5 }}><div style={{ height: 6, borderRadius: 3, background: c, width: (Math.abs(v) / base) * 100 + '%' }} /></div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><b>= Lucro do estúdio</b><b style={{ color: ok ? GR : OR }}>{brl(r.lucro)}</b></div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: OR }}>Você tirou para você</span><b style={{ fontWeight: 500, color: OR }}>− {brl(r.pessoal)}</b></div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.06)', marginTop: 5 }}><div style={{ height: 6, borderRadius: 3, background: OR, width: (r.pessoal / base) * 100 + '%' }} /></div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><b>= Ficou no caixa do estúdio</b><b style={{ color: sobra >= 0 ? W : OR }}>{brl(sobra)}</b></div>
          </div>
          {r.pessoal > r.lucro && r.lucro > 0 && <div style={{ border: '1px solid rgba(242,155,75,.55)', background: 'rgba(242,155,75,.08)', color: OR, borderRadius: 14, padding: '11px 14px', fontSize: 13, lineHeight: 1.5 }}>Atenção: você tirou {brl(r.pessoal - r.lucro)} a mais do que o estúdio lucrou. Esse dinheiro saiu da reserva do caixa.</div>}
          {pe && visao === 'mes' && (
            <>
              <Sec>Ponto de equilíbrio</Sec>
              <div style={{ ...card, padding: '14px', fontSize: 13, lineHeight: 1.6, color: '#e6e6ea' }}>
                Para pagar todos os custos do mês, o estúdio precisa faturar pelo menos <b style={{ color: W }}>{brl(pe.faturamento)}</b>{pe.sessoes ? <>, ou cerca de <b style={{ color: W }}>{pe.sessoes} sessões</b> no ticket médio de {brl(r.ticket)}</> : null}.
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,.08)', marginTop: 10, position: 'relative' }}>
                  <div style={{ height: 8, borderRadius: 4, background: r.receita >= pe.faturamento ? GR : OR, width: Math.min(100, (r.receita / Math.max(pe.faturamento, r.receita)) * 100) + '%' }} />
                </div>
                <div style={{ fontSize: 12, color: MUT, marginTop: 4 }}>{r.receita >= pe.faturamento ? `Você passou do ponto de equilíbrio em ${brl(r.receita - pe.faturamento)}.` : `Faltam ${brl(pe.faturamento - r.receita)} para cobrir os custos.`}</div>
              </div>
            </>
          )}
          <Note>Lucro do estúdio = faturamento menos custos fixos, variáveis e impostos. Retiradas e gastos pessoais ficam fora, para mostrar se o negócio se paga sozinho. Estimativa para organização; confirme com seu contador.</Note>
        </>
      )}
    </Screen>
  )
}
