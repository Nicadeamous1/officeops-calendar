import React, { Component } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

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
