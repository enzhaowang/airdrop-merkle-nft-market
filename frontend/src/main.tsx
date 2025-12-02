import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { WagmiProviderWrapper } from './WagmiProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProviderWrapper>
      <App />
    </WagmiProviderWrapper>
  </StrictMode>,
)
