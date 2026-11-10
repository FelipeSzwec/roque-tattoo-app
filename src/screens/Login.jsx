import { useState } from 'react'
import * as db from '../data.js'
import { input, btnPrimary, btnDisabled, btnGhost, MUT, Toast } from '../ui.jsx'

export default function Login({ onEntrou }) {
  const [modo, setModo] = useState('entrar') // entrar | criar
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [msg, setMsg] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const ok = email.trim() && senha.trim() && (modo === 'entrar' || nome.trim())

  const enviar = async (e) => {
    e.preventDefault()
    if (!ok || ocupado) return
    setOcupado(true); setMsg(null)
    try {
      if (modo === 'entrar') onEntrou(await db.entrar(email.trim(), senha))
      else {
        const s = await db.criarConta(email.trim(), senha, nome.trim())
        if (s) onEntrou(s)
        else setMsg({ msg: 'Conta criada. Enviamos um link de confirmação para ' + email.trim() + '. Depois de confirmar, é só entrar.' })
      }
    } catch (err) { setMsg({ msg: err.message, erro: true }) }
    setOcupado(false)
  }

  const esqueci = async () => {
    if (!email.trim()) return setMsg({ msg: 'Digite seu e-mail acima para receber o link.', erro: true })
    try { await db.esqueciSenha(email.trim()); setMsg({ msg: 'Enviamos um link para redefinir a senha em ' + email.trim() + '.' }) } catch (err) { setMsg({ msg: err.message, erro: true }) }
  }

  const label = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: MUT }
  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, justifyContent: 'center', animation: 'fi .2s ease', maxWidth: 380, width: '100%', margin: '0 auto', padding: '24px 18px', boxSizing: 'border-box', textShadow: '0 1px 4px rgba(0,0,0,.9)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingBottom: 10 }}>
        <img src="/assets/logo-roque.jpeg" alt="" style={{ width: 92, height: 92, objectFit: 'cover', filter: 'brightness(.75) contrast(1.8)', mixBlendMode: 'screen', borderRadius: '50%', transform: 'scale(1.3)' }} />
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, textAlign: 'center', lineHeight: 1.1 }}>Roque <span style={{ color: '#fff', fontFamily: "'UnifrakturCook',serif", fontWeight: 700 }}>Tattoo Ink</span></div>
        <div style={{ fontSize: 11, letterSpacing: '.14em', color: MUT }}>{modo === 'entrar' ? 'ACESSO DO TATUADOR' : 'CRIAR SUA CONTA'}</div>
      </div>
      <Toast {...(msg || {})} />
      {modo === 'criar' && <label style={label}>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como quer ser chamado" style={input} autoComplete="name" /></label>}
      <label style={label}>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" style={input} autoComplete="email" /></label>
      <label style={label}>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder={modo === 'criar' ? 'Mínimo de 6 caracteres' : 'Sua senha'} style={input} autoComplete={modo === 'criar' ? 'new-password' : 'current-password'} /></label>
      {modo === 'entrar' && <button type="button" onClick={esqueci} style={{ alignSelf: 'flex-end', minHeight: 36, border: 0, background: 'none', color: MUT, fontSize: 12, cursor: 'pointer', padding: 0 }}>Esqueci minha senha</button>}
      <button type="submit" style={ok && !ocupado ? btnPrimary : btnDisabled}>{ocupado ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
      <button type="button" onClick={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setMsg(null) }} style={btnGhost}>{modo === 'entrar' ? 'Criar conta' : 'Já tenho conta'}</button>
      <div style={{ fontSize: 12, color: MUT, textAlign: 'center', lineHeight: 1.5, paddingTop: 6 }}>
        {db.modoDemo ? <>Modo demonstração: qualquer e-mail e senha entram.<br /></> : null}
        Os clientes não precisam de conta, só do link.
      </div>
    </form>
  )
}
