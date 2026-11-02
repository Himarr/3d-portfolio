import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Fonts from Fontsource, SIL OFL 1.1, self-hosted.
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/hanken-grotesk/latin-400.css'
import '@fontsource/hanken-grotesk/latin-500.css'
import './index.css'
import App from './App.jsx'
import { SmoothScrollProvider } from './components/SmoothScrollProvider.jsx'
import { initLayoutVars } from './lib/layoutVars.js'

initLayoutVars()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SmoothScrollProvider>
        <App />
      </SmoothScrollProvider>
    </BrowserRouter>
  </StrictMode>,
)
