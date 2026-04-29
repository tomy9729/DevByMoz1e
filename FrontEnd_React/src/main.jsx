import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/**
 * 역할: 애플리케이션 루트 컴포넌트를 DOM에 마운트한다.
 * 파라미터 설명: 없음
 * 반환값 설명: 없음
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
