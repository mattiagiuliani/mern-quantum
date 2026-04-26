import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/globals.css'
import App from './App.jsx'
import { initFrontendSentry } from './config/sentry'
import { startPerfMonitoring } from './config/perf'

initFrontendSentry()
startPerfMonitoring()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
