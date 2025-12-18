import type { Session } from 'sip.js'

export type DtmfKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '*' | '#'

const DTMF_FREQUENCIES: Record<DtmfKey, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
}

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  return audioContext
}

export function playLocalDtmfTone(key: string, durationMs = 150): void {
  if (!(key in DTMF_FREQUENCIES)) return
  const [f1, f2] = DTMF_FREQUENCIES[key as DtmfKey]

  const ctx = getAudioContext()
  
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()

  osc1.frequency.value = f1
  osc2.frequency.value = f2
  
  // Reduz o volume para evitar som estridente (0.1 = 10% do volume máximo)
  gain.gain.value = 0.06

  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)

  osc1.start()
  osc2.start()
  setTimeout(() => {
    osc1.stop()
    osc2.stop()
  }, durationMs)
}

export function sendDtmf(session: Session, tones: string): boolean {
  const anySession = session as any
  const sdh = anySession.sessionDescriptionHandler
  if (!sdh?.sendDtmf) return false
  return Boolean(sdh.sendDtmf(tones))
}

export function handleDtmf(
  session: Session | undefined,
  key: string,
  opts: { playLocal?: boolean; sendRemote?: boolean } = { playLocal: true, sendRemote: true }
): boolean {
  if (opts.playLocal !== false) playLocalDtmfTone(key)
  if (!session) return false
  if (opts.sendRemote === false) return true
  return sendDtmf(session, key)
}


