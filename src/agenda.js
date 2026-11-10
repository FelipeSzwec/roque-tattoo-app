// Contas da agenda: horários livres, limpeza entre sessões e bloqueios do iPhone.
export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const DIAS_LONGOS = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO']
export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const STATUS = { agendada: 'Aguardando confirmação', confirmada: '✓ Confirmado', realizada: '✓ Realizada', cancelada: 'Cancelada', faltou: 'Não compareceu' }

const p2 = (n) => String(n).padStart(2, '0')
export const hhmm = (d) => p2(d.getHours()) + ':' + p2(d.getMinutes())
export const chaveDia = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate())
export const diaZero = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const somaDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const inicioSemana = (d) => somaDias(diaZero(d), -((d.getDay() + 6) % 7))
export const mesmoDia = (a, b) => chaveDia(a) === chaveDia(b)
export const duracaoTxt = (min) => (min >= 60 ? Math.floor(min / 60) + 'h' + (min % 60 ? p2(min % 60) : '') : min + ' min')

export const ativas = (sessoes) => sessoes.filter((s) => s.status !== 'cancelada')

// Tudo o que acontece num dia, em ordem: sessões, limpeza, compromissos do iPhone e horários livres.
export function blocosDoDia(dia, sessoes, externos, ag, agora = new Date()) {
  const ini = diaZero(dia), fimDia = somaDias(ini, 1)
  const itens = [], ocupados = []
  for (const s of ativas(sessoes)) {
    const a = new Date(s.inicio), b = new Date(s.fim)
    if (b <= ini || a >= fimDia) continue
    itens.push({ tipo: 'sessao', s, ini: a, fim: b })
    const l = new Date(b.getTime() + (ag.limpeza_min || 0) * 60000)
    if (ag.limpeza_min > 0) itens.push({ tipo: 'limpeza', ini: b, fim: l })
    ocupados.push([a, l])
  }
  let diaTodo = false
  for (const e of externos || []) {
    const a = new Date(e.inicio), b = new Date(e.fim)
    if (b <= ini || a >= fimDia) continue
    if (e.dia_inteiro) diaTodo = true
    itens.push({ tipo: 'externo', ini: a < ini ? ini : a, fim: b, titulo: e.titulo, diaInteiro: e.dia_inteiro })
    ocupados.push([a, b])
  }
  const trabalha = (ag.dias_trabalho || []).includes(dia.getDay())
  if (trabalha && !diaTodo) {
    let cursor = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate(), ag.hora_inicio)
    const fecha = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate(), ag.hora_fim)
    if (agora > cursor) { const m = new Date(agora); m.setMinutes(Math.ceil(m.getMinutes() / 30) * 30, 0, 0); cursor = m }
    const ord = ocupados.slice().sort((x, y) => x[0] - y[0])
    const livre = (a, b) => { if (b - a >= 60 * 60000) itens.push({ tipo: 'livre', ini: a, fim: b }) }
    for (const [a, b] of ord) {
      if (b <= cursor) continue
      if (a > cursor) livre(cursor, a < fecha ? a : fecha)
      if (b > cursor) cursor = b
      if (cursor >= fecha) break
    }
    if (cursor < fecha) livre(cursor, fecha)
  }
  itens.sort((x, y) => x.ini - y.ini || (x.tipo === 'limpeza') - (y.tipo === 'limpeza'))
  return { itens, trabalha, diaTodo }
}

// Índices (0 = segunda) dos dias da semana que ainda cabem uma sessão (janela livre de pelo menos 3 horas).
export function livresSemana(segunda, sessoes, externos, ag, agora = new Date(), minimo = 180) {
  const out = []
  for (let i = 0; i < 7; i++) {
    const { itens } = blocosDoDia(somaDias(segunda, i), sessoes, externos, ag, agora)
    if (itens.some((b) => b.tipo === 'livre' && b.fim - b.ini >= minimo * 60000)) out.push(i)
  }
  return out
}

export const proximaSessao = (sessoes, agora = new Date()) => ativas(sessoes).filter((s) => s.status !== 'realizada' && s.status !== 'faltou' && new Date(s.fim) > agora).sort((a, b) => a.inicio.localeCompare(b.inicio))[0] || null

export function conflitos(inicio, fim, sessoes, externos, ignorarId) {
  const a = new Date(inicio), b = new Date(fim)
  const sob = (x, y) => new Date(x) < b && new Date(y) > a
  return [
    ...ativas(sessoes).filter((s) => s.id !== ignorarId && sob(s.inicio, s.fim)).map((s) => s.cliente + ' ' + hhmm(new Date(s.inicio))),
    ...(externos || []).filter((e) => sob(e.inicio, e.fim)).map((e) => 'iPhone: ' + e.titulo),
  ]
}

export const dataCurta = (d) => DIAS_CURTOS[d.getDay()].toLowerCase() + ' ' + d.getDate() + '/' + p2(d.getMonth() + 1)
export const linkWhats = (tel) => { const n = String(tel || '').replace(/\D/g, ''); return n.length >= 10 ? 'https://wa.me/' + (n.length <= 11 ? '55' + n : n) : '' }
