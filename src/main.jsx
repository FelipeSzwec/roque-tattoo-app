import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Atualização automática: quando sai uma versão nova, o app recarrega sozinho
// (importante no iPhone, onde o app salvo na tela de início guarda a versão antiga).
if (import.meta.env.PROD) {
  const atual = [...document.scripts].map((s) => s.src).find((s) => /\/assets\/index-.*\.js/.test(s)) || ''
  const verificar = async () => {
    try {
      const html = await (await fetch(import.meta.env.BASE_URL + '?v=' + Date.now(), { cache: 'no-store' })).text()
      const nova = (html.match(/assets\/index-[^"']+\.js/) || [])[0]
      // recarrega uma vez só por versão, para nunca entrar em ciclo se o celular insistir na versão guardada
      if (nova && atual && !atual.endsWith(nova) && sessionStorage.getItem('roque-recarregou') !== nova) { sessionStorage.setItem('roque-recarregou', nova); location.reload() }
    } catch { /* sem internet */ }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verificar() })
  setInterval(verificar, 5 * 60000)
  verificar()
}
