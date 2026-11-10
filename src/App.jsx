import { useCallback, useEffect, useState } from 'react'
import * as db from './data.js'
import { W, MUT } from './ui.jsx'
import Login from './screens/Login.jsx'
import Home from './screens/Home.jsx'
import { Gestao, Stub } from './screens/Gestao.jsx'
import Lancar from './screens/Lancar.jsx'
import Caixa from './screens/Caixa.jsx'
import Onde from './screens/Onde.jsx'
import Lucro from './screens/Lucro.jsx'
import Relatorio from './screens/Relatorio.jsx'
import Custos from './screens/Custos.jsx'

const TABS = [['Início', 'home', '⌂'], ['Agenda', 'agenda', '▦'], ['Pedidos', 'pedidos', '≣'], ['Clientes', 'clientes', '◉'], ['Mais', 'gestao', '⋯']]
const TAB_DE = { home: 'home', agenda: 'agenda', pedidos: 'pedidos', clientes: 'clientes' }

export default function App() {
  const hoje = new Date()
  const [sessao, setSessao] = useState(undefined)
  const [tx, setTx] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [tela, setTela] = useState('home')
  const [periodo, setPeriodo] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() })
  const [toast, setToast] = useState(null)
  const [editando, setEditando] = useState(null)

  useEffect(() => {
    db.sessaoAtual().then(setSessao)
    return db.aoMudarSessao(setSessao)
  }, [])

  const recarregar = useCallback(async () => {
    setCarregando(true)
    try { setTx(await db.listarLancamentos()) } catch (e) { setToast({ msg: 'Não consegui carregar os lançamentos: ' + e.message, erro: true }) }
    setCarregando(false)
  }, [])

  useEffect(() => { if (sessao) recarregar() }, [sessao, recarregar])
  useEffect(() => { if (toast && !toast.erro) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) } }, [toast])

  const ir = (t, extra = {}) => { setToast(extra.toast || null); if ('editando' in extra) setEditando(extra.editando); setTela(t); document.getElementById('scroller')?.scrollTo(0, 0) }

  if (sessao === undefined) return <Fundo home><div style={{ margin: 'auto', color: MUT, fontSize: 13 }}>Carregando…</div></Fundo>
  if (!sessao) return <Fundo home><Login onEntrou={setSessao} /></Fundo>

  const nome = sessao.user?.user_metadata?.nome || (sessao.user?.email || '').split('@')[0]
  const max = { ano: hoje.getFullYear(), mes: hoje.getMonth() }
  const p = { tx, ir, periodo, setPeriodo, max, toast, setToast, recarregar, carregando, nome }
  const tabAtiva = TAB_DE[tela] || 'gestao'

  let conteudo
  switch (tela) {
    case 'home': conteudo = <Home {...p} />; break
    case 'gestao': conteudo = <Gestao {...p} onSair={async () => { await db.sair(); setSessao(null); setTx([]) }} />; break
    case 'lancar': conteudo = <Lancar {...p} editando={editando} />; break
    case 'caixa': conteudo = <Caixa {...p} />; break
    case 'onde': conteudo = <Onde {...p} />; break
    case 'lucro': conteudo = <Lucro {...p} />; break
    case 'relatorio': conteudo = <Relatorio {...p} />; break
    case 'custos': conteudo = <Custos {...p} />; break
    default: conteudo = <Stub titulo={TABS.find((t) => t[1] === tela)?.[0] || 'Em breve'} />
  }

  return (
    <Fundo home={tela === 'home'}>
      <div id="scroller" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px 12px', display: 'flex', flexDirection: 'column', textShadow: '0 1px 4px rgba(0,0,0,.9)' }}>
        <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, flex: '1 0 auto' }}>
          {db.modoDemo && <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: MUT, border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '3px 9px', alignSelf: 'flex-end' }}>Modo demonstração · dados neste navegador</div>}
          {conteudo}
        </div>
      </div>
      <div style={{ flex: 'none', maxWidth: 640, width: 'calc(100% - 28px)', margin: '0 auto 14px', position: 'relative', display: 'flex', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(20,20,24,.92)', boxShadow: '0 12px 30px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.08)', borderRadius: 28, padding: '6px 4px', paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>
        {TABS.map(([label, k, ic]) => {
          const on = tabAtiva === k
          return (
            <button key={k} onClick={() => ir(k)} style={{ flex: 1, minHeight: 48, border: 0, background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, color: on ? W : '#8a8a90', position: 'relative' }}>
              <span style={{ fontSize: 17, lineHeight: 1 }}>{ic}</span><span style={{ fontSize: 10 }}>{label}</span>
              <span style={{ position: 'absolute', bottom: 1, width: 18, height: 2, borderRadius: 1, background: on ? W : 'transparent', boxShadow: on ? '0 0 8px rgba(255,255,255,.7)' : 'none' }} />
            </button>
          )
        })}
      </div>
    </Fundo>
  )
}

function Fundo({ home, children }) {
  return (
    <div style={{ height: '100dvh', background: 'radial-gradient(120% 60% at 80% 0%,#18181b 0%,#0A0A0C 55%)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <img src={import.meta.env.BASE_URL + "assets/bg-dj-tattoo.png"} alt="" style={{ position: 'absolute', top: 0, left: '50%', width: '100%', maxWidth: 900, height: 'auto', transform: `translate(-50%, ${home ? '0px' : '-215px'})`, pointerEvents: 'none', WebkitMaskImage: 'linear-gradient(180deg,#000 72%,transparent 100%)', maskImage: 'linear-gradient(180deg,#000 72%,transparent 100%)', transition: 'transform .3s' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(180deg,rgba(10,10,12,${home ? 0 : 0.5}) 0%,rgba(10,10,12,${home ? 0.2 : 0.72}) 48%,rgba(10,10,12,${home ? 0.5 : 0.88}) 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(255,255,255,.13) 1px,transparent 1.4px)', backgroundSize: '6px 6px', WebkitMaskImage: 'radial-gradient(75% 40% at 95% 0%,#000,transparent),radial-gradient(60% 30% at 0% 100%,#000,transparent)', maskImage: 'radial-gradient(75% 40% at 95% 0%,#000,transparent),radial-gradient(60% 30% at 0% 100%,#000,transparent)' }} />
      <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  )
}
