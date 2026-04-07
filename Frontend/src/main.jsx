const originalFetch = window.fetch;

window.fetch = (url, options) => {
  if (url.startsWith("/")) {
    url = "https://gen-ai-job-preparation-web-application.onrender.com" + url;
  }
  return originalFetch(url, options);
};
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './style.scss'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
