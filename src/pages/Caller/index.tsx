import { Link } from 'react-router-dom'

export default function Caller() {
  return (
    <div className="app-container flex items-center justify-center p-6">
      <div className="app-card w-full max-w-md space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Caller</h1>
          <p className="text-sm text-muted">
            Use os tokens: <span className="text-primary">primary</span>,{' '}
            <span className="text-success">success</span>,{' '}
            <span className="text-danger">danger</span>.
          </p>
        </div>

        <div className="flex gap-3">
          <Link to="/" className="app-btn app-btn-ghost">
            Voltar
          </Link>
          <button type="button" className="app-btn app-btn-primary">
            Iniciar chamada (mock)
          </button>
        </div>
      </div>
    </div>
  )
}