import { resumoMes, brl, variacao, MESES } from '../finance.js'
import { card, W, GR, OR, MUT } from '../ui.jsx'

export default function Home({ tx, ir, max, nome, setPeriodo }) {
  const { ano, mes } = max
  const r = resumoMes(tx, ano, mes)
  const ant = mes === 0 ? resumoMes(tx, ano - 1, 11) : resumoMes(tx, ano, mes - 1)
  const vf = variacao(r.receita, ant.receita)
  const hora = new Date().getHours()
  const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const ultimos = Array.from({ length: 12 }, (_, i) => { const m = (mes - 11 + i + 12) % 12, a = mes - 11 + i < 0 ? ano - 1 : ano; return resumoMes(tx, a, m).receita })
  const maxU = Math.max(1, ...ultimos)
  const abrirMes = (t) => { setPeriodo({ ano, mes }); ir(t) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, animation: 'fi .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: '#e6e6ea' }}>{saud}{nome ? ', ' + nome.charAt(0).toUpperCase() + nome.slice(1) : ''}</div>
        <img src={import.meta.env.BASE_URL + "assets/roque.jpeg"} alt="" style={{ width: 44, height: 44, borderRadius: 22, border: '1px solid rgba(255,255,255,.5)', objectFit: 'cover', objectPosition: '50% 22%' }} />
      </div>
      <div style={{ height: 60, flex: 'none' }} />
      <button onClick={() => ir('lancar', { editando: null })} style={{ ...card, display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', width: '100%', padding: '8px 12px', minHeight: 56, cursor: 'pointer' }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, flex: 'none', border: '1px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>+</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 11, letterSpacing: '.1em', color: MUT }}>LANÇAR</div><div style={{ fontSize: 14, fontWeight: 600 }}>Entrada ou saída de dinheiro</div></div>
        <span style={{ color: MUT }}>›</span>
      </button>
      <div style={{ height: 40, flex: 'none' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div onClick={() => abrirMes('relatorio')} style={{ ...card, padding: '18px 16px', cursor: 'pointer' }}>
          <div style={{ fontSize: 11, letterSpacing: '.1em', color: MUT }}>FATURAMENTO</div>
          <div style={{ fontSize: 26, fontWeight: 500, marginTop: 2 }}>{brl(r.receita)}</div>
          <div style={{ fontSize: 11, color: vf ? (vf.p >= 0 ? GR : OR) : MUT }}>{vf ? vf.txt + ' vs ' + MESES[mes === 0 ? 11 : mes - 1].toLowerCase() : 'neste mês'}</div>
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 30, marginTop: 8 }}>
            {ultimos.map((v, i) => <span key={i} style={{ flex: 1, height: Math.max(3, (v / maxU) * 24), borderRadius: 2, background: W, opacity: i === 11 ? 1 : 0.45, transformOrigin: 'bottom', animation: `eq ${0.8 + ((i * 7) % 8) / 10}s ease-in-out ${i / 10}s infinite` }} />)}
          </div>
        </div>
        <div onClick={() => abrirMes('lucro')} style={{ ...card, padding: '18px 16px', cursor: 'pointer' }}>
          <div style={{ fontSize: 11, letterSpacing: '.1em', color: MUT }}>LUCRO DO MÊS</div>
          <div style={{ fontSize: 26, fontWeight: 500, marginTop: 2, color: r.lucro < 0 ? OR : W }}>{brl(r.lucro)}</div>
          <div style={{ fontSize: 11, color: r.lucro >= 0 ? GR : OR }}>{r.receita ? 'margem ' + Math.round(r.margem * 100) + '%' : 'sem receitas ainda'}</div>
          <div style={{ fontSize: 11, color: MUT, marginTop: 8 }}>Custos {brl(r.custos)}</div>
        </div>
        <div onClick={() => abrirMes('caixa')} style={{ ...card, padding: '18px 16px', cursor: 'pointer' }}>
          <div style={{ fontSize: 11, letterSpacing: '.1em', color: MUT }}>SALDO DO MÊS</div>
          <div style={{ fontSize: 26, fontWeight: 500, marginTop: 2, color: r.saldo < 0 ? OR : W }}>{brl(r.saldo)}</div>
          <div style={{ fontSize: 11, color: MUT }}>entrou {brl(r.entradas)}<br />saiu {brl(r.saidas)}</div>
        </div>
        <div onClick={() => abrirMes('onde')} style={{ ...card, padding: '18px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
          {[['Atendimentos', String(r.sessoes)], ['Ticket médio', brl(r.ticket)], ['Pessoal', brl(r.pessoal)]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13, color: MUT }}><span>{l}</span><b style={{ fontSize: 16, color: W, fontWeight: 500 }}>{v}</b></div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 8 }} />
      <div style={{ textAlign: 'center', fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 14, color: '#e6e6ea' }}>Arte no traço, negócio no controle.</div>
    </div>
  )
}
