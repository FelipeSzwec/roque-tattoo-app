// Tela Início: mesmo layout do protótipo (Tattoo Studio App.dc.html, layout "grade").
// Faturamento e sessões vêm dos lançamentos; próxima sessão, vagas e comparecimento vêm da agenda.
// Pix e pedidos ganham dados reais nas próximas partes.
import { resumoMes, brl, variacao, MESES } from '../finance.js'
import { card, W, GR, OR, MUT } from '../ui.jsx'
import { abrirNoSpotify } from './Musica.jsx'
import { livresSemana, inicioSemana, proximaSessao, dataCurta, hhmm } from '../agenda.js'

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// A luz passa de um dia livre para o outro, como o reflexo de um globo de pista (tons neutros).
const PASSO = 0.55
const TONS = ['#ffffff', '#d6dde4', '#e9e3d8', '#b8c4d0']
const luzes = (n) => `@keyframes vez${n} { 0% { background: ${TONS[0]}; box-shadow: 0 0 10px rgba(255,255,255,.9) } ${(100 / n).toFixed(2)}% { background: ${TONS[1]}; box-shadow: 0 0 6px rgba(214,221,228,.6) } ${Math.min(99, (100 / n) * 1.6).toFixed(2)}%, 100% { background: rgba(255,255,255,.3); box-shadow: none } }`

