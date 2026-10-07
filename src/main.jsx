import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { I18nProvider } from './i18n'

import { googleClientId } from './config/googleAuth';

const app = (
  <I18nProvider>
    <App />
  </I18nProvider>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
    ) : app}
  </StrictMode>,
)
