// Lançamento em 3 toques: valor, categoria, Lançar. O resto já vem preenchido.
import { useState } from 'react'
import * as db from '../data.js'
import { CATEGORIAS, FORMAS, grupoDe, parseValor, isoHoje, brl2, taxaCartao } from '../finance.js'
import { Screen, Back, Toast, Note, input, btnPrimary, btnDisabled, chipStyle, card, W, GR, OR, MUT } from '../ui.jsx'

const RAPIDAS = {
  entrada: [['Sessão', '✒'], ['Sinal', '◎'], ['Retoque', '↻'], ['Venda de produto', '▣']],
  saida: [['Materiais e tintas', '✎'], ['Descartáveis', '◌'], ['Divulgação', '✦'], ['Manutenção', '⚙'], ['Retirada pessoal', '◐'], ['Gasto pessoal', '◑']],
}
const CURTO = { 'Materiais e tintas': 'Material', 'Venda de produto': 'Produto', 'Retirada pessoal': 'Retirada', 'Gasto pessoal': 'Pessoal' }

export default function Lancar({ ir, recarregar, setPeriodo, editando, cfg }) {
  const e = editando
  const [tipo, setTipo] = useState(e?.tipo || 'entrada')
  const [valor, setValor] = useState(e ? String(e.valor).replace('.', ',') : '')
  const [categoria, setCategoria] = useState(e?.categoria || '')
  const [forma, setForma] = useState(e?.forma_pagamento === 'cartao' ? 'credito' : e?.forma_pagamento || 'pix')
  const [data, setData] = useState(e?.data || isoHoje())
  const [descricao, setDescricao] = useState(e?.descricao || '')
  const [mais, setMais] = useState(!!e)
  const [todas, setTodas] = useState(false)
  const [erro, setErro] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const v = parseValor(valor)
  const ok = v > 0 && categoria && data
  const taxa = !e && tipo === 'entrada' ? taxaCartao(cfg, forma, v) : 0
  const trocaTipo = (t) => { setTipo(t); setCategoria(''); setTodas(false) }
  const rapidas = RAPIDAS[tipo]
  const extras = CATEGORIAS[tipo].filter(([c]) => !rapidas.some(([r]) => r === c))
  const grupo = categoria ? grupoDe(tipo, categoria) : null

  const salvar = async () => {
    if (!ok || ocupado) return
    setOcupado(true); setErro(null)
    const reg = { data, tipo, valor: v, categoria, grupo, forma_pagamento: forma, descricao: descricao.trim() || null }
    try {
      if (e) await db.atualizarLancamento(e.id, reg)
      else {
        const regs = [reg]
        if (taxa > 0) regs.push({ data, tipo: 'saida', valor: taxa, categoria: 'Taxa de cartão', grupo: 'variavel', forma_pagamento: forma, descricao: `Taxa da maquininha sobre ${brl2(v)}` })
        await db.criarLancamentos(regs)
      }
      await recarregar()
      setPeriodo({ ano: Number(data.slice(0, 4)), mes: Number(data.slice(5, 7)) - 1 })
      const sinal = tipo === 'entrada' ? '+ ' : '− '
      ir('caixa', { toast: { msg: (e ? 'Atualizado: ' : 'Lançado: ') + sinal + brl2(v) + ' em ' + categoria + (taxa > 0 ? ` (taxa de ${brl2(taxa)} descontada)` : '') + '.' } })
    } catch (err) { setErro(err.message) }
    setOcupado(false)
  }

  const excluir = async () => {
    if (!e || ocupado) return
    setOcupado(true)
    try { await db.excluirLancamento(e.id); await recarregar(); ir('caixa', { toast: { msg: 'Lançamento excluído.' } }) } catch (err) { setErro(err.message) }
    setOcupado(false)
  }

  const cor = tipo === 'entrada' ? GR : W
  const tipoBtn = (t, c) => ({ flex: 1, minHeight: 48, borderRadius: 24, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: `1px solid ${tipo === t ? c : 'rgba(255,255,255,.2)'}`, background: tipo === t ? c : 'transparent', color: tipo === t ? '#0A0A0C' : W })
  const tile = (on, pes) => ({ ...card, minHeight: 74, padding: '10px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, borderColor: on ? (pes ? OR : W) : 'rgba(255,255,255,.16)', background: on ? 'rgba(255,255,255,.14)' : card.background, color: on && pes ? OR : W })
  const label = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: MUT }

  return (
    <Screen>
      <Back onClick={() => ir(e ? 'caixa' : 'gestao')} label={e ? 'Entrou × saiu' : 'Voltar'} />
      <Toast msg={erro} erro />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => trocaTipo('entrada')} style={tipoBtn('entrada', GR)}>+ Entrou</button>
        <button onClick={() => trocaTipo('saida')} style={tipoBtn('saida', W)}>− Saiu</button>
      </div>

      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: MUT, fontSize: 20 }}>R$</span>
        <input inputMode="decimal" value={valor} onChange={(ev) => setValor(ev.target.value)} placeholder="0,00" autoFocus={!e} aria-label="Valor"
          style={{ ...input, paddingLeft: 58, fontSize: 34, fontWeight: 500, minHeight: 76, borderRadius: 18, color: cor, textAlign: 'left' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {rapidas.map(([c, ic]) => {
          const pes = grupoDe(tipo, c) === 'pessoal'
          return (
            <button key={c} onClick={() => setCategoria(c)} style={tile(categoria === c, pes)}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{ic}</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{CURTO[c] || c}</span>
            </button>
          )
        })}
        {!todas && <button onClick={() => setTodas(true)} style={tile(extras.some(([c]) => c === categoria), false)}><span style={{ fontSize: 22, lineHeight: 1 }}>⋯</span><span style={{ fontSize: 12 }}>Outras</span></button>}
      </div>
      {(todas || extras.some(([c]) => c === categoria)) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {extras.map(([c]) => <button key={c} onClick={() => setCategoria(c)} style={{ ...chipStyle(categoria === c), minHeight: 40 }}>{c}</button>)}
        </div>
      )}
      {grupo === 'pessoal' && <Note>Pessoal: sai do caixa, mas não conta como custo do estúdio. Aparece separado no Lucro real.</Note>}

      <div style={{ display: 'flex', gap: 6 }}>
        {FORMAS.map(([k, l]) => <button key={k} onClick={() => setForma(k)} style={{ flex: 1, minHeight: 40, borderRadius: 20, fontSize: 13, cursor: 'pointer', border: `1px solid ${forma === k ? W : 'rgba(255,255,255,.2)'}`, background: forma === k ? 'rgba(255,255,255,.14)' : 'transparent', color: forma === k ? W : '#c9c9cd' }}>{l}</button>)}
      </div>
      {taxa > 0 && <Note>Taxa da maquininha ({forma === 'credito' ? cfg.taxa_credito : cfg.taxa_debito}%): <b style={{ color: W }}>− {brl2(taxa)}</b>, lançada sozinha como custo.</Note>}

      {!mais
        ? <button onClick={() => setMais(true)} style={{ alignSelf: 'flex-start', minHeight: 36, border: 0, background: 'none', color: MUT, fontSize: 13, cursor: 'pointer', padding: 0 }}>+ Data e descrição (hoje)</button>
        : (<>
          <label style={label}>Data<input type="date" value={data} onChange={(ev) => setData(ev.target.value)} style={{ ...input, colorScheme: 'dark' }} /></label>
          <label style={label}>Descrição (opcional)<input value={descricao} onChange={(ev) => setDescricao(ev.target.value)} placeholder={tipo === 'entrada' ? 'Ex.: Marina · peônia fine line' : 'Ex.: Caixa de agulhas RL 3'} style={input} /></label>
        </>)}

      <button onClick={salvar} style={ok && !ocupado ? btnPrimary : btnDisabled}>{ocupado ? 'Salvando…' : e ? 'Salvar alterações' : 'Lançar'}</button>
      {e && <button onClick={excluir} style={{ minHeight: 44, border: 0, background: 'none', color: OR, fontSize: 13, cursor: 'pointer' }}>Excluir lançamento</button>}
    </Screen>
  )
}
