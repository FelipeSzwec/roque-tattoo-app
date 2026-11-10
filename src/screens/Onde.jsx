import { resumoMes, lancMes, porCategoria, brl, MESES_LONGOS } from '../finance.js'
import { Screen, Title, Back, Sec, Note, Rows, MonthNav, Donut, card, W, GR, OR, MUT } from '../ui.jsx'

export default function Onde({ tx, ir, periodo, setPeriodo, max }) {
  const { ano, mes } = periodo
  const r = resumoMes(tx, ano, mes)
  const lista = lancMes(tx, ano, mes)
  const pesVal = (cat) => lista.filter((t) => t.categoria === cat).reduce((a, t) => a + Number(t.valor), 0)
  const retirada = pesVal('Retirada pessoal'), gastoPes = r.pessoal - retirada
  const sobrou = r.entradas - r.saidas
  const partes = [
    { l: 'Custos fixos', v: r.fixo, c: '#F2F2F2' },
    { l: 'Material e variáveis', v: r.variavel, c: '#A9A9AF' },
    { l: 'Impostos', v: r.imposto, c: '#66666C' },
    { l: 'Retirada pessoal', v: retirada, c: '#F29B4B' },
    { l: 'Gastos pessoais', v: gastoPes, c: '#B8672A' },
    { l: sobrou >= 0 ? 'Sobrou no caixa' : 'Faltou (saiu mais do que entrou)', v: Math.abs(sobrou), c: sobrou >= 0 ? GR : '#5a2a2a' },
  ]
  const base = Math.max(r.entradas, r.saidas) || 1
  const top = porCategoria(lista, (t) => t.tipo === 'saida').slice(0, 6)
  const topMax = top[0]?.[1] || 1

  return (
    <Screen>
      <Back onClick={() => ir('gestao')} />
      <Title a="Para onde vai o" b="dinheiro" />
      <MonthNav ano={ano} mes={mes} onChange={setPeriodo} MESES_LONGOS={MESES_LONGOS} max={max} />
      {r.entradas + r.saidas === 0 ? (
        <div style={{ border: '1px dashed rgba(255,255,255,.18)', borderRadius: 16, padding: '30px 16px', textAlign: 'center', color: MUT, fontSize: 13 }}>Sem lançamentos neste mês.</div>
      ) : (
        <>
          <div style={{ ...card, padding: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Donut parts={partes} center={brl(r.entradas)} sub="entraram no mês" />
            <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {partes.filter((p) => p.v > 0).map((p) => (
                <div key={p.l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: p.c, flex: 'none' }} />
                  <span style={{ flex: 1, color: '#e6e6ea' }}>{p.l}</span>
                  <b style={{ fontWeight: 500 }}>{brl(p.v)}</b>
                </div>
              ))}
            </div>
          </div>
          <Sec>De cada R$ 100 que entraram</Sec>
          <div style={{ ...card, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {partes.filter((p) => p.v > 0).map((p) => {
              const cada100 = r.entradas ? (p.v / r.entradas) * 100 : 0
              return (
                <div key={p.l}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>{p.l}</span><b style={{ fontWeight: 600, color: p.c === GR ? GR : W }}>R$ {Math.round(cada100)}</b></div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.08)', marginTop: 5 }}><div style={{ height: 6, borderRadius: 3, background: p.c, width: Math.min(100, (p.v / base) * 100) + '%' }} /></div>
                </div>
              )
            })}
          </div>
          {r.pessoal > 0 && <div style={{ border: '1px solid rgba(242,155,75,.55)', background: 'rgba(242,155,75,.08)', color: OR, borderRadius: 14, padding: '11px 14px', fontSize: 13, lineHeight: 1.5 }}>{brl(r.pessoal)} saíram do caixa do estúdio para gastos seus. {gastoPes > 0 ? `Desse total, ${brl(gastoPes)} foram gastos pessoais pagos com o dinheiro do estúdio.` : 'Foi a sua retirada (pró-labore).'}</div>}
          <Sec>Maiores gastos do mês</Sec>
          <Rows items={top.map(([c, v], i) => ({ key: c, n: i + 1 + 'º', a: c, b: r.entradas ? Math.round((v / r.entradas) * 100) + '% do que entrou' : '', v: brl(v), bar: (v / topMax) * 100, barC: c.includes('pessoal') || c.includes('Retirada') ? OR : 'rgba(255,255,255,.5)' }))} />
          <Note>Toque em Entrou × saiu para ver ou corrigir cada lançamento.</Note>
        </>
      )}
    </Screen>
  )
}
