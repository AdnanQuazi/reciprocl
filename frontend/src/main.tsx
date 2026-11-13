import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ThemeProvider from './providers/ThemeProvider'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Frontend root element is missing')

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
