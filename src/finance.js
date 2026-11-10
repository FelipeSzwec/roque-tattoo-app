// Regras do financeiro: categorias, agrupamentos e cálculos.

export const CATEGORIAS = {
  entrada: [
    ['Sessão', 'receita'],
    ['Sinal', 'receita'],
    ['Retoque', 'receita'],
    ['Venda de produto', 'receita'],
    ['Outra entrada', 'receita'],
  ],
  saida: [
    ['Aluguel', 'fixo'],
    ['Condomínio', 'fixo'],
    ['Energia', 'fixo'],
    ['Água', 'fixo'],
    ['Internet', 'fixo'],
    ['Telefone', 'fixo'],
    ['Contador', 'fixo'],
    ['Apps e assinaturas', 'fixo'],
    ['Materiais e tintas', 'variavel'],
    ['Descartáveis', 'variavel'],
    ['Divulgação', 'variavel'],
    ['Taxa de cartão', 'variavel'],
    ['Manutenção', 'variavel'],
    ['Impostos (DAS)', 'imposto'],
    ['Retirada pessoal', 'pessoal'],
    ['Gasto pessoal', 'pessoal'],
  ],
}

export const GRUPO_LABEL = {
  receita: 'Receita',
  fixo: 'Custo fixo',
  variavel: 'Custo variável',
  imposto: 'Imposto',
  pessoal: 'Pessoal',
}

export const FORMAS = [['pix', 'Pix'], ['dinheiro', 'Dinheiro'], ['credito', 'Crédito'], ['debito', 'Débito']]
export const FORMA_LABEL = { ...Object.fromEntries(FORMAS), cartao: 'Cartão' }

export function grupoDe(tipo, categoria) {
  const found = (CATEGORIAS[tipo] || []).find(([c]) => c === categoria)
  if (found) return found[1]
  return tipo === 'entrada' ? 'receita' : 'variavel'
}

export const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
export const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export const brl = (v) => { const n = Math.round(v || 0); return (n < 0 ? '− ' : '') + 'R$ ' + Math.abs(n).toLocaleString('pt-BR') }
export const brl2 = (v) => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function variacao(atual, anterior) {
  if (!anterior) return null
  const p = Math.round((atual / anterior - 1) * 100)
  return { p, txt: (p >= 0 ? '▲ ' : '▼ ') + Math.abs(p) + '%' }
}

