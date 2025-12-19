import { HashRouter, Routes, Route } from 'react-router-dom'
import Discador from '../pages/Discador'
import Entrar from '../pages/Entrar'
import Historico from '../pages/Historico'
import Contatos from '../pages/Contatos'
import { RequireRegistered } from '../sip/react/RequireRegistered'
import { IncomingCallOverlay } from '../components/chamadas/OverlayChamadaEntrante'

export default function AppRoutes() {
  return (
    <HashRouter>
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
