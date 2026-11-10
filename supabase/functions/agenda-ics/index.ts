// Calendário (.ics) das sessões do app, para assinar no Calendário do iPhone.
// Endereço: webcal://<projeto>.supabase.co/functions/v1/agenda-ics?t=<token secreto>
// Não pede login: o token secreto (config_agenda.ics_token) identifica a pessoa.
import { createClient } from 'npm:@supabase/supabase-js@2'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
const dobra = (linha: string) => {
  const out: string[] = []
  let l = linha
  while (l.length > 73) { out.push(l.slice(0, 73)); l = ' ' + l.slice(73) }
  out.push(l)
  return out.join('\r\n')
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  const t = new URL(req.url).searchParams.get('t') || ''
  if (!UUID.test(t)) return new Response('Link inválido', { status: 404 })
  const { data: cfg } = await db.from('config_agenda').select('user_id').eq('ics_token', t).maybeSingle()
  if (!cfg) return new Response('Link inválido', { status: 404 })
  const desde = new Date(Date.now() - 90 * 864e5).toISOString()
  const { data: sessoes, error } = await db.from('sessoes')
    .select('id, cliente, telefone, inicio, fim, descricao, valor, sinal, status, updated_at')
    .eq('user_id', cfg.user_id).neq('status', 'cancelada').gte('inicio', desde).order('inicio').limit(2000)
  if (error) return new Response('Erro', { status: 500 })
  const agora = utc(new Date().toISOString())
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Roque Tattoo//Agenda//PT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Tattoo · Sessões', 'X-WR-TIMEZONE:America/Sao_Paulo', 'REFRESH-INTERVAL;VALUE=DURATION:PT15M', 'X-PUBLISHED-TTL:PT15M']
  for (const s of sessoes ?? []) {
    const nota = [s.descricao, s.telefone && 'Tel: ' + s.telefone, Number(s.valor) > 0 && 'Valor: R$ ' + Number(s.valor).toFixed(2).replace('.', ','),
      Number(s.sinal) > 0 && 'Sinal: R$ ' + Number(s.sinal).toFixed(2).replace('.', ','), s.status === 'realizada' && 'Sessão realizada'].filter(Boolean).join('\n')
    linhas.push('BEGIN:VEVENT', `UID:${s.id}@roque-tattoo`, `DTSTAMP:${agora}`, `LAST-MODIFIED:${utc(s.updated_at)}`,
      `DTSTART:${utc(s.inicio)}`, `DTEND:${utc(s.fim)}`, dobra(`SUMMARY:${esc('Tattoo · ' + s.cliente)}`),
      ...(nota ? [dobra(`DESCRIPTION:${esc(nota)}`)] : []), `STATUS:${s.status === 'agendada' ? 'TENTATIVE' : 'CONFIRMED'}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Sessão de tattoo', 'TRIGGER:-PT2H', 'END:VALARM', 'END:VEVENT')
  }
  linhas.push('END:VCALENDAR')
  return new Response(linhas.join('\r\n') + '\r\n', { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-cache' } })
})
