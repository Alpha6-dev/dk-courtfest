import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import { BrandProvider } from './lib/brand'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <BrandProvider>
        <App />
        <Toaster theme="dark" position="top-center" richColors />
      </BrandProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
