// Acesso aos dados. Com as variáveis do Supabase configuradas, usa o banco real.
// Sem elas, roda em "modo demonstração", guardando tudo no navegador.
import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = URL && KEY ? createClient(URL, KEY) : null
export const modoDemo = !supabase

const CAMPOS = 'id, data, tipo, valor, categoria, grupo, forma_pagamento, descricao, exemplo, created_at'
const LS_TX = 'roque-lancamentos-v1'
const LS_SESSAO = 'roque-sessao-v1'

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
    const { data, error } = await supabase.auth.signUp({ email, password: senha, options: { data: { nome } } })
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
