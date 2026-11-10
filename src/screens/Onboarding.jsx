// Primeiro acesso guiado: uma pergunta por tela, tudo opcional.
import { useState } from 'react'
import * as db from '../data.js'
import { parseValor, brl } from '../finance.js'
import { Screen, Title, Note, Toast, card, input, btnPrimary, btnGhost, W, GR, MUT } from '../ui.jsx'

const CONTAS = [
  ['Energia', 'Energia', 12],
  ['Água', 'Água', 12],
  ['Internet', 'Internet', 15],
  ['Telefone', 'Telefone', 15],
  ['Contador', 'Contador', 10],
  ['Condomínio', 'Condomínio', 10],
  ['Apps e assinaturas', 'Apps e assinaturas', 8],
]

export default function Onboarding({ cfg, contasAtuais, onFim, onPular }) {
  const temConta = (cat) => contasAtuais.find((c) => c.categoria === cat)
  const [passo, setPasso] = useState(0)
  const [aluguel, setAluguel] = useState(temConta('Aluguel') ? String(temConta('Aluguel').valor) : '')
  const [diaAluguel, setDiaAluguel] = useState(temConta('Aluguel')?.dia || 5)
  const [contas, setContas] = useState(() => Object.fromEntries(CONTAS.map(([c]) => [c, temConta(c) ? String(temConta(c).valor) : ''])))
  const [maquina, setMaquina] = useState(cfg.taxa_credito || cfg.taxa_debito ? 'sim' : '')
  const [credito, setCredito] = useState(cfg.taxa_credito ? String(cfg.taxa_credito) : '')
  const [debito, setDebito] = useState(cfg.taxa_debito ? String(cfg.taxa_debito) : '')
  const [imposto, setImposto] = useState(cfg.imposto_pct ? 'simples' : temConta('Impostos (DAS)') ? 'mei' : '')
  const [pct, setPct] = useState(cfg.imposto_pct ? String(cfg.imposto_pct) : '6')
  const [mei, setMei] = useState(temConta('Impostos (DAS)') ? String(temConta('Impostos (DAS)').valor) : '81')
  const [prolabore, setProlabore] = useState(temConta('Retirada pessoal') ? String(temConta('Retirada pessoal').valor) : '')
  const [erro, setErro] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const fixosMes = parseValor(aluguel) + Object.values(contas).reduce((a, v) => a + parseValor(v), 0) + (imposto === 'mei' ? parseValor(mei) : 0)
  const TOTAL = 6

  const concluir = async () => {
    setOcupado(true); setErro(null)
    try {
      const lista = []
      const upsert = (nome, categoria, grupo, valor, dia) => {
        const ex = temConta(categoria)
        if (valor > 0) lista.push({ ...(ex ? { id: ex.id } : {}), nome, categoria, grupo, valor, dia, ativa: true })
        else if (ex) lista.push({ id: ex.id, ativa: false })
      }
      upsert('Aluguel do espaço', 'Aluguel', 'fixo', parseValor(aluguel), Number(diaAluguel) || 5)
      for (const [c, cat, dia] of CONTAS) upsert(c, cat, 'fixo', parseValor(contas[c]), temConta(cat)?.dia || dia)
      upsert('DAS do MEI', 'Impostos (DAS)', 'imposto', imposto === 'mei' ? parseValor(mei) : 0, 20)
      upsert('Pró-labore', 'Retirada pessoal', 'pessoal', parseValor(prolabore), 5)
      await db.salvarContas(lista)
      await db.salvarConfig({ taxa_credito: maquina === 'sim' ? parseValor(credito) : 0, taxa_debito: maquina === 'sim' ? parseValor(debito) : 0, imposto_pct: imposto === 'simples' ? parseValor(pct) : 0, onboarding_ok: true })
      await onFim()
    } catch (e) { setErro(e.message) }
    setOcupado(false)
  }

  const Prog = () => (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: TOTAL }, (_, i) => <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < passo ? W : 'rgba(255,255,255,.15)' }} />)}
    </div>
  )
  const Valor = ({ v, set, ph = '0,00', auto }) => (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: MUT }}>R$</span>
      <input inputMode="decimal" value={v} onChange={(e) => set(e.target.value)} placeholder={ph} autoFocus={auto} style={{ ...input, paddingLeft: 44, fontSize: 20 }} />
    </div>
  )
  const Nav = ({ podeAvancar = true, label = 'Continuar' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
      <button onClick={() => podeAvancar && setPasso(passo + 1)} style={btnPrimary}>{label}</button>
      <button onClick={() => setPasso(passo - 1)} style={{ minHeight: 40, border: 0, background: 'none', color: MUT, fontSize: 13, cursor: 'pointer' }}>‹ Voltar</button>
    </div>
  )
  const Opcao = ({ on, onClick, t, s }) => (
    <button onClick={onClick} style={{ ...card, textAlign: 'left', padding: '14px 16px', cursor: 'pointer', borderColor: on ? W : 'rgba(255,255,255,.16)', background: on ? 'rgba(255,255,255,.1)' : card.background }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{t}</div>{s && <div style={{ fontSize: 12, color: MUT, marginTop: 2 }}>{s}</div>}
    </button>
  )
  const label = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: MUT }

  return (
    <Screen style={{ flex: 1 }}>
      {passo > 0 && passo <= TOTAL && <Prog />}
      {passo === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
          <Title a="Vamos montar seu" b="financeiro" />
          <div style={{ fontSize: 15, lineHeight: 1.6, color: '#e6e6ea' }}>São 6 perguntas rápidas sobre os seus gastos de todo mês. Leva uns 2 minutos e você pode mudar tudo depois.</div>
          <Note>Não sabe um valor agora? Deixe em branco e siga.</Note>
          <button onClick={() => setPasso(1)} style={btnPrimary}>Começar</button>
          <button onClick={onPular} style={btnGhost}>Fazer depois</button>
        </div>
      )}
      {passo === 1 && (<>
        <Title a="Quanto é o" b="aluguel?" />
        <Note>Do espaço do estúdio. Se não paga aluguel, deixe em branco.</Note>
        {Valor({ v: aluguel, set: setAluguel, auto: true })}
        <label style={label}>Vence todo dia
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{[1, 5, 10, 15, 20, 25].map((d) => <button key={d} onClick={() => setDiaAluguel(d)} style={{ minWidth: 48, minHeight: 44, borderRadius: 22, border: `1px solid ${diaAluguel === d ? W : 'rgba(255,255,255,.2)'}`, background: diaAluguel === d ? W : 'transparent', color: diaAluguel === d ? '#0A0A0C' : W, cursor: 'pointer' }}>{d}</button>)}</div>
        </label>
        <Nav />
      </>)}
      {passo === 2 && (<>
        <Title a="Contas de" b="todo mês" />
        <Note>Coloque o valor médio. As que você não tem, deixe em branco.</Note>
        <div style={{ ...card, padding: '4px 14px' }}>
          {CONTAS.map(([c], i) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i === CONTAS.length - 1 ? 0 : '1px solid rgba(255,255,255,.07)' }}>
              <span style={{ flex: 1, fontSize: 14 }}>{c}</span>
              <div style={{ position: 'relative', width: 130 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: MUT, fontSize: 13 }}>R$</span>
                <input inputMode="decimal" value={contas[c]} onChange={(e) => setContas({ ...contas, [c]: e.target.value })} placeholder="—" style={{ ...input, minHeight: 42, paddingLeft: 36, fontSize: 15 }} />
              </div>
            </div>
          ))}
        </div>
        <Nav />
      </>)}
      {passo === 3 && (<>
        <Title a="Você usa" b="maquininha?" />
        <Note>Com a taxa informada, o app desconta sozinho a cada pagamento no cartão.</Note>
        <Opcao on={maquina === 'sim'} onClick={() => setMaquina('sim')} t="Sim, uso maquininha" />
        <Opcao on={maquina === 'nao'} onClick={() => setMaquina('nao')} t="Não, só Pix e dinheiro" />
        {maquina === 'sim' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ ...label, flex: 1 }}>Taxa no crédito (%)<input inputMode="decimal" value={credito} onChange={(e) => setCredito(e.target.value)} placeholder="ex.: 3,5" style={input} /></label>
            <label style={{ ...label, flex: 1 }}>Taxa no débito (%)<input inputMode="decimal" value={debito} onChange={(e) => setDebito(e.target.value)} placeholder="ex.: 1,5" style={input} /></label>
          </div>
        )}
        <Nav podeAvancar={!!maquina} />
      </>)}
      {passo === 4 && (<>
        <Title a="E os" b="impostos?" />
        <Opcao on={imposto === 'mei'} onClick={() => setImposto('mei')} t="Sou MEI" s="Valor fixo por mês (DAS do MEI)" />
        {imposto === 'mei' && Valor({ v: mei, set: setMei })}
        <Opcao on={imposto === 'simples'} onClick={() => setImposto('simples')} t="Simples Nacional" s="Uma porcentagem do que fatura" />
        {imposto === 'simples' && <label style={label}>Porcentagem (%)<input inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} style={input} /></label>}
        <Opcao on={imposto === 'nenhum'} onClick={() => setImposto('nenhum')} t="Ainda não pago imposto" />
        <Nav podeAvancar={!!imposto} />
      </>)}
      {passo === 5 && (<>
        <Title a="Quanto você tira" b="para você?" />
        <Note>O valor que sai do estúdio todo mês para as suas contas pessoais (pró-labore). Fica separado do lucro, para você ver se o estúdio se paga sozinho.</Note>
        {Valor({ v: prolabore, set: setProlabore, auto: true })}
        <Nav />
      </>)}
      {passo === 6 && (<>
        <Title a="Tudo" b="pronto" />
        <Toast msg={erro} erro />
        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, letterSpacing: '.1em', color: MUT }}>SEUS CUSTOS FIXOS POR MÊS</div>
          <div style={{ fontSize: 30, fontWeight: 500 }}>{brl(fixosMes)}</div>
          <div style={{ fontSize: 13, color: '#e6e6ea', lineHeight: 1.5 }}>
            {fixosMes > 0 ? <>Esse é o mínimo que o estúdio precisa faturar só para pagar as contas{parseValor(prolabore) > 0 ? <>. Somando o que você tira, a meta do mês é <b style={{ color: GR }}>{brl(fixosMes + parseValor(prolabore))}</b></> : null}.</> : 'Nenhuma conta fixa informada. Você pode adicionar depois em Contas do mês.'}
          </div>
        </div>
        <Note>Todo mês essas contas aparecem em <b>Contas do mês</b>. Quando pagar, é só tocar em "Paguei".</Note>
        <button onClick={concluir} disabled={ocupado} style={btnPrimary}>{ocupado ? 'Salvando…' : 'Concluir'}</button>
        <button onClick={() => setPasso(5)} style={{ minHeight: 40, border: 0, background: 'none', color: MUT, fontSize: 13, cursor: 'pointer' }}>‹ Voltar</button>
      </>)}
    </Screen>
  )
}
