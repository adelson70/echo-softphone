import { useState, useEffect } from 'react'

type AddContactModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, number: string) => Promise<void>
  initialName?: string
  initialNumber?: string
}

export function AddContactModal({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialNumber = '',
}: AddContactModalProps) {
  const [name, setName] = useState(initialName)
  const [number, setNumber] = useState(initialNumber)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setNumber(initialNumber)
    }
  }, [isOpen, initialName, initialNumber])

  async function handleSave() {
    if (!name.trim() || !number.trim()) {
      return
    }

    setIsSaving(true)
    try {
      await onSave(name.trim(), number.trim())
      onClose()
      setName('')
      setNumber('')
    } catch (error) {
      console.error('Erro ao salvar contato:', error)
    } finally {
      setIsSaving(false)
    }
  }

  function handleClose() {
    if (!isSaving) {
      onClose()
      setName('')
      setNumber('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-background p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-text">Adicionar Contato</h3>

        <div className="mb-4 space-y-3">
          <div>
            <label htmlFor="contact-name" className="mb-1 block text-xs font-medium text-muted">
              Nome
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim() && number.trim()) {
                  void handleSave()
                } else if (e.key === 'Escape') {
                  handleClose()
                }
              }}
              placeholder="Nome do contato"
              autoFocus
              disabled={isSaving}
              className="h-12 w-full rounded-xl border border-white/10 bg-background px-4 text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="contact-number" className="mb-1 block text-xs font-medium text-muted">
              Número
            </label>
            <input
              id="contact-number"
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim() && number.trim()) {
                  void handleSave()
                } else if (e.key === 'Escape') {
                  handleClose()
                }
              }}
              placeholder="Número do contato"
              disabled={isSaving}
              className="h-12 w-full rounded-xl border border-white/10 bg-background px-4 text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!name.trim() || !number.trim() || isSaving}
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

