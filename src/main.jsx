import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { I18nProvider } from './i18n'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log("Google Client ID Loaded:", clientId ? "Yes (" + clientId.substring(0, 10) + "...)" : "No");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
