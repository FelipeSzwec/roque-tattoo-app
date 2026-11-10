// Trilha do estúdio: mini player do Spotify dentro do app + botão para abrir no Spotify.
import { useState } from 'react'
import * as db from '../data.js'
import { Screen, Title, Back, Toast, Note, card, input, btnPrimary, btnGhost, MUT } from '../ui.jsx'

// Playlist padrão do estúdio (enviada pelo Felipe). Dá para trocar colando outro link.
export const PLAYLIST_EXEMPLO = 'https://open.spotify.com/playlist/7zZreN0DpXioxvCbNu4Yjz'

// Aceita link do Spotify (open.spotify.com/... ou spotify:playlist:...) e devolve tipo e id.
export function lerSpotify(url) {
  const s = String(url || '').trim()
  const m = s.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|artist|track|show)\/([A-Za-z0-9]+)/) || s.match(/^spotify:(playlist|album|artist|track|show):([A-Za-z0-9]+)$/)
  return m ? { tipo: m[1], id: m[2] } : null
}

// Abre direto no app do Spotify (toca a música inteira com Premium). Se o app não abrir, cai no site.
export function abrirNoSpotify(url) {
  const a = lerSpotify(url) || lerSpotify(PLAYLIST_EXEMPLO)
  const web = `https://open.spotify.com/${a.tipo}/${a.id}`
  let saiu = false
  const marcar = () => { if (document.visibilityState === 'hidden') saiu = true }
  document.addEventListener('visibilitychange', marcar)
  window.location.href = `spotify:${a.tipo}:${a.id}`
  setTimeout(() => { document.removeEventListener('visibilitychange', marcar); if (!saiu) window.open(web, '_blank') }, 1500)
}

export default function Musica({ ag, recarregar, ir }) {
  const salvo = ag.playlist_url || ''
  const [url, setUrl] = useState(salvo)
  const [editar, setEditar] = useState(true)
  const [toast, setToast] = useState(null)
  const valido = !url.trim() || lerSpotify(url)

  const salvar = async () => {
    if (!valido) return
    try { await db.salvarPlaylist(url); await recarregar(); setEditar(false); setToast({ msg: url.trim() ? 'Playlist do estúdio salva.' : 'Voltou para a playlist padrão do estúdio.' }) } catch (e) { setToast({ msg: e.message, erro: true }) }
  }

  return (
    <Screen>
      <Back onClick={() => ir('gestao')} label="Financeiro" />
      <Title a="Playlist do" b="estúdio" />
      <Toast {...(toast || {})} />
      
      <div style={{ ...card, padding: '16px 14px', fontSize: 13, color: MUT, lineHeight: 1.5 }}>A bolinha do Spotify no Início abre esta playlist direto no app do Spotify, com as músicas inteiras.</div>
      <button onClick={() => abrirNoSpotify(salvo)} style={btnPrimary}>Abrir no Spotify</button>
      {editar ? (<>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://open.spotify.com/playlist/…" style={{ ...input, fontSize: 13 }} />
        {!valido && <Note><span style={{ color: '#F29B4B' }}>Esse link não é do Spotify. No Spotify: playlist › ⋯ › Compartilhar › Copiar link.</span></Note>}
        <Note>No Spotify, abra a playlist, toque em ⋯ › Compartilhar › Copiar link e cole aqui.</Note>
        <button onClick={salvar} style={btnGhost}>Salvar playlist</button>
      </>) : <button onClick={() => setEditar(true)} style={{ minHeight: 44, border: 0, background: 'none', color: MUT, fontSize: 13, cursor: 'pointer' }}>Trocar a playlist do estúdio</button>}
    </Screen>
  )
}
