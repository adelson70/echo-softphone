import { useLocation, useNavigate } from 'react-router-dom'
import { useSip } from '../../sip/react/useSip'
import { IncomingState } from './EstadoEntrante'

export function IncomingCallOverlay() {
  const location = useLocation()
  const navigate = useNavigate()
  const sip = useSip()
  
  const isIncoming = sip.snapshot.callStatus === 'incoming'
  const isLoginPage = location.pathname === '/'
  
  // Não mostra o overlay na página de login
  if (!isIncoming || isLoginPage) {
    return null
  }

  async function handleReject() {
    try {
      await sip.reject()
    } catch (error) {
      console.error('Erro ao rejeitar chamada:', error)
    }
  }

  async function handleAnswer() {
    try {
      await sip.answer()
      // Navega para a tela de discagem após aceitar a chamada (exceto se estiver na página de login)
      if (!isLoginPage) {
        navigate('/discador')
      }
    } catch (error) {
      console.error('Erro ao atender chamada:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <IncomingState
        incomingCall={sip.snapshot.incoming ?? null}
        onAnswer={handleAnswer}
        onReject={handleReject}
      />
    </div>
  )
}

