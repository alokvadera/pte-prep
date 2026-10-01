import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')
const root: HTMLElement = rootElement

const tree = (
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// Prerendered routes ship real HTML so that crawlers, and anyone with JavaScript
// disabled, still get the full page. The marker tells the client to hydrate that
// markup rather than throwing it away and rendering from scratch.
if (root.dataset.hydrate === 'true') {
  hydrateRoot(root, tree)
} else {
  createRoot(root).render(tree)
}
