// Agenda: mesmo layout do protótipo (semana, dia, sessões, limpeza, horário livre, bloqueios do iPhone).
import { useState } from 'react'
import * as db from '../data.js'
import { brl2, parseValor, isoHoje, FORMAS, taxaCartao } from '../finance.js'
import { blocosDoDia, inicioSemana, somaDias, mesmoDia, hhmm, chaveDia, DIAS_CURTOS, DIAS_LONGOS, MESES_CURTOS, STATUS, conflitos, duracaoTxt, linkWhats } from '../agenda.js'
import { Screen, Title, Back, Toast, Note, Sec, card, input, btnPrimary, btnDisabled, btnGhost, chipStyle, W, GR, OR, MUT, DIM } from '../ui.jsx'

const tracejado = { border: '1px dashed rgba(255,255,255,.18)', borderRadius: 14, padding: '9px 14px', fontSize: 12, color: MUT }

export default function Agenda(p) {
  const { sessoes, externos, externoErro, ag, toast, setToast, ir } = p
  const [dia, setDia] = useState(() => p.diaAgenda ? new Date(p.diaAgenda) : new Date())
  const [form, setForm] = useState(null) // {sessao} ou {novo:{inicio}}
  const [sync, setSync] = useState(false)
  const segunda = inicioSemana(dia)
  const hoje = new Date()

  if (sync) return <AgendaSync {...p} onVoltar={() => setSync(false)} onSalvo={(msg) => { setSync(false); setToast({ msg }) }} />
  if (form) return <SessaoForm {...p} {...form} onVoltar={() => setForm(null)} onSalvo={(msg, d) => { setForm(null); if (d) setDia(d); setToast({ msg }) }} />

  const { itens, trabalha, diaTodo } = blocosDoDia(dia, sessoes, externos, ag)
  const temSessao = (d) => sessoes.some((s) => s.status !== 'cancelada' && mesmoDia(new Date(s.inicio), d))
  const ligado = !!ag.calendario_externo_url
  const fimSemana = somaDias(segunda, 6)
  const novaEm = (h) => setForm({ novo: { inicio: h } })
  const seta = { minWidth: 44, minHeight: 44, borderRadius: 22, border: '1px solid rgba(255,255,255,.18)', background: 'transparent', color: W, fontSize: 18, cursor: 'pointer' }

  return (
    <Screen>
      <Title a="Sua" b="agenda" />
      <Toast {...(toast || {})} />
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
        <div style={{ flex: 1, fontSize: 12, lineHeight: 1.45 }}>
          <b style={{ fontSize: 13 }}>Calendário do iPhone</b><br />
          <span style={{ color: externoErro ? OR : MUT }}>{externoErro || (ligado ? 'Sincronizada. Sessões do app aparecem lá; compromissos de lá bloqueiam horários aqui.' : 'Ligue para as sessões irem para o iPhone e seus compromissos bloquearem horários aqui.')}</span>
        </div>
        <button onClick={() => setSync(true)} style={{ minHeight: 44, minWidth: 76, borderRadius: 22, fontSize: 12, cursor: 'pointer', border: '1px solid #F2F2F2', background: ligado ? W : 'transparent', color: ligado ? '#0A0A0C' : W }}>{ligado ? 'Ligada ✓' : 'Ligar'}</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => setDia(somaDias(dia, -7))} style={seta} aria-label="Semana anterior">‹</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: MUT }}>{segunda.getDate()} {MESES_CURTOS[segunda.getMonth()]} – {fimSemana.getDate()} {MESES_CURTOS[fimSemana.getMonth()]}{!mesmoDia(inicioSemana(hoje), segunda) && <button onClick={() => setDia(new Date())} style={{ marginLeft: 8, border: 0, background: 'none', color: W, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>hoje</button>}</div>
        <button onClick={() => setDia(somaDias(dia, 7))} style={seta} aria-label="Próxima semana">›</button>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: 7 }, (_, i) => somaDias(segunda, i)).map((d) => {
          const on = mesmoDia(d, dia), eHoje = mesmoDia(d, hoje)
          return (
            <button key={chaveDia(d)} onClick={() => setDia(d)} style={{ flex: 1, textAlign: 'center', border: `1px solid ${on ? W : 'rgba(255,255,255,.1)'}`, background: on ? 'rgba(255,255,255,.12)' : 'transparent', color: on ? W : '#c9c9cd', borderRadius: 14, padding: '8px 0', fontSize: 11, cursor: 'pointer', minHeight: 56 }}>
              <div style={{ fontWeight: eHoje ? 700 : 400 }}>{DIAS_CURTOS[d.getDay()]}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{d.getDate()}</div>
              <div style={{ width: 4, height: 4, borderRadius: 2, margin: '2px auto 0', background: temSessao(d) ? W : 'transparent' }} />
            </button>
          )
        })}
      </div>

      <Sec>{mesmoDia(dia, hoje) ? 'HOJE · ' : ''}{DIAS_LONGOS[dia.getDay()]}, {dia.getDate()}</Sec>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {itens.map((b, i) => {
          if (b.tipo === 'sessao') {
            const s = b.s, conf = s.status === 'confirmada' || s.status === 'realizada'
            return (
              <button key={s.id} onClick={() => setForm({ sessao: s })} style={{ textAlign: 'left', color: W, cursor: 'pointer', border: `1px solid ${conf ? W : 'rgba(255,255,255,.09)'}`, background: conf ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.04)', borderRadius: 16, padding: '12px 14px', fontSize: 13 }}>
                <b>{hhmm(b.ini)} – {hhmm(b.fim)}</b> · {s.cliente}
                {s.descricao && <div style={{ fontSize: 12, color: MUT }}>{s.descricao}</div>}
                <span style={{ fontSize: 11, color: s.status === 'agendada' ? MUT : s.status === 'faltou' ? OR : GR }}>{STATUS[s.status]}{s.sinal > 0 ? ' · sinal ' + brl2(s.sinal) : ''}</span>
              </button>
            )
          }
          if (b.tipo === 'limpeza') return <div key={'l' + i} style={tracejado}>{hhmm(b.ini)} – {hhmm(b.fim)} · Limpeza e esterilização</div>
          if (b.tipo === 'externo') return <div key={'e' + i} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '9px 14px', fontSize: 12, color: MUT }}>Do iPhone · {b.diaInteiro ? 'dia todo' : hhmm(b.ini)} · {b.titulo} (bloqueado)</div>
          return (
            <button key={'f' + i} onClick={() => novaEm(b.ini)} style={{ textAlign: 'left', cursor: 'pointer', background: 'transparent', border: '1px dashed rgba(255,255,255,.18)', borderRadius: 16, padding: '16px 14px', fontSize: 12, color: '#9a9aa0', display: 'flex', justifyContent: 'space-between' }}>
              <span>{hhmm(b.ini)} – {hhmm(b.fim)} · horário livre</span><span style={{ color: MUT }}>+ agendar</span>
            </button>
          )
        })}
        {!trabalha && !diaTodo && <div style={{ ...tracejado, padding: '16px 14px', textAlign: 'center' }}>Dia de folga. Dá para agendar mesmo assim em “Nova sessão”.</div>}
        {trabalha && !itens.length && <div style={{ ...tracejado, padding: '16px 14px', textAlign: 'center' }}>{dia < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) ? 'Nenhuma sessão neste dia.' : 'Expediente encerrado.'}</div>}
      </div>
      <button onClick={() => novaEm(null)} style={btnPrimary}>+ Nova sessão</button>
      <button onClick={() => setSync(true)} style={{ minHeight: 44, border: 0, background: 'none', color: MUT, fontSize: 13, cursor: 'pointer' }}>Horário de trabalho e calendário do iPhone</button>
    </Screen>
  )
}

