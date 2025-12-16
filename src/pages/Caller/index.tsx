import { Link } from 'react-router-dom'
import './style.css'

export default function Caller() {
  return (
    <div>
      <h1>Caller</h1>
      <Link to="/">Voltar para o início</Link>
    </div>
  )
}