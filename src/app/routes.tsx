import { useEffect, useRef } from 'react'
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Discador from '../pages/Discador'
import Entrar from '../pages/Entrar'
import Historico from '../pages/Historico'
import Contatos from '../pages/Contatos'
import { RequireRegistered } from '../sip/react/RequireRegistered'
import { IncomingCallOverlay } from '../components/chamadas/OverlayChamadaEntrante'
import { useSip } from '../sip/react/useSip'

// Componente para navegar automaticamente para /discador quando uma chamada é iniciada
function CallNavigationHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const sip = useSip()
  const lastNavigatedRef = useRef<string>('')

  useEffect(() => {
    // Se há chamada ativa e não está na página de login, navegar para /discador
    const hasActiveCall = sip.snapshot.callStatus === 'dialing' || 
                         sip.snapshot.callStatus === 'ringing' || 
                         sip.snapshot.callStatus === 'established'
    
    const currentPath = location.pathname
    const shouldNavigate = hasActiveCall && currentPath !== '/discador' && currentPath !== '/'
    const navigationKey = `${hasActiveCall}-${currentPath}`
    
    console.log('[CallNavigationHandler] Verificando navegação:', {
      hasActiveCall,
      currentPath,
      shouldNavigate,
      navigationKey,
      lastNavigationKey: lastNavigatedRef.current,
      callStatus: sip.snapshot.callStatus,
      callDirection: sip.snapshot.callDirection,
      remoteUri: sip.snapshot.remoteUri || 'vazio',
      timestamp: new Date().toISOString()
    })
    
    // Só navegar se realmente mudou (evitar loops)
    if (shouldNavigate && lastNavigatedRef.current !== navigationKey) {
      console.log('[CallNavigationHandler] Navegando para /discador')
      lastNavigatedRef.current = navigationKey
      navigate('/discador', { replace: true })
    }
  }, [sip.snapshot.callStatus, location.pathname, navigate, sip.snapshot.callDirection, sip.snapshot.remoteUri])

  return null
}

export default function AppRoutes() {
  return (
    <HashRouter>
      <CallNavigationHandler />
      <Routes>
        <Route path="/" element={<Entrar />} />
        <Route
          path="/discador"
          element={
            <RequireRegistered>
              <Discador />
            </RequireRegistered>
          }
        />
        <Route
          path="/historico"
          element={
            <RequireRegistered>
              <Historico />
            </RequireRegistered>
          }
        />
        <Route
          path="/contatos"
          element={
            <RequireRegistered>
              <Contatos />
            </RequireRegistered>
          }
        />
      </Routes>
      <IncomingCallOverlay />
    </HashRouter>
  )
}
