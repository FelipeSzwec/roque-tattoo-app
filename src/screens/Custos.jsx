import { resumoMes, lancMes, porCategoria, brl, variacao, MESES, MESES_LONGOS } from '../finance.js'
import { Screen, Title, Back, Sec, Note, Kpis, Rows, MonthNav, btnGhost, GR, OR, MUT } from '../ui.jsx'

export default function Custos({ tx, ir, periodo, setPeriodo, max }) {
  const { ano, mes } = periodo
  const r = resumoMes(tx, ano, mes)
  const ant = mes === 0 ? resumoMes(tx, ano - 1, 11) : resumoMes(tx, ano, mes - 1)
  const lista = lancMes(tx, ano, mes)
  const v = variacao(r.custos, ant.custos)
  const grupo = (g) => porCategoria(lista, (t) => t.tipo === 'saida' && t.grupo === g)
  const linhas = (arr, tot) => arr.map(([c, val]) => ({ key: c, a: c, b: tot ? Math.round((val / tot) * 100) + '% deste grupo' : '', v: brl(val), bar: tot ? (val / tot) * 100 : 0, barC: 'rgba(255,255,255,.5)' }))

  return (
    <Screen>
      <Back onClick={() => ir('gestao')} />
      <Title a="Custos do" b="estúdio" />
      <MonthNav ano={ano} mes={mes} onChange={setPeriodo} MESES_LONGOS={MESES_LONGOS} max={max} />
      <Kpis items={[
        { l: 'CUSTOS DO MÊS', v: brl(r.custos), d: v ? v.txt + ' vs ' + MESES[mes === 0 ? 11 : mes - 1].toLowerCase() : '—', c: v ? (v.p <= 0 ? GR : OR) : MUT },
        { l: 'PESO NO FATURAMENTO', v: r.receita ? Math.round((r.custos / r.receita) * 100) + '%' : '—', d: 'de ' + brl(r.receita) },
        { l: 'FIXOS', v: brl(r.fixo), d: 'aluguel, contas, contador' },
        { l: 'VARIÁVEIS + IMPOSTOS', v: brl(r.variavel + r.imposto), d: 'material, divulgação, DAS' },
      ]} />
      <Sec>Custos fixos</Sec>
      <Rows items={linhas(grupo('fixo'), r.fixo)} empty="Nenhum custo fixo lançado neste mês." />
      <Sec>Custos variáveis</Sec>
      <Rows items={linhas(grupo('variavel'), r.variavel)} empty="Nenhum custo variável lançado neste mês." />
      <Sec>Impostos</Sec>
      <Rows items={linhas(grupo('imposto'), r.imposto)} empty="Nenhum imposto lançado neste mês." />
      <button onClick={() => ir('lancar', { editando: null })} style={btnGhost}>+ Lançar custo</button>
      <Note>Retiradas e gastos pessoais não entram aqui: eles aparecem separados em Lucro real.</Note>
    </Screen>
  )
}
