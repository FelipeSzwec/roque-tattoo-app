// Lê o calendário público do iPhone (link do iCloud) e devolve os compromissos
// dos próximos 60 dias, para o app bloquear esses horários na agenda.
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
const HOSTS = /(^|\.)(icloud\.com|google\.com|outlook\.com|live\.com|office365\.com)$/i
const TZ_PADRAO = 'America/Sao_Paulo'

// ---- fuso horário: hora local de uma cidade -> instante UTC ----
function offsetMs(t: number, tz: string) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const p = Object.fromEntries(f.formatToParts(new Date(t)).map((x) => [x.type, x.value]))
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t
}
function localParaUtc(y: number, mo: number, d: number, h: number, mi: number, s: number, tz: string) {
  const base = Date.UTC(y, mo, d, h, mi, s)
  try { let t = base - offsetMs(base, tz); t = base - offsetMs(t, tz); return t } catch { return localParaUtc(y, mo, d, h, mi, s, TZ_PADRAO) }
}

type Data = { y: number; mo: number; d: number; h: number; mi: number; s: number; utc: boolean; diaInteiro: boolean; tz: string }
function lerData(valor: string, params: Record<string, string>, tzCal: string): Data | null {
  const m = valor.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/)
  if (!m) return null
  return { y: +m[1], mo: +m[2] - 1, d: +m[3], h: +(m[4] || 0), mi: +(m[5] || 0), s: +(m[6] || 0), utc: !!m[7], diaInteiro: params.VALUE === 'DATE' || !m[4], tz: params.TZID || tzCal }
}
const instante = (x: Data, tzDia: string) => x.utc ? Date.UTC(x.y, x.mo, x.d, x.h, x.mi, x.s) : localParaUtc(x.y, x.mo, x.d, x.h, x.mi, x.s, x.diaInteiro ? tzDia : x.tz)

type Ev = { uid: string; ini: Data; fim: Data | null; dur: number | null; titulo: string; rrule: Record<string, string> | null; exdates: number[]; recId: number | null; cancelado: boolean }