// "1.234,56" ou "1234.5" -> 1234.56
export function parseValor(txt) {
  if (typeof txt === 'number') return txt
  let t = String(txt || '').replace(/[^\d.,]/g, '')
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(t)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

export const isoHoje = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
export const dataBR = (iso) => (iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '')

const noMes = (tx, ano, mes) => tx.filter((t) => Number(t.data.slice(0, 4)) === ano && Number(t.data.slice(5, 7)) - 1 === mes)

export function resumoDe(lista) {
  const r = { receita: 0, fixo: 0, variavel: 0, imposto: 0, pessoal: 0, sessoes: 0, entradas: 0, saidas: 0 }
  for (const t of lista) {
    const v = Number(t.valor) || 0
    if (t.tipo === 'entrada') {
      r.entradas += v
      r.receita += v
      if (t.categoria === 'Sessão' || t.categoria === 'Retoque') r.sessoes += 1
    } else {
      r.saidas += v
      r[t.grupo in r ? t.grupo : 'variavel'] += v
    }
  }
  r.custos = r.fixo + r.variavel + r.imposto // custos do negócio
  r.lucro = r.receita - r.custos // lucro do negócio
  r.saldo = r.entradas - r.saidas // o que sobrou no caixa
  r.ticket = r.sessoes ? r.receita / r.sessoes : 0
  r.margem = r.receita ? r.lucro / r.receita : 0
  return r
}

export const resumoMes = (tx, ano, mes) => resumoDe(noMes(tx, ano, mes))
export const lancMes = (tx, ano, mes) => noMes(tx, ano, mes).sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
export const resumoAno = (tx, ano, ateMes = 11) => resumoDe(tx.filter((t) => Number(t.data.slice(0, 4)) === ano && Number(t.data.slice(5, 7)) - 1 <= ateMes))

export function porCategoria(lista, filtro) {
  const m = new Map()
  for (const t of lista) {
    if (!filtro(t)) continue
    m.set(t.categoria, (m.get(t.categoria) || 0) + Number(t.valor))
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

// Faturamento mínimo para pagar os custos (ponto de equilíbrio).
export function pontoEquilibrio(r) {
  const margemContrib = r.receita ? 1 - (r.variavel + r.imposto) / r.receita : 0
  if (margemContrib <= 0) return null
  const fat = r.fixo / margemContrib
  return { faturamento: fat, sessoes: r.ticket ? Math.ceil(fat / r.ticket) : null }
}

// Dados de exemplo para demonstrar o app (marcados com exemplo = true).
export function gerarExemplos(hoje = new Date()) {
  const ano = hoje.getFullYear(), mesAtual = hoje.getMonth(), diaHoje = hoje.getDate()
  const nomes = ['Bruno Teixeira', 'Camila Rocha', 'Rafael Nunes', 'Júlia Campos', 'Diego Martins', 'Larissa Gomes', 'Thiago Lima', 'Ana Beatriz', 'Sofia Ramos', 'Lucas Prado', 'Fernanda Souza', 'Gustavo Reis', 'Patrícia Lopes', 'Henrique Alves', 'Bianca Freitas', 'Marina Duarte']
  const estilos = ['fine line', 'realismo', 'blackwork', 'old school', 'lettering', 'floral', 'minimalista']
  const fatores = [0.7, 1.3, 0.9, 1.1, 1.0, 0.8, 1.2]
  const out = []
  let k = 0
  const add = (mes, dia, tipo, valor, categoria, forma, descricao) => {
    const maxDia = mes === mesAtual ? Math.max(1, diaHoje) : 28
    const d = Math.min(dia, maxDia)
    out.push({ data: ano + '-' + String(mes + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'), tipo, valor, categoria, grupo: grupoDe(tipo, categoria), forma_pagamento: forma, descricao, exemplo: true })
  }
  for (let m = 0; m <= mesAtual; m++) {
    const fat = 6200 + m * 330 + ((m * 37) % 5) * 150
    const n = 13 + Math.floor(m / 2)
    let resto = fat
    for (let j = 0; j < n; j++) {
      const v = j === n - 1 ? Math.max(150, resto) : Math.round((fat / n) * fatores[(j + m) % 7] / 10) * 10
      resto -= v
      const dia = 1 + Math.floor((j * 27) / n)
      add(m, dia, 'entrada', v, 'Sessão', ['pix', 'pix', 'cartao', 'dinheiro'][j % 4], nomes[k++ % nomes.length] + ' · ' + estilos[(j + m) % estilos.length])
    }
    add(m, 5, 'saida', 1200, 'Aluguel', 'pix', 'Aluguel da sala')
    add(m, 12, 'saida', 170 + (m % 3) * 15, 'Energia', 'pix', 'Conta de luz')
    add(m, 10, 'saida', 250, 'Contador', 'pix', 'Mensalidade do contador')
    add(m, 15, 'saida', 110, 'Internet', 'cartao', 'Internet fibra')
    add(m, 8, 'saida', 60, 'Apps e assinaturas', 'cartao', 'Agenda, nuvem e WhatsApp Business')
    add(m, 9, 'saida', 380 + (m % 4) * 20, 'Materiais e tintas', 'cartao', 'Agulhas, tintas e biqueiras')
    add(m, 18, 'saida', 90 + (m % 2) * 25, 'Descartáveis', 'pix', 'Luvas, filme e papel')
    add(m, 20, 'saida', 150, 'Divulgação', 'cartao', 'Instagram patrocinado')
    add(m, 20, 'saida', Math.round(fat * 0.06), 'Impostos (DAS)', 'pix', 'DAS do Simples')
    add(m, 6, 'saida', m < 3 ? 4000 : 4500, 'Retirada pessoal', 'pix', 'Pró-labore do Roque')
    if (m % 3 === 2) add(m, 22, 'saida', 380 + m * 25, 'Gasto pessoal', 'cartao', 'Mercado pago com o cartão do estúdio')
  }
  return out
}

// Contas do mês: cada conta fixa ativa aparece como "a pagar" até virar lançamento.
// O DAS (quando há % de imposto) é calculado sobre o faturamento do mês anterior.
export function contasDoMes(contas, cfg, tx, ano, mes) {
  const doMes = noMes(tx, ano, mes)
  const lista = contas.filter((c) => c.ativa !== false).map((c) => {
    const pago = doMes.find((t) => t.conta_id === c.id)
    return { ...c, pago, valorPrevisto: c.valor }
  })
  if (cfg && cfg.imposto_pct > 0) {
    const d = new Date(ano, mes - 1, 1)
    const fatAnt = resumoMes(tx, d.getFullYear(), d.getMonth()).receita
    const pago = doMes.find((t) => t.categoria === 'Impostos (DAS)')
    lista.push({ id: 'das', nome: 'Impostos (DAS)', categoria: 'Impostos (DAS)', grupo: 'imposto', dia: 20, valor: Math.round(fatAnt * cfg.imposto_pct) / 100, virtual: true, pago, nota: cfg.imposto_pct + '% de ' + brl(fatAnt) + ' faturados em ' + MESES_LONGOS[d.getMonth()] })
  }
  return lista.sort((a, b) => (!!a.pago - !!b.pago) || a.dia - b.dia)
}

export function taxaCartao(cfg, forma, valor) {
  if (!cfg) return 0
  const pct = forma === 'credito' ? cfg.taxa_credito : forma === 'debito' ? cfg.taxa_debito : 0
  return pct > 0 ? Math.round(valor * pct) / 100 : 0
}
