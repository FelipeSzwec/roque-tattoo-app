import { useState } from 'react'
import * as db from '../data.js'
import { CATEGORIAS, FORMAS, grupoDe, parseValor, isoHoje, brl2, GRUPO_LABEL } from '../finance.js'
import { Screen, Title, Back, Toast, Sec, Note, input, btnPrimary, btnDisabled, chipStyle, W, GR, OR, MUT } from '../ui.jsx'

export default function Lancar({ ir, recarregar, setPeriodo, editando }) {
  const e = editando
  const [tipo, setTipo] = useState(e?.tipo || 'saida')
  const [valor, setValor] = useState(e ? String(e.valor).replace('.', ',') : '')
  const [categoria, setCategoria] = useState(e?.categoria || '')
  const [forma, setForma] = useState(e?.forma_pagamento || 'pix')
  const [data, setData] = useState(e?.data || isoHoje())
  const [descricao, setDescricao] = useState(e?.descricao || '')
  const [erro, setErro] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const v = parseValor(valor)
  const ok = v > 0 && categoria && data
  const trocaTipo = (t) => { setTipo(t); setCategoria('') }
  const grupo = categoria ? grupoDe(tipo, categoria) : null

  const salvar = async () => {
    if (!ok || ocupado) return
    setOcupado(true); setErro(null)
    const reg = { data, tipo, valor: v, categoria, grupo, forma_pagamento: forma, descricao: descricao.trim() || null }
    try {
      if (e) await db.atualizarLancamento(e.id, reg)
      else await db.criarLancamentos([reg])
      await recarregar()
      setPeriodo({ ano: Number(data.slice(0, 4)), mes: Number(data.slice(5, 7)) - 1 })
      ir('caixa', { toast: { msg: (e ? 'Lançamento atualizado: ' : 'Lançado: ') + (tipo === 'entrada' ? '+ ' : '− ') + brl2(v) + ' em ' + categoria + '.' } })
    } catch (err) { setErro(err.message) }
    setOcupado(false)
  }

  const excluir = async () => {
    if (!e || ocupado) return
    setOcupado(true)
    try { await db.excluirLancamento(e.id); await recarregar(); ir('caixa', { toast: { msg: 'Lançamento excluído.' } }) } catch (err) { setErro(err.message) }
    setOcupado(false)
  }

  const label = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: MUT }
  const tipoBtn = (t, txt, cor) => ({ flex: 1, minHeight: 48, borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: `1px solid ${tipo === t ? cor : 'rgba(255,255,255,.2)'}`, background: tipo === t ? cor : 'transparent', color: tipo === t ? '#0A0A0C' : W })

  return (
    <Screen>
      <Back onClick={() => ir(e ? 'caixa' : 'gestao')} label={e ? 'Entrou × saiu' : 'Gestão'} />
      <Title a={e ? 'Editar' : 'Novo'} b="lançamento" />
      <Toast msg={erro} erro />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => trocaTipo('entrada')} style={tipoBtn('entrada', 'Entrada', GR)}>+ Entrou</button>
        <button onClick={() => trocaTipo('saida')} style={tipoBtn('saida', 'Saída', '#F2F2F2')}>− Saiu</button>
      </div>
      <label style={label}>Valor
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: MUT, fontSize: 15 }}>R$</span>
          <input inputMode="decimal" value={valor} onChange={(ev) => setValor(ev.target.value)} placeholder="0,00" style={{ ...input, paddingLeft: 44, fontSize: 22, minHeight: 58 }} autoFocus={!e} />
        </div>
      </label>
      <Sec>Categoria</Sec>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CATEGORIAS[tipo].map(([c, g]) => <button key={c} onClick={() => setCategoria(c)} style={{ ...chipStyle(categoria === c), minHeight: 40, borderColor: categoria === c ? (g === 'pessoal' ? OR : W) : 'rgba(255,255,255,.12)', color: categoria === c ? (g === 'pessoal' ? OR : W) : '#c9c9cd' }}>{c}</button>)}
      </div>
      {grupo && <Note>{grupo === 'pessoal' ? 'Pessoal: sai do caixa, mas não é custo do estúdio. Fica separado no lucro real.' : 'Entra no relatório como ' + GRUPO_LABEL[grupo].toLowerCase() + '.'}</Note>}
      <Sec>Forma de pagamento</Sec>
      <div style={{ display: 'flex', gap: 8 }}>
        {FORMAS.map(([k, l]) => <button key={k} onClick={() => setForma(k)} style={{ flex: 1, minHeight: 44, borderRadius: 22, fontSize: 14, cursor: 'pointer', border: `1px solid ${forma === k ? W : 'rgba(255,255,255,.25)'}`, background: forma === k ? W : 'transparent', color: forma === k ? '#0A0A0C' : W }}>{l}</button>)}
      </div>
      <label style={label}>Data<input type="date" value={data} onChange={(ev) => setData(ev.target.value)} style={{ ...input, colorScheme: 'dark' }} /></label>
      <label style={label}>Descrição (opcional)<input value={descricao} onChange={(ev) => setDescricao(ev.target.value)} placeholder={tipo === 'entrada' ? 'Ex.: Marina · peônia fine line' : 'Ex.: Caixa de agulhas RL 3'} style={input} /></label>
      <button onClick={salvar} style={ok && !ocupado ? btnPrimary : btnDisabled}>{ocupado ? 'Salvando…' : e ? 'Salvar alterações' : 'Lançar'}</button>
      {e && <button onClick={excluir} style={{ minHeight: 44, border: 0, background: 'none', color: OR, fontSize: 13, cursor: 'pointer' }}>Excluir lançamento</button>}
    </Screen>
  )
}
