// Acesso aos dados. Com as variáveis do Supabase configuradas, usa o banco real.
// Sem elas, roda em "modo demonstração", guardando tudo no navegador.
import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = URL && KEY ? createClient(URL, KEY) : null
export const modoDemo = !supabase

const CAMPOS = 'id, data, tipo, valor, categoria, grupo, forma_pagamento, descricao, exemplo, conta_id, sessao_id, created_at'
const LS_TX = 'roque-lancamentos-v1'
const LS_SESSAO = 'roque-sessao-v1'
const LS_CONTAS = 'roque-contas-v1'
const LS_CONFIG = 'roque-config-v1'

const lsGet = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def } catch { return def } }
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* sem armazenamento */ } }
const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random())

// ---------- Login ----------
export async function sessaoAtual() {
  if (supabase) return (await supabase.auth.getSession()).data.session
  return lsGet(LS_SESSAO, null)
}

export function aoMudarSessao(cb) {
  if (supabase) {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => cb(s))
    return () => data.subscription.unsubscribe()
  }
  return () => {}
}

export async function entrar(email, senha) {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw new Error(traduzErro(error.message))
    return data.session
  }
  const s = { user: { email, id: 'demo' } }
  lsSet(LS_SESSAO, s)
  return s
}

export async function criarConta(email, senha, nome) {
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({ email, password: senha, options: { data: { nome }, emailRedirectTo: window.location.origin + import.meta.env.BASE_URL } })
    if (error) throw new Error(traduzErro(error.message))
    return data.session // null quando precisa confirmar o e-mail
  }
  return entrar(email, senha)
}

export async function esqueciSenha(email) {
  if (!supabase) return
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + import.meta.env.BASE_URL })
  if (error) throw new Error(traduzErro(error.message))
}

export async function sair() {
  if (supabase) await supabase.auth.signOut()
  else localStorage.removeItem(LS_SESSAO)
}