// ---------- Nova sessão / editar / concluir ----------
function SessaoForm({ sessao, novo, sessoes, externos, tx, cfg, dia, recarregar, onVoltar, onSalvo }) {
  const s = sessao
  const ini0 = s ? new Date(s.inicio) : novo?.inicio ? new Date(novo.inicio) : null
  const [cliente, setCliente] = useState(s?.cliente || '')
  const [telefone, setTelefone] = useState(s?.telefone || '')
  const [data, setData] = useState(ini0 ? chaveDia(ini0) : chaveDia(dia || new Date()))
  const [hora, setHora] = useState(ini0 ? hhmm(ini0) : '14:00')
  const [dur, setDur] = useState(s ? Math.round((new Date(s.fim) - new Date(s.inicio)) / 60000) : 180)
  const [descricao, setDescricao] = useState(s?.descricao || '')
  const [valor, setValor] = useState(s?.valor ? String(s.valor).replace('.', ',') : '')
  const [sinal, setSinal] = useState(s?.sinal ? String(s.sinal).replace('.', ',') : '')
  const [status, setStatus] = useState(s?.status === 'confirmada' ? 'confirmada' : 'agendada')
  const [concluir, setConcluir] = useState(false)
  const [forma, setForma] = useState('pix')
  const [erro, setErro] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const inicio = new Date(data + 'T' + hora)
  const fim = new Date(inicio.getTime() + dur * 60000)
  const v = parseValor(valor), sn = parseValor(sinal)
  const ok = cliente.trim() && !isNaN(inicio) && dur > 0
  const choques = ok ? conflitos(inicio, fim, sessoes, externos, s?.id) : []
  const resta = Math.max(0, v - sn)
  const taxa = taxaCartao(cfg, forma, resta)
  const fechada = s && ['realizada', 'cancelada', 'faltou'].includes(s.status)
  const label = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: MUT }
  const lancSinal = s ? tx.find((t) => t.sessao_id === s.id && t.categoria === 'Sinal') : null
  const ehHoje = (d) => chaveDia(d) === isoHoje()

  const gravar = async (extra = {}) => {
    const reg = { id: s?.id, cliente: cliente.trim(), telefone: telefone.trim(), inicio: inicio.toISOString(), fim: fim.toISOString(), descricao: descricao.trim(), valor: v, sinal: sn, status, ...extra }
    const id = await db.salvarSessao(reg)
    // sinal recebido vira entrada no financeiro (uma vez só; se mudar o valor, ajusta)
    if (sn > 0 && !lancSinal) await db.criarLancamentos([{ data: isoHoje(), tipo: 'entrada', valor: sn, categoria: 'Sinal', grupo: 'receita', forma_pagamento: 'pix', descricao: 'Sinal · ' + reg.cliente, sessao_id: id }])
    else if (lancSinal && sn > 0 && sn !== Number(lancSinal.valor)) await db.atualizarLancamento(lancSinal.id, { valor: sn })
    else if (lancSinal && sn <= 0) await db.excluirLancamento(lancSinal.id)
    return id
  }
  const run = async (fn) => { if (ocupado) return; setOcupado(true); setErro(null); try { await fn() } catch (e) { setErro(e.message) } setOcupado(false) }

  const salvar = () => ok && run(async () => {
    await gravar()
    await recarregar()
    onSalvo((s ? 'Sessão atualizada: ' : 'Sessão marcada: ') + cliente.trim() + ', ' + DIAS_CURTOS[inicio.getDay()].toLowerCase() + ' ' + inicio.getDate() + ' às ' + hhmm(inicio) + (sn > 0 && !lancSinal ? '. Sinal de ' + brl2(sn) + ' lançado no financeiro.' : '.'), inicio)
  })
  const finalizar = () => run(async () => {
    const id = await gravar({ status: 'realizada', status_em: new Date().toISOString() })
    const dataLanc = ehHoje(inicio) || inicio > new Date() ? isoHoje() : chaveDia(inicio)
    const regs = []
    if (resta > 0) regs.push({ data: dataLanc, tipo: 'entrada', valor: resta, categoria: 'Sessão', grupo: 'receita', forma_pagamento: forma, descricao: cliente.trim() + (descricao.trim() ? ' · ' + descricao.trim() : ''), sessao_id: id })
    if (taxa > 0) regs.push({ data: dataLanc, tipo: 'saida', valor: taxa, categoria: 'Taxa de cartão', grupo: 'variavel', forma_pagamento: forma, descricao: `Taxa da maquininha sobre ${brl2(resta)}`, sessao_id: id })
    if (regs.length) await db.criarLancamentos(regs)
    await recarregar()
    onSalvo('Sessão concluída' + (resta > 0 ? ': + ' + brl2(resta) + ' no financeiro' + (taxa > 0 ? ` (taxa de ${brl2(taxa)} descontada)` : '') : '') + '.', inicio)
  })
  const cancelar = () => run(async () => { await db.salvarSessao({ ...s, status: 'cancelada', status_em: new Date().toISOString() }); await recarregar(); onSalvo('Sessão cancelada. O horário voltou a ficar livre' + (s.sinal > 0 ? ' e o sinal continua no caixa.' : '.'), inicio) })
  const faltou = () => run(async () => { await db.salvarSessao({ ...s, status: 'faltou', status_em: new Date().toISOString() }); await recarregar(); onSalvo('Marcado que ' + s.cliente.split(' ')[0] + ' não compareceu' + (s.sinal > 0 ? '. O sinal fica no caixa.' : '.'), inicio) })
  const excluir = () => run(async () => { if (lancSinal) await db.excluirLancamento(lancSinal.id); await db.excluirSessao(s.id); await recarregar(); onSalvo('Sessão apagada.', inicio) })

  if (concluir) return (
    <Screen>
      <Back onClick={() => setConcluir(false)} label="Sessão" />
      <Title a="Concluir" b="sessão" />
      <Toast msg={erro} erro />
      <div style={{ ...card, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{cliente}</div>
        {[['Valor da sessão', brl2(v)], ['Sinal já recebido', '− ' + brl2(sn)]].map(([l, x]) => <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: MUT }}><span>{l}</span><span>{x}</span></div>)}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 600, borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 8 }}><span>Recebe agora</span><span style={{ color: GR }}>{brl2(resta)}</span></div>
      </div>
      <label style={label}>Valor final da sessão<input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" style={input} /></label>
      {resta > 0 && <>
        <div style={{ fontSize: 13, color: MUT }}>Como pagou?</div>
        <div style={{ display: 'flex', gap: 6 }}>{FORMAS.map(([k, l]) => <button key={k} onClick={() => setForma(k)} style={{ ...chipStyle(forma === k), flex: 1, padding: 0, minHeight: 40 }}>{l}</button>)}</div>
        {taxa > 0 && <Note>Taxa da maquininha: <b style={{ color: W }}>− {brl2(taxa)}</b>, lançada sozinha como custo.</Note>}
      </>}
      <button onClick={finalizar} style={ocupado ? btnDisabled : btnPrimary}>{ocupado ? 'Salvando…' : resta > 0 ? 'Concluir e lançar ' + brl2(resta) : 'Concluir sessão'}</button>
    </Screen>
  )

  const durs = [60, 120, 180, 240, 300, 360]
  return (
    <Screen>
      <Back onClick={onVoltar} label="Agenda" />
      <Title a={s ? 'Sessão' : 'Nova'} b={s ? cliente.split(' ')[0] || 'sessão' : 'sessão'} />
      <Toast msg={erro} erro />
      {fechada && <Note>Esta sessão está {{ realizada: 'concluída', cancelada: 'cancelada', faltou: 'marcada como não compareceu' }[s.status]}. Você ainda pode corrigir os dados.</Note>}
      <label style={label}>Cliente<input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nome do cliente" autoFocus={!s} style={input} /></label>
      <label style={label}>WhatsApp (opcional)<input inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 90000-0000" style={input} /></label>
      {linkWhats(telefone) && <a href={linkWhats(telefone)} target="_blank" rel="noreferrer" style={{ alignSelf: 'flex-start', fontSize: 13, color: W }}>Abrir conversa no WhatsApp ›</a>}
      <div style={{ display: 'flex', gap: 10 }}>
        <label style={{ ...label, flex: 1.3 }}>Dia<input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ ...input, colorScheme: 'dark' }} /></label>
        <label style={{ ...label, flex: 1 }}>Início<input type="time" step="900" value={hora} onChange={(e) => setHora(e.target.value)} style={{ ...input, colorScheme: 'dark' }} /></label>
      </div>
      <div style={{ fontSize: 13, color: MUT }}>Duração {ok && <span style={{ color: DIM }}>· termina {hhmm(fim)}</span>}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{durs.concat(durs.includes(dur) ? [] : [dur]).map((m) => <button key={m} onClick={() => setDur(m)} style={{ ...chipStyle(dur === m), minHeight: 40 }}>{duracaoTxt(m)}</button>)}</div>
      {choques.length > 0 && <Note><span style={{ color: OR }}>Choca com: {choques.join(', ')}.</span> Dá para salvar mesmo assim.</Note>}
      <label style={label}>Descrição (opcional)<input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Peônia fine line · costela" style={input} /></label>
      <div style={{ display: 'flex', gap: 10 }}>
        <label style={{ ...label, flex: 1 }}>Valor total<input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" style={input} /></label>
        <label style={{ ...label, flex: 1 }}>Sinal pago<input inputMode="decimal" value={sinal} onChange={(e) => setSinal(e.target.value)} placeholder="0,00" style={input} /></label>
      </div>
      {sn > 0 && !lancSinal && <Note>O sinal entra no financeiro como “Sinal” quando você salvar.</Note>}
      {!fechada && <div style={{ display: 'flex', gap: 6 }}>{[['agendada', 'Aguardando'], ['confirmada', 'Confirmada']].map(([k, l]) => <button key={k} onClick={() => setStatus(k)} style={{ ...chipStyle(status === k), flex: 1 }}>{l}</button>)}</div>}
      <button onClick={salvar} style={ok && !ocupado ? btnPrimary : btnDisabled}>{ocupado ? 'Salvando…' : s ? 'Salvar alterações' : 'Marcar sessão'}</button>
      {s && !fechada && <button onClick={() => ok && setConcluir(true)} style={btnGhost}>✓ Concluir sessão (cliente pagou)</button>}
      {s && !fechada && new Date(s.inicio) < new Date() && <button onClick={faltou} style={{ minHeight: 44, border: 0, background: 'none', color: OR, fontSize: 13, cursor: 'pointer' }}>Cliente não veio</button>}
      {s && !fechada && <button onClick={cancelar} style={{ minHeight: 44, border: 0, background: 'none', color: OR, fontSize: 13, cursor: 'pointer' }}>Cliente cancelou</button>}
      {s && <button onClick={excluir} style={{ minHeight: 44, border: 0, background: 'none', color: MUT, fontSize: 13, cursor: 'pointer' }}>Apagar sessão</button>}
    </Screen>
  )
}

