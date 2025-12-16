import { HashRouter, Routes, Route } from 'react-router-dom'
import Caller from '../pages/Caller'
import Login from '../pages/Login'
import Historico from '../pages/Historico'
import Contatos from '../pages/Contatos'

export default function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/caller" element={<Caller />} />
        <Route path="/historico" element={<Historico />} />
        <Route path="/contatos" element={<Contatos />} />
      </Routes>
    </HashRouter>
  )
}
