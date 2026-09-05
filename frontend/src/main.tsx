import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { PreferencesProvider } from './contexts/PreferencesContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PreferencesProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </PreferencesProvider>
    </ThemeProvider>
  </StrictMode>,
)