export default function Home({ tx, ir, max, nome, setPeriodo, sessoes = [], externos = [], ag }) {
  const { ano, mes } = max
  const r = resumoMes(tx, ano, mes)
  const ant = mes === 0 ? resumoMes(tx, ano - 1, 11) : resumoMes(tx, ano, mes - 1)
  const vf = variacao(r.receita, ant.receita)
  const hora = new Date().getHours()
  const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const primeiro = nome ? nome.split(' ')[0] : ''
  const ultimos = Array.from({ length: 12 }, (_, i) => { const d = new Date(ano, mes - 11 + i, 1); return resumoMes(tx, d.getFullYear(), d.getMonth()).receita })
  const maxU = Math.max(1, ...ultimos)
  const hojeIdx = (new Date().getDay() + 6) % 7
  // Vagas: dias desta semana (de hoje em diante) que ainda cabem uma sessão de 3 horas.
  const agora = new Date()
  const livres = ag ? livresSemana(inicioSemana(agora), sessoes, externos, ag, agora) : []
  const prox = proximaSessao(sessoes, agora)
  const passadas = sessoes.filter((s) => { const d = new Date(s.inicio); return d.getFullYear() === ano && d.getMonth() === mes && new Date(s.fim) < agora && s.status !== 'cancelada' })
  const comp = passadas.length ? Math.round((passadas.filter((s) => s.status === 'realizada').length / passadas.length) * 100) + '%' : '—'
  const abrirFat = () => { setPeriodo({ ano, mes }); ir('relatorio') }

  const lbl = { fontSize: 11, letterSpacing: '.1em', color: MUT }
  const big = { fontSize: 28, fontWeight: 500, marginTop: 2 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0, animation: 'fi .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: '#e6e6ea' }}>{saud}{primeiro ? ', ' + primeiro.charAt(0).toUpperCase() + primeiro.slice(1) : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => abrirNoSpotify(ag?.playlist_url)} aria-label="Abrir a playlist do estúdio no Spotify" style={{ width: 44, height: 44, borderRadius: 22, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(10,10,12,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#e6e6ea" /><path d="M6.5 9.3c3.7-1.1 8-.8 11.2 1M7.2 12.4c3-.9 6.5-.6 9.2.9M7.8 15.3c2.4-.6 5-.4 7.1.8" stroke="#0A0A0C" strokeWidth="1.7" strokeLinecap="round" fill="none" /></svg>
          </button>
          <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 22, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(10,10,12,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            <span style={{ filter: 'grayscale(1) brightness(1.8)' }}>🔔</span>
          </div>
          <img src={import.meta.env.BASE_URL + 'assets/roque.jpeg'} alt="" style={{ width: 44, height: 44, borderRadius: 22, border: '1px solid rgba(255,255,255,.5)', objectFit: 'cover', objectPosition: '50% 22%' }} />
        </div>
      </div>
      <div style={{ flex: '1 1 0', maxHeight: 80, minHeight: 6 }} />

      <button onClick={() => ir('agenda', { editando: prox ? { diaAgenda: prox.inicio, agendaKey: prox.id } : null })} style={{ ...card, display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', width: '100%', padding: '8px 12px', minHeight: 56, cursor: 'pointer' }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, flex: 'none', background: 'repeating-linear-gradient(45deg,#232326,#232326 6px,#1a1a1d 6px,#1a1a1d 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '8px monospace', color: '#6b6b70' }}>ref.</div>
        <div style={{ flex: 1 }}>
          <div style={lbl}>PRÓXIMA SESSÃO</div>
          {prox
            ? <div style={{ fontSize: 14, fontWeight: 600 }}>{prox.cliente} <span style={{ fontSize: 12, fontWeight: 400, color: MUT }}>· {dataCurta(new Date(prox.inicio))} · {hhmm(new Date(prox.inicio))}{prox.descricao ? ' · ' + prox.descricao : ''}</span></div>
            : <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhuma sessão agendada <span style={{ fontSize: 12, fontWeight: 400, color: MUT }}>· toque para marcar</span></div>}
        </div>
        <span style={{ color: MUT }}>›</span>
      </button>
      <div style={{ flex: '1 1 0', maxHeight: 70, minHeight: 6 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <button onClick={() => ir('pedidos')} style={{ ...card, textAlign: 'left', padding: '18px 16px', cursor: 'pointer', minHeight: 44 }}>
          <div style={lbl}>PIX PARA APROVAR</div>
          <div style={big}>0</div>
          <div style={{ fontSize: 13, color: MUT }}>nenhum pendente</div>
        </button>

        <div onClick={() => ir('agenda')} style={{ ...card, cursor: 'pointer', padding: '18px 16px' }}>
          <div style={lbl}>VAGAS NA SEMANA</div>
          <div style={big}>{livres.length} <span style={{ fontSize: 13, color: MUT, fontWeight: 400 }}>livres</span></div>
          {livres.length > 0 && <style>{luzes(livres.length)}</style>}
          <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
            {DIAS.map((d, i) => (
              <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span style={{ width: '100%', height: 9, borderRadius: 4, background: livres.includes(i) ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.12)', animation: livres.includes(i) ? `vez${livres.length} ${(livres.length * PASSO).toFixed(2)}s linear ${(livres.indexOf(i) * PASSO).toFixed(2)}s infinite` : 'none' }} />
                <span style={{ fontSize: 10, color: livres.includes(i) ? W : '#8a8a90', fontWeight: livres.includes(i) ? 700 : 400 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        <div onClick={abrirFat} style={{ ...card, cursor: 'pointer', padding: '18px 16px' }}>
          <div style={lbl}>FATURAMENTO</div>
          <div style={big}>{brl(r.receita)}</div>
          <div style={{ fontSize: 11, color: vf ? (vf.p >= 0 ? GR : OR) : MUT }}>{vf ? vf.txt + ' no mês' : MESES[mes].toLowerCase() + ' de ' + ano}</div>
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 30, marginTop: 8 }}>
            {ultimos.map((v, i) => <span key={i} style={{ flex: 1, height: Math.max(4, (v / maxU) * 24), borderRadius: 2, background: W, opacity: i === 11 ? 1 : 0.45, transformOrigin: 'bottom', animation: `eq ${(0.8 + ((i * 29) % 8) / 10).toFixed(2)}s ease-in-out ${(i / 10).toFixed(2)}s infinite` }} />)}
          </div>
        </div>

        <div style={{ ...card, padding: '18px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
          {[['Sessões', String(r.sessoes)], ['Comparecimento', comp], ['Pedidos novos', '0']].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13, color: MUT }}><span>{l}</span><b style={{ fontSize: 17, color: W, fontWeight: 500 }}>{v}</b></div>
          ))}
        </div>
      </div>

    </div>
  )
}