// ---------- Ligação com o Calendário do iPhone + horário de trabalho ----------
function AgendaSync({ ag, recarregar, onVoltar, onSalvo }) {
  const [url, setUrl] = useState(ag.calendario_externo_url || '')
  const [hi, setHi] = useState(ag.hora_inicio)
  const [hf, setHf] = useState(ag.hora_fim)
  const [dias, setDias] = useState(ag.dias_trabalho || [])
  const [limpeza, setLimpeza] = useState(ag.limpeza_min)
  const [erro, setErro] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const link = db.linkCalendario(ag.ics_token)
  const urlOk = !url.trim() || /^(webcals?|https):\/\/\S+$/i.test(url.trim())
  const copiar = async () => { try { await navigator.clipboard.writeText(link) } catch { /* sem permissão */ } setCopiado(true) }
  const salvar = async () => {
    if (!urlOk || hf <= hi) return
    try { await db.salvarConfigAgenda({ calendario_externo_url: url, hora_inicio: Number(hi), hora_fim: Number(hf), dias_trabalho: dias, limpeza_min: limpeza }); await recarregar(); onSalvo('Agenda configurada.' + (url.trim() ? ' Compromissos do iPhone já bloqueiam horários.' : '')) } catch (e) { setErro(e.message) }
  }
  const passo = (n, t) => <div style={{ display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.45 }}><span style={{ width: 22, height: 22, flex: 'none', borderRadius: 11, border: '1px solid rgba(255,255,255,.3)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span><span>{t}</span></div>
  const horas = Array.from({ length: 24 }, (_, h) => h)
  const sel = { ...input, colorScheme: 'dark' }

  return (
    <Screen>
      <Back onClick={onVoltar} label="Agenda" />
      <Title a="Calendário do" b="iPhone" />
      <Toast msg={erro} erro />
      {db.modoDemo && <Note>No modo demonstração a ligação com o iPhone não funciona. Entre com sua conta para usar.</Note>}

      <Sec>1 · Sessões do app no iPhone</Sec>
      <div style={{ ...card, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {passo(1, 'Abra este app no iPhone e toque no botão abaixo.')}
        {passo(2, <>O iPhone pergunta se quer assinar. Toque em <b>Assinar</b> e depois em <b>OK</b>.</>)}
        {passo(3, <>Pronto: aparece o calendário <b>Tattoo · Sessões</b>. Tudo o que você marcar aqui vai para lá sozinho.</>)}
        {link ? <a href={link} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>Assinar no Calendário do iPhone</a> : <button style={btnDisabled}>Assinar no Calendário do iPhone</button>}
        {link && <button onClick={copiar} style={{ minHeight: 40, border: 0, background: 'none', color: MUT, fontSize: 12, cursor: 'pointer' }}>{copiado ? 'Link copiado ✓' : 'Ou copiar o link'}</button>}
        <Note>O iPhone atualiza calendários assinados de tempos em tempos. Para ficar mais rápido: Ajustes › Calendário › Contas › Obter Dados › “A Cada 15 Minutos”.</Note>
      </div>

      <Sec>2 · Compromissos do iPhone bloqueiam a agenda</Sec>
      <div style={{ ...card, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {passo(1, <>No iPhone, abra o app <b>Calendário</b> e toque em <b>Calendários</b> (embaixo).</>)}
        {passo(2, <>Toque no <b>ⓘ</b> ao lado do seu calendário pessoal (do iCloud).</>)}
        {passo(3, <>Ative <b>Calendário Público</b>, toque em <b>Compartilhar Link</b> e em <b>Copiar</b>.</>)}
        {passo(4, 'Cole o link aqui embaixo e salve.')}
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="webcal://p…-caldav.icloud.com/published/…" style={{ ...input, fontSize: 13 }} />
        {!urlOk && <Note><span style={{ color: OR }}>Esse link não parece de calendário. Ele começa com webcal://</span></Note>}
        <Note>O app só usa os horários para bloquear a agenda. O link é secreto: quem tiver ele consegue ver esse calendário, então não compartilhe.</Note>
      </div>

      <Sec>3 · Horário de trabalho</Sec>
      <div style={{ display: 'flex', gap: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: MUT, flex: 1 }}>Abre às<select value={hi} onChange={(e) => setHi(Number(e.target.value))} style={sel}>{horas.map((h) => <option key={h} value={h}>{h}:00</option>)}</select></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: MUT, flex: 1 }}>Fecha às<select value={hf} onChange={(e) => setHf(Number(e.target.value))} style={sel}>{horas.map((h) => <option key={h} value={h}>{h}:00</option>)}</select></label>
      </div>
      <div style={{ display: 'flex', gap: 5 }}>{[1, 2, 3, 4, 5, 6, 0].map((d) => <button key={d} onClick={() => setDias(dias.includes(d) ? dias.filter((x) => x !== d) : [...dias, d])} style={{ ...chipStyle(dias.includes(d)), flex: 1, padding: 0, minHeight: 40 }}>{DIAS_CURTOS[d]}</button>)}</div>
      <div style={{ fontSize: 13, color: MUT }}>Limpeza e esterilização depois de cada sessão</div>
      <div style={{ display: 'flex', gap: 6 }}>{[0, 30, 45, 60].map((m) => <button key={m} onClick={() => setLimpeza(m)} style={{ ...chipStyle(limpeza === m), flex: 1 }}>{m ? m + ' min' : 'Não'}</button>)}</div>
      <button onClick={salvar} style={urlOk && hf > hi ? btnPrimary : btnDisabled}>Salvar</button>
    </Screen>
  )
}
