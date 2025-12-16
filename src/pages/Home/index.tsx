import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="app-container flex items-center justify-center p-6">
      <div className="app-card w-full max-w-md space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Softphone</h1>
          <p className="text-sm text-muted">
            Base Tailwind ativa com paleta do projeto (background/card/primary/etc.).
          </p>
        </div>

        <div className="flex gap-3">
          <Link to="/caller" className="app-btn app-btn-primary">
            Chamar
          </Link>
          <a
            className="app-btn app-btn-ghost"
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            Em breve
          </a>
        </div>
      </div>
    </div>
  )
}