// Trilha do estúdio: mini player do Spotify dentro do app + botão para abrir no Spotify.
import { useState } from 'react'
import * as db from '../data.js'
import { Screen, Title, Back, Toast, Note, card, input, btnPrimary, btnGhost, MUT } from '../ui.jsx'

// Playlist de exemplo até o estúdio colar a sua.
export const PLAYLIST_EXEMPLO = 'https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U'

// Aceita link do Spotify (open.spotify.com/... ou spotify:playlist:...) e devolve tipo e id.
export function lerSpotify(url) {
  const s = String(url || '').trim()
  const m = s.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|artist|track|show)\/([A-Za-z0-9]+)/) || s.match(/^spotify:(playlist|album|artist|track|show):([A-Za-z0-9]+)$/)
  return m ? { tipo: m[1], id: m[2] } : null
}

export default function Musica({ ag, recarregar, ir }) {
  const salvo = ag.playlist_url || ''
  const [url, setUrl] = useState(salvo)
  const [editar, setEditar] = useState(!salvo)
  const [toast, setToast] = useState(null)
  const atual = lerSpotify(salvo) || lerSpotify(PLAYLIST_EXEMPLO)
  const valido = !url.trim() || lerSpotify(url)
  const abrir = `https://open.spotify.com/${atual.tipo}/${atual.id}`

  const salvar = async () => {
    if (!valido) return
    try { await db.salvarPlaylist(url); await recarregar(); setEditar(false); setToast({ msg: url.trim() ? 'Playlist do estúdio salva.' : 'Voltou para a playlist de exemplo.' }) } catch (e) { setToast({ msg: e.message, erro: true }) }
  }

  return (
    <Screen>
      <Back onClick={() => ir('home')} label="Início" />
      <Title a="Trilha do" b="estúdio" />
      <Toast {...(toast || {})} />
      {!salvo && <Note>Tocando uma playlist de exemplo. Cole a playlist do estúdio abaixo.</Note>}
      <div style={{ ...card, padding: 8, overflow: 'hidden' }}>
        <iframe key={atual.id} title="Spotify" src={`https://open.spotify.com/embed/${atual.tipo}/${atual.id}?utm_source=generator&theme=0`} width="100%" height="380" frameBorder="0" loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" style={{ borderRadius: 12, display: 'block', background: '#121212' }} />
      </div>
      <a href={abrir} target="_blank" rel="noreferrer" style={{ ...btnPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box', textShadow: 'none' }}>Abrir no Spotify</a>
      <Note>No mini player, quem não está logado no Spotify pelo navegador ouve só trechos. Para a música inteira, toque em “Abrir no Spotify”, ou entre na sua conta pelo próprio player.</Note>
      {editar ? (<>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://open.spotify.com/playlist/…" style={{ ...input, fontSize: 13 }} />
        {!valido && <Note><span style={{ color: '#F29B4B' }}>Esse link não é do Spotify. No Spotify: playlist › ⋯ › Compartilhar › Copiar link.</span></Note>}
        <Note>No Spotify, abra a playlist, toque em ⋯ › Compartilhar › Copiar link e cole aqui.</Note>
        <button onClick={salvar} style={btnGhost}>Salvar playlist</button>
      </>) : <button onClick={() => setEditar(true)} style={{ minHeight: 44, border: 0, background: 'none', color: MUT, fontSize: 13, cursor: 'pointer' }}>Trocar a playlist do estúdio</button>}
    </Screen>
  )
}
