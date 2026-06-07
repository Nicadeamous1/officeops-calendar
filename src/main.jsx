import React, { Component } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

window.addEventListener('error', (event) => showBootError(event.error || event.message))
window.addEventListener('unhandledrejection', (event) => showBootError(event.reason))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

function showBootError(error) {
  window.setTimeout(() => {
    const root = document.getElementById('root')
    if (!root || root.children.length > 0) return
    const message = error?.message || String(error || 'Unknown startup error')
    root.innerHTML = `<main class="landing-page"><section class="landing-card"><p class="eyebrow">OfficeOps could not load</p><h1>Startup error</h1><p>${escapeHtml(message)}</p><button class="button primary" onclick="location.href='/officeops-calendar/'">Return Home</button></section></main>`
  }, 0)
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character])
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="landing-page">
          <section className="landing-card">
            <p className="eyebrow">OfficeOps could not load</p>
            <h1>Something went wrong</h1>
            <p>{this.state.error.message}</p>
            <button className="button primary" onClick={() => window.location.assign(import.meta.env.BASE_URL)}>
              Return Home
            </button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}