function traduzErro(m) {
  if (/invalid login/i.test(m)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.'
  if (/already registered/i.test(m)) return 'Este e-mail já tem conta. Use Entrar.'
  if (/password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.'
  return m
}

// ---------- Lançamentos ----------
export async function listarLancamentos() {
  if (supabase) {
    const { data, error } = await supabase.from('lancamentos').select(CAMPOS).order('data', { ascending: false }).limit(5000)
    if (error) throw error
    return data.map((t) => ({ ...t, valor: Number(t.valor) }))
  }
  return lsGet(LS_TX, [])
}

export async function criarLancamentos(lista) {
  if (supabase) {
    const { error } = await supabase.from('lancamentos').insert(lista)
    if (error) throw error
    return
  }
  lsSet(LS_TX, [...lsGet(LS_TX, []), ...lista.map((t) => ({ id: novoId(), created_at: new Date().toISOString(), exemplo: false, ...t }))])
}

export async function atualizarLancamento(id, campos) {
  if (supabase) {
    const { error } = await supabase.from('lancamentos').update(campos).eq('id', id)
    if (error) throw error
    return
  }
  lsSet(LS_TX, lsGet(LS_TX, []).map((t) => (t.id === id ? { ...t, ...campos } : t)))
}

export async function excluirLancamento(id) {
  if (supabase) {
    const { error } = await supabase.from('lancamentos').delete().eq('id', id)
    if (error) throw error
    return
  }
  lsSet(LS_TX, lsGet(LS_TX, []).filter((t) => t.id !== id))
}

export async function excluirExemplos() {
  if (supabase) {
    const { error } = await supabase.from('lancamentos').delete().eq('exemplo', true)
    if (error) throw error
    return
  }
  lsSet(LS_TX, lsGet(LS_TX, []).filter((t) => !t.exemplo))
}

// ---------- Contas fixas (repetem todo mês) ----------
export async function listarContas() {
  if (supabase) {
    const { data, error } = await supabase.from('contas_fixas').select('id, nome, categoria, grupo, valor, dia, ativa').order('dia')
    if (error) throw error
    return data.map((c) => ({ ...c, valor: Number(c.valor) }))
  }
  return lsGet(LS_CONTAS, [])
}

export async function salvarContas(lista) {
  // lista de contas novas ({nome, categoria, grupo, valor, dia}) ou existentes (com id)
  if (supabase) {
    const novas = lista.filter((c) => !c.id), velhas = lista.filter((c) => c.id)
    if (novas.length) { const { error } = await supabase.from('contas_fixas').insert(novas); if (error) throw error }
    for (const c of velhas) { const { id, ...campos } = c; const { error } = await supabase.from('contas_fixas').update(campos).eq('id', id); if (error) throw error }
    return
  }
  const atual = lsGet(LS_CONTAS, [])
  const mapa = new Map(atual.map((c) => [c.id, c]))
  for (const c of lista) { const id = c.id || novoId(); mapa.set(id, { ativa: true, ...mapa.get(id), ...c, id }) }
  lsSet(LS_CONTAS, [...mapa.values()])
}

export async function excluirConta(id) {
  if (supabase) { const { error } = await supabase.from('contas_fixas').delete().eq('id', id); if (error) throw error; return }
  lsSet(LS_CONTAS, lsGet(LS_CONTAS, []).filter((c) => c.id !== id))
}

// ---------- Configurações do financeiro ----------
const CONFIG_PADRAO = { taxa_credito: 0, taxa_debito: 0, imposto_pct: 0, onboarding_ok: false }

export async function lerConfig() {
  if (supabase) {
    const { data, error } = await supabase.from('config_financeira').select('taxa_credito, taxa_debito, imposto_pct, onboarding_ok').maybeSingle()
    if (error) throw error
    return data ? { taxa_credito: Number(data.taxa_credito), taxa_debito: Number(data.taxa_debito), imposto_pct: Number(data.imposto_pct), onboarding_ok: data.onboarding_ok } : { ...CONFIG_PADRAO }
  }
  return { ...CONFIG_PADRAO, ...lsGet(LS_CONFIG, {}) }
}

export async function salvarConfig(cfg) {
  const campos = { taxa_credito: cfg.taxa_credito, taxa_debito: cfg.taxa_debito, imposto_pct: cfg.imposto_pct, onboarding_ok: cfg.onboarding_ok }
  if (supabase) {
    const { data: u } = await supabase.auth.getUser()
    const { error } = await supabase.from('config_financeira').upsert({ user_id: u.user.id, ...campos, updated_at: new Date().toISOString() })
    if (error) throw error
    return
  }
  lsSet(LS_CONFIG, campos)
}

// ---------- Agenda ----------
const LS_SESSOES = 'roque-sessoes-v1'
const LS_AGENDA = 'roque-config-agenda-v1'
const CAMPOS_SESSAO = 'id, cliente, telefone, inicio, fim, descricao, valor, sinal, status, obs, status_em, created_at'
export const AGENDA_PADRAO = { hora_inicio: 10, hora_fim: 19, dias_trabalho: [1, 2, 3, 4, 5, 6], limpeza_min: 45, calendario_externo_url: '', ics_token: null, playlist_url: '' }

export async function listarSessoes() {
  if (supabase) {
    const desde = new Date(Date.now() - 400 * 864e5).toISOString()
    const { data, error } = await supabase.from('sessoes').select(CAMPOS_SESSAO).gte('inicio', desde).order('inicio').limit(3000)
    if (error) throw error
    return data.map((s) => ({ ...s, valor: Number(s.valor || 0), sinal: Number(s.sinal || 0) }))
  }
  return lsGet(LS_SESSOES, []).sort((a, b) => a.inicio.localeCompare(b.inicio))
}

// Cria ou atualiza; devolve o id.
export async function salvarSessao(s) {
  const campos = { cliente: s.cliente, telefone: s.telefone || null, inicio: s.inicio, fim: s.fim, descricao: s.descricao || null, valor: s.valor || 0, sinal: s.sinal || 0, status: s.status || 'agendada', obs: s.obs || null, ...(s.status_em ? { status_em: s.status_em } : {}) }
  if (supabase) {
    if (s.id) {
      const { error } = await supabase.from('sessoes').update({ ...campos, updated_at: new Date().toISOString() }).eq('id', s.id)
      if (error) throw error
      return s.id
    }
    const { data, error } = await supabase.from('sessoes').insert(campos).select('id').single()
    if (error) throw error
    return data.id
  }
  const lista = lsGet(LS_SESSOES, [])
  const id = s.id || novoId()
  const antes = lista.find((x) => x.id === id)
  lsSet(LS_SESSOES, [...lista.filter((x) => x.id !== id), { created_at: antes?.created_at || new Date().toISOString(), ...antes, ...campos, id }])
  return id
}

export async function excluirSessao(id) {
  if (supabase) { const { error } = await supabase.from('sessoes').delete().eq('id', id); if (error) throw error; return }
  lsSet(LS_SESSOES, lsGet(LS_SESSOES, []).filter((s) => s.id !== id))
}

export async function lerConfigAgenda() {
  if (supabase) {
    const { data, error } = await supabase.from('config_agenda').select('ics_token, calendario_externo_url, hora_inicio, hora_fim, dias_trabalho, limpeza_min, playlist_url').maybeSingle()
    if (error) throw error
    if (data) return { ...AGENDA_PADRAO, ...data, calendario_externo_url: data.calendario_externo_url || '' }
    // primeira vez: cria a configuração (gera o link secreto do calendário)
    const { data: u } = await supabase.auth.getUser()
    const { data: novo, error: e2 } = await supabase.from('config_agenda').insert({ user_id: u.user.id }).select('ics_token, calendario_externo_url, hora_inicio, hora_fim, dias_trabalho, limpeza_min, playlist_url').single()
    if (e2) throw e2
    return { ...AGENDA_PADRAO, ...novo, calendario_externo_url: novo.calendario_externo_url || '' }
  }
  return { ...AGENDA_PADRAO, ...lsGet(LS_AGENDA, {}) }
}

export async function salvarConfigAgenda(c) {
  const campos = { calendario_externo_url: (c.calendario_externo_url || '').trim() || null, hora_inicio: c.hora_inicio, hora_fim: c.hora_fim, dias_trabalho: c.dias_trabalho, limpeza_min: c.limpeza_min }
  if (supabase) {
    const { data: u } = await supabase.auth.getUser()
    const { error } = await supabase.from('config_agenda').upsert({ user_id: u.user.id, ...campos, updated_at: new Date().toISOString() })
    if (error) throw error
    return
  }
  lsSet(LS_AGENDA, { ...lsGet(LS_AGENDA, {}), ...campos, calendario_externo_url: campos.calendario_externo_url || '' })
}

// Compromissos do calendário do iPhone (via link público do iCloud).
export async function buscarAgendaExterna() {
  if (!supabase) return { eventos: [], configurado: false }
  const { data, error } = await supabase.functions.invoke('agenda-externa', { method: 'POST', body: {} })
  if (error) {
    let msg = 'Não consegui ler o calendário do iPhone.'
    try { const b = await error.context.json(); if (b?.erro) msg = b.erro } catch { /* sem detalhe */ }
    throw new Error(msg)
  }
  return data
}

// Link para assinar no Calendário do iPhone.
export const linkCalendario = (token) => token && URL ? URL.replace(/^https?:\/\//, 'webcal://') + '/functions/v1/agenda-ics?t=' + token : ''

// Playlist do estúdio (Spotify)
export async function salvarPlaylist(url) {
  const v = (url || '').trim() || null
  if (supabase) {
    const { data: u } = await supabase.auth.getUser()
    const { error } = await supabase.from('config_agenda').upsert({ user_id: u.user.id, playlist_url: v, updated_at: new Date().toISOString() })
    if (error) throw error
    return
  }
  lsSet(LS_AGENDA, { ...lsGet(LS_AGENDA, {}), playlist_url: v || '' })
}
