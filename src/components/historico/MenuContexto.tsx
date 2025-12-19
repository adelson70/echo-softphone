import { useEffect, useRef, useState } from 'react'

type PropsMenuContexto = {
  x: number
  y: number
  onClose: () => void
  onAddContact: () => void
}

export function ContextMenu({ x, y, onClose, onAddContact }: PropsMenuContexto) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x, y })

  useEffect(() => {
    // Ajusta a posição para não sair da tela
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      // Ajusta horizontalmente
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10
      }
      if (adjustedX < 10) {
        adjustedX = 10
      }

      // Ajusta verticalmente
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10
      }
      if (adjustedY < 10) {
        adjustedY = 10
      }

      setPosition({ x: adjustedX, y: adjustedY })
    }
  }, [x, y])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    // Pequeno delay para não fechar imediatamente ao abrir
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    document.addEventListener('keydown', handleEscape)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] rounded-xl border border-white/10 bg-background shadow-xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <button
        type="button"
        onClick={() => {
          onAddContact()
          onClose()
        }}
        className="w-full rounded-xl px-4 py-2.5 text-left text-xs text-text transition-colors hover:bg-white/10"
      >
        Adicionar contato
      </button>
    </div>
  )
}

