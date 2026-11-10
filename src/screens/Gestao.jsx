import { useState } from 'react'
import * as db from '../data.js'
import { resumoMes, brl, gerarExemplos, contasDoMes, MESES_LONGOS } from '../finance.js'
import { Screen, Title, Note, Toast, card, btnPrimary, btnGhost, W, GR, OR, MUT } from '../ui.jsx'

export function Gestao({ tx, contas, cfg, ir, max, setPeriodo, toast, setToast, recarregar, onSair }) {
  const [ocupado, setOcupado] = useState(false)
  const r = resumoMes(tx, max.ano, max.mes)
  const temExemplos = tx.some((t) => t.exemplo)
  const abrir = (t) => { setPeriodo({ ...max }); ir(t) }
  const doMes = contasDoMes(contas, cfg, tx, max.ano, max.mes)
  const abertas = doMes.filter((c) => !c.pago)
  const itens = [
    ['▤', 'Contas do mês', abertas.length ? abertas.length + (abertas.length === 1 ? ' conta a pagar' : ' contas a pagar') : doMes.length ? 'Tudo pago ✓' : 'Cadastre suas contas fixas', abertas.length ? brl(abertas.reduce((a, c) => a + c.valor, 0)) : '', abertas.length ? OR : GR, 'contas'],
    ['◆', 'Lucro real', 'O negócio está dando lucro?', brl(r.lucro), r.lucro >= 0 ? GR : OR, 'lucro'],
    ['◐', 'Para onde vai o dinheiro', 'Cada gasto, quanto pesa', brl(r.saidas), W, 'onde'],
    ['⇅', 'Entrou × saiu', 'Fluxo de caixa e lançamentos', brl(r.saldo), r.saldo >= 0 ? W : OR, 'caixa'],
    ['$', 'Relatório financeiro', 'Mês a mês e o ano todo', brl(r.receita), W, 'relatorio'],
    ['≡', 'Custos do estúdio', 'Fixos, variáveis e impostos', brl(r.custos), W, 'custos'],
  ]

  const exemplos = async () => {
    setOcupado(true)
    try {
      if (temExemplos) { await db.excluirExemplos(); setToast({ msg: 'Dados de exemplo apagados. Ficaram só os seus lançamentos.' }) }
      else { await db.criarLancamentos(gerarExemplos()); setToast({ msg: 'Dados de exemplo carregados. Eles ficam marcados e dá para apagar depois.' }) }
      await recarregar()
    } catch (e) { setToast({ msg: e.message, erro: true }) }
    setOcupado(false)
  }

  return (
    <Screen>
      <Title a="Gestão" b="financeira" />
      <Note>Números de {MESES_LONGOS[max.mes]} de {max.ano}, calculados a partir dos seus lançamentos.</Note>
      <Toast {...(toast || {})} />
      <button onClick={() => ir('lancar', { editando: null })} style={btnPrimary}>+ Lançar entrada ou saída</button>
      {itens.map(([ic, t, s, v, vc, k]) => (
        <button key={k} onClick={() => abrir(k)} style={{ ...card, display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', width: '100%', padding: '12px 14px', minHeight: 60, cursor: 'pointer' }}>
          <span style={{ width: 38, height: 38, flex: 'none', borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{ic}</span>
          <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{t}</span><span style={{ display: 'block', fontSize: 12, color: MUT }}>{s}</span></span>
          <span style={{ fontSize: 13, fontWeight: 500, color: vc, whiteSpace: 'nowrap' }}>{v}</span><span style={{ color: MUT }}>›</span>
        </button>
      ))}
      {tx.length === 0 && <Note>Ainda não há lançamentos. Lance o primeiro, ou carregue dados de exemplo para ver como os relatórios funcionam.</Note>}
      <button onClick={exemplos} disabled={ocupado} style={btnGhost}>{ocupado ? 'Aguarde…' : temExemplos ? 'Apagar dados de exemplo' : 'Carregar dados de exemplo'}</button>
      <button onClick={() => ir('onboarding')} style={{ minHeight: 44, border: 0, background: 'none', color: MUT, fontSize: 13, cursor: 'pointer' }}>Configurar financeiro (aluguel, maquininha, imposto…)</button>
      <button onClick={onSair} style={{ minHeight: 44, border: 0, background: 'none', color: MUT, fontSize: 13, cursor: 'pointer' }}>Sair da conta</button>
    </Screen>
  )
}

export function Stub({ titulo }) {
  return (
    <Screen>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30 }}>{titulo}</div>
      <div style={{ border: '1px dashed rgba(255,255,255,.18)', borderRadius: 16, padding: '34px 16px', textAlign: 'center', color: MUT, fontSize: 13 }}>Chega nas próximas partes.</div>
    </Screen>
  )
}
