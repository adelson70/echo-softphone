import { User } from 'lucide-react'

type AvatarProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  src?: string
  name?: string
  showRipple?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-12 w-12',
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
  xl: 'h-32 w-32',
}

export function Avatar({ size = 'md', src, name, showRipple = false, className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size]
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Ripple animation circles */}
      {showRipple && (
        <>
          <div className="absolute h-full w-full animate-ping rounded-full border-2 border-success opacity-20" />
          <div className="absolute h-[120%] w-[120%] animate-ping rounded-full border-2 border-success opacity-15 animation-delay-150" />
          <div className="absolute h-[140%] w-[140%] animate-ping rounded-full border-2 border-success opacity-10 animation-delay-300" />
        </>
      )}

      {/* Avatar circle */}
      <div
        className={`relative flex ${sizeClass} items-center justify-center overflow-hidden rounded-full bg-white/10`}
      >
        {src ? (
          <img src={src} alt={name || 'Avatar'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {initials ? (
              <span className="text-lg font-semibold text-text">{initials}</span>
            ) : (
              <User className="h-1/2 w-1/2 text-muted" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

