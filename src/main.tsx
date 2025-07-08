import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initialize error logger in development
if (import.meta.env.DEV) {
  import('./utils/errorLogger').then(({ default: errorLogger }) => {
    console.log('[Main] Error logger initialized');
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)