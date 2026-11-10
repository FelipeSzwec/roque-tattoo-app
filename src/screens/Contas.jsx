// Contas do mês: o que está "a pagar" e o que já foi pago. Um toque em "Paguei" vira lançamento.
import { useState } from 'react'
import * as db from '../data.js'
import { contasDoMes, brl, brl2, dataBR, parseValor, isoHoje, CATEGORIAS, grupoDe, MESES_LONGOS } from '../finance.js'
import { Screen, Title, Back, Toast, Note, MonthNav, card, input, btnPrimary, btnGhost, chipStyle, W, GR, OR, MUT } from '../ui.jsx'

export default function Contas({ tx, contas, cfg, ir, periodo, setPeriodo, max, toast, setToast, recarregar }) {
  const { ano, mes } = periodo
  const lista = contasDoMes(contas, cfg, tx, ano, mes)
  const pagas = lista.filter((c) => c.pago), abertas = lista.filter((c) => !c.pago)
  const totPago = pagas.reduce((a, c) => a + Number(c.pago.valor), 0)
  const totAberto = abertas.reduce((a, c) => a + c.valor, 0)
  const ehAtual = ano === max.ano && mes === max.mes
  const diaHoje = new Date().getDate()
  const [ocupado, setOcupado] = useState(null)
  const [editando, setEditando] = useState(null) // conta sendo editada/criada

  const pagar = async (c) => {
    setOcupado(c.id)
    try {
      const dia = ehAtual ? isoHoje() : `${ano}-${String(mes + 1).padStart(2, '0')}-${String(Math.min(c.dia, 28)).padStart(2, '0')}`
      await db.criarLancamentos([{ data: dia, tipo: 'saida', valor: c.valor, categoria: c.categoria, grupo: c.grupo, forma_pagamento: 'pix', descricao: c.nome, ...(c.virtual ? {} : { conta_id: c.id }) }])
      await recarregar()
      setToast({ msg: `${c.nome} paga: − ${brl2(c.valor)}.` })
    } catch (e) { setToast({ msg: e.message, erro: true }) }
    setOcupado(null)
  }
  const desfazer = async (c) => {
    setOcupado(c.id)
    try { await db.excluirLancamento(c.pago.id); await recarregar(); setToast({ msg: `${c.nome} voltou para "a pagar".` }) } catch (e) { setToast({ msg: e.message, erro: true }) }
    setOcupado(null)
  }

  if (editando) return <EditarConta conta={editando} onVoltar={() => setEditando(null)} onSalvo={async (msg) => { await recarregar(); setEditando(null); setToast({ msg }) }} />

  return (
    <Screen>
      <Back onClick={() => ir('gestao')} />
      <Title a="Contas do" b="mês" />
      <Toast {...(toast || {})} />
      <MonthNav ano={ano} mes={mes} onChange={setPeriodo} MESES_LONGOS={MESES_LONGOS} max={{ ano: max.ano, mes: max.mes + 1 }} />
      <div style={{ ...card, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 11, letterSpacing: '.1em', color: MUT }}>{abertas.length ? 'FALTA PAGAR' : 'TUDO PAGO'}</div>
        <div style={{ fontSize: 30, fontWeight: 500, color: abertas.length ? W : GR }}>{abertas.length ? brl(totAberto) : '✓'}</div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,.1)', marginTop: 8, overflow: 'hidden' }}><div style={{ height: 8, background: GR, width: (totPago + totAberto ? (totPago / (totPago + totAberto)) * 100 : 0) + '%' }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 2 }}><span style={{ color: GR }}>Pago {brl(totPago)} · {pagas.length}</span><span style={{ color: MUT }}>A pagar {abertas.length}</span></div>
      </div>

      {lista.length === 0 && <div style={{ border: '1px dashed rgba(255,255,255,.18)', borderRadius: 16, padding: '26px 16px', textAlign: 'center', color: MUT, fontSize: 13, lineHeight: 1.5 }}>Nenhuma conta fixa cadastrada.<br />Cadastre aluguel, luz, internet… e elas aparecem aqui todo mês.</div>}

      {lista.map((c) => {
        const atrasada = !c.pago && ehAtual && c.dia < diaHoje
        return (
          <div key={c.id} style={{ ...card, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, opacity: c.pago ? 0.75 : 1 }}>
            <button onClick={() => !c.virtual && setEditando(c)} style={{ flex: 1, minWidth: 0, textAlign: 'left', border: 0, background: 'none', color: W, padding: 0, cursor: c.virtual ? 'default' : 'pointer' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{c.nome}</div>
              <div style={{ fontSize: 12, color: c.pago ? GR : atrasada ? OR : MUT }}>
                {c.pago ? `✓ Paga em ${dataBR(c.pago.data)}` : atrasada ? `Venceu dia ${c.dia}` : `Vence dia ${c.dia}`}{c.nota ? ' · ' + c.nota : ''}
              </div>
            </button>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{brl2(c.pago ? Number(c.pago.valor) : c.valor)}</div>
            </div>
            {c.pago
              ? <button onClick={() => desfazer(c)} disabled={ocupado === c.id} style={{ minHeight: 40, borderRadius: 20, padding: '0 12px', fontSize: 12, cursor: 'pointer', border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: MUT }}>Desfazer</button>
              : <button onClick={() => pagar(c)} disabled={ocupado === c.id || c.valor <= 0} style={{ minHeight: 40, borderRadius: 20, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 0, background: W, color: '#0A0A0C' }}>{ocupado === c.id ? '…' : 'Paguei'}</button>}
          </div>
        )
      })}

      <button onClick={() => setEditando({ nome: '', categoria: 'Aluguel', valor: '', dia: 5 })} style={btnGhost}>+ Nova conta fixa</button>
      <Note>Toque no nome de uma conta para mudar o valor, o dia ou removê-la. Valor diferente neste mês? Pague e depois ajuste o lançamento em Entrou × saiu.</Note>
      <button onClick={() => ir('onboarding')} style={{ minHeight: 44, border: 0, background: 'none', color: MUT, fontSize: 13, cursor: 'pointer' }}>Refazer o primeiro acesso guiado</button>
    </Screen>
  )
}

function EditarConta({ conta, onVoltar, onSalvo }) {
  const [nome, setNome] = useState(conta.nome)
  const [categoria, setCategoria] = useState(conta.categoria)
  const [valor, setValor] = useState(conta.valor === '' ? '' : String(conta.valor).replace('.', ','))
  const [dia, setDia] = useState(conta.dia)
  const [erro, setErro] = useState(null)
  const v = parseValor(valor)
  const ok = nome.trim() && v > 0 && dia >= 1 && dia <= 31
  const salvar = async () => {
    if (!ok) return
    try { await db.salvarContas([{ ...(conta.id ? { id: conta.id } : {}), nome: nome.trim(), categoria, grupo: grupoDe('saida', categoria), valor: v, dia: Number(dia), ativa: true }]); await onSalvo(conta.id ? 'Conta atualizada.' : 'Conta criada. Ela aparece todo mês.') } catch (e) { setErro(e.message) }
  }
  const remover = async () => { try { await db.excluirConta(conta.id); await onSalvo('Conta removida. Os pagamentos antigos continuam no histórico.') } catch (e) { setErro(e.message) } }
  const label = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: MUT }
  return (
    <Screen>
      <Back onClick={onVoltar} label="Contas do mês" />
      <Title a={conta.id ? 'Editar' : 'Nova'} b="conta fixa" />
      <Toast msg={erro} erro />
      <label style={label}>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Aluguel do espaço" style={input} /></label>
      <label style={label}>Valor por mês
        <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: MUT }}>R$</span><input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" style={{ ...input, paddingLeft: 44, fontSize: 20 }} /></div>
      </label>
      <label style={label}>Vence todo dia<input type="number" min="1" max="31" value={dia} onChange={(e) => setDia(e.target.value)} style={input} /></label>
      <div style={{ fontSize: 13, color: MUT }}>Categoria</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CATEGORIAS.saida.map(([c]) => <button key={c} onClick={() => setCategoria(c)} style={{ ...chipStyle(categoria === c), minHeight: 38 }}>{c}</button>)}
      </div>
      <button onClick={salvar} style={ok ? btnPrimary : { ...btnPrimary, opacity: 0.4 }}>Salvar</button>
      {conta.id && <button onClick={remover} style={{ minHeight: 44, border: 0, background: 'none', color: OR, fontSize: 13, cursor: 'pointer' }}>Remover esta conta</button>}
    </Screen>
  )
}
