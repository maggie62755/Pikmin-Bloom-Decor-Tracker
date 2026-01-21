import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log("Google Client ID Loaded:", clientId ? "Yes (" + clientId.substring(0, 10) + "...)" : "No");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
        <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
