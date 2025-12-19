/**
 * Serviço singleton para gerenciar reprodução de sons de feedback de chamada.
 * Previne sobreposição de sons e gerencia o ciclo de vida dos elementos de áudio.
 */
class AudioFeedbackService {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private currentSound: HTMLAudioElement | null = null
  private currentSoundName: string | null = null

  private getSoundPath(soundName: string): string {
    return `/${soundName}.mp3`
  }

  /**
   * Carrega um som se ainda não foi carregado.
   */
  private loadSound(soundName: string): HTMLAudioElement {
    if (this.sounds.has(soundName)) {
      return this.sounds.get(soundName)!
    }

    const audio = new Audio(this.getSoundPath(soundName))
    audio.preload = 'auto'
    audio.loop = soundName === 'outgoing' || soundName === 'ingoing' // Sons de chamada tocam em loop
    
    // Tratamento de erros silencioso
    audio.addEventListener('error', () => {
      console.warn(`Erro ao carregar som: ${soundName}`)
    })

    this.sounds.set(soundName, audio)
    return audio
  }

  /**
   * Para o som atual, se houver.
   */
  private stopCurrent(): void {
    if (this.currentSound) {
      try {
        this.currentSound.pause()
        this.currentSound.currentTime = 0
      } catch (e) {
        // Ignora erros ao parar áudio
      }
      this.currentSound = null
      this.currentSoundName = null
    }
  }

  /**
   * Toca um som específico. Para o som atual antes de iniciar um novo.
   */
  play(soundName: 'outgoing' | 'ingoing' | 'busy' | 'cancel-call'): void {
    // Se já está tocando o mesmo som, não faz nada
    if (this.currentSoundName === soundName && this.currentSound) {
      if (!this.currentSound.paused) {
        return
      }
    }

    // Para o som atual
    this.stopCurrent()

    // Carrega e toca o novo som
    const audio = this.loadSound(soundName)
    this.currentSound = audio
    this.currentSoundName = soundName

    // Sons de busy e cancel-call tocam uma vez, não em loop
    if (soundName === 'busy' || soundName === 'cancel-call') {
      audio.loop = false
    }

    audio.play().catch((error) => {
      console.warn(`Erro ao tocar som ${soundName}:`, error)
      this.currentSound = null
      this.currentSoundName = null
    })
  }

  /**
   * Para o som atual.
   */
  stop(): void {
    this.stopCurrent()
  }

  /**
   * Para todos os sons e limpa referências.
   */
  stopAll(): void {
    this.stopCurrent()
    // Limpa todos os elementos de áudio
    this.sounds.forEach((audio) => {
      try {
        audio.pause()
        audio.currentTime = 0
      } catch (e) {
        // Ignora erros
      }
    })
  }

  /**
   * Verifica se um som específico está tocando.
   */
  isPlaying(soundName: string): boolean {
    return (
      this.currentSoundName === soundName &&
      this.currentSound !== null &&
      !this.currentSound.paused
    )
  }
}

// Exporta instância singleton
export const audioFeedbackService = new AudioFeedbackService()