function lerIcs(txt: string, tzDia: string) {
  const linhas = txt.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/)
  const tzCal = (linhas.find((l) => l.startsWith('X-WR-TIMEZONE:')) || '').slice(14).trim() || TZ_PADRAO
  const evs: Ev[] = []
  let ev: Ev | null = null, profundidade = 0
  for (const l of linhas) {
    if (l === 'BEGIN:VEVENT') { ev = { uid: '', ini: null as unknown as Data, fim: null, dur: null, titulo: '', rrule: null, exdates: [], recId: null, cancelado: false }; profundidade = 0; continue }
    if (!ev) continue
    if (l.startsWith('BEGIN:')) { profundidade++; continue }
    if (l.startsWith('END:') && l !== 'END:VEVENT') { profundidade--; continue }
    if (l === 'END:VEVENT') { if (ev.ini) evs.push(ev); ev = null; continue }
    if (profundidade > 0) continue
    const i = l.indexOf(':'); if (i < 0) continue
    const [nome, ...ps] = l.slice(0, i).split(';')
    const params = Object.fromEntries(ps.map((p) => { const [k, v] = p.split('='); return [k.toUpperCase(), (v || '').replace(/"/g, '')] }))
    const v = l.slice(i + 1)
    if (nome === 'UID') ev.uid = v
    else if (nome === 'SUMMARY') ev.titulo = v.replace(/\\n/g, ' ').replace(/\\(.)/g, '$1')
    else if (nome === 'DTSTART') ev.ini = lerData(v, params, tzCal)!
    else if (nome === 'DTEND') ev.fim = lerData(v, params, tzCal)
    else if (nome === 'DURATION') { const m = v.match(/P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/); if (m) ev.dur = ((+(m[1] || 0) * 7 + +(m[2] || 0)) * 86400 + +(m[3] || 0) * 3600 + +(m[4] || 0) * 60 + +(m[5] || 0)) * 1000 }
    else if (nome === 'RRULE') ev.rrule = Object.fromEntries(v.split(';').map((p) => p.split('=')))
    else if (nome === 'EXDATE') for (const x of v.split(',')) { const d = lerData(x, params, tzCal); if (d) ev.exdates.push(instante(d, tzDia)) }
    else if (nome === 'RECURRENCE-ID') { const d = lerData(v, params, tzCal); if (d) ev.recId = instante(d, tzDia) }
    else if (nome === 'STATUS' && v === 'CANCELLED') ev.cancelado = true
  }
  return evs
}

const DIAS_RR = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function expandir(ev: Ev, de: number, ate: number, tzDia: string, substituidos: Set<string>) {
  const a = ev.ini
  const t0 = instante(a, tzDia)
  const durMs = ev.fim ? instante(ev.fim, tzDia) - t0 : ev.dur ?? (a.diaInteiro ? 864e5 : 36e5)
  const saida: { inicio: number; fim: number }[] = []
  const add = (t: number) => { if (t + durMs > de && t < ate && !ev.exdates.includes(t) && !substituidos.has(ev.uid + '|' + t)) saida.push({ inicio: t, fim: t + durMs }) }
  const r = ev.rrule
  if (!r) { add(t0); return saida }
  const freq = r.FREQ, intervalo = +(r.INTERVAL || 1)
  const limite = r.UNTIL ? instante(lerData(r.UNTIL, {}, a.tz)!, tzDia) : Infinity
  let restante = r.COUNT ? +r.COUNT : Infinity
  const byday = r.BYDAY ? r.BYDAY.split(',').map((x) => DIAS_RR.indexOf(x.slice(-2))) : null
  const diaMs = 864e5
  const base = Date.UTC(a.y, a.mo, a.d)
  for (let k = 0; k < 3000 && restante > 0; k++) {
    const dia = new Date(base + k * diaMs)
    const y = dia.getUTCFullYear(), mo = dia.getUTCMonth(), d = dia.getUTCDate(), dow = dia.getUTCDay()
    let ok = false
    if (freq === 'DAILY') ok = k % intervalo === 0
    else if (freq === 'WEEKLY') {
      const semana = Math.floor((k + ((new Date(base).getUTCDay() + 6) % 7)) / 7)
      ok = semana % intervalo === 0 && (byday ? byday.includes(dow) : dow === new Date(base).getUTCDay())
    } else if (freq === 'MONTHLY') ok = d === a.d && ((y - a.y) * 12 + mo - a.mo) % intervalo === 0
    else if (freq === 'YEARLY') ok = d === a.d && mo === a.mo && (y - a.y) % intervalo === 0
    else break
    if (!ok) continue
    const t = a.diaInteiro ? localParaUtc(y, mo, d, 0, 0, 0, tzDia) : a.utc ? Date.UTC(y, mo, d, a.h, a.mi, a.s) : localParaUtc(y, mo, d, a.h, a.mi, a.s, a.tz)
    if (t > limite || t >= ate) break
    restante--
    add(t)
  }
  return saida
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const auth = req.headers.get('Authorization') || ''
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: cfg, error } = await db.from('config_agenda').select('calendario_externo_url').maybeSingle()
  if (error) return json({ erro: 'Não consegui ler sua configuração.' }, 401)
  const bruto = (cfg?.calendario_externo_url || '').trim()
  if (!bruto) return json({ eventos: [], configurado: false })
  let url: URL
  try { url = new URL(bruto.replace(/^webcals?:\/\//i, 'https://')) } catch { return json({ erro: 'O link do calendário não parece válido.' }, 400) }
  if (url.protocol !== 'https:' || !HOSTS.test(url.hostname)) return json({ erro: 'Use o link público do calendário do iCloud (começa com webcal://p…icloud.com).' }, 400)
  let txt = ''
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'agenda-app/1.0' }, redirect: 'follow', signal: AbortSignal.timeout(12000) })
    if (!r.ok) return json({ erro: 'O iCloud não liberou o calendário (' + r.status + '). Confira se ele está como Calendário Público.' }, 502)
    txt = await r.text()
  } catch { return json({ erro: 'Não consegui acessar o calendário agora. Tente de novo em instantes.' }, 502) }
  if (!txt.includes('BEGIN:VCALENDAR')) return json({ erro: 'O link não devolveu um calendário.' }, 502)
  const de = Date.now() - 864e5, ate = Date.now() + 62 * 864e5
  const evs = lerIcs(txt, TZ_PADRAO)
  const substituidos = new Set(evs.filter((e) => e.recId != null).map((e) => e.uid + '|' + e.recId))
  const eventos: { inicio: string; fim: string; titulo: string; dia_inteiro: boolean }[] = []
  for (const e of evs) {
    if (e.cancelado) continue
    for (const o of expandir(e, de, ate, TZ_PADRAO, e.recId != null ? new Set() : substituidos)) eventos.push({ inicio: new Date(o.inicio).toISOString(), fim: new Date(o.fim).toISOString(), titulo: e.titulo || 'Ocupado', dia_inteiro: e.ini.diaInteiro })
  }
  eventos.sort((a, b) => a.inicio.localeCompare(b.inicio))
  return json({ eventos: eventos.slice(0, 1500), configurado: true })
})
