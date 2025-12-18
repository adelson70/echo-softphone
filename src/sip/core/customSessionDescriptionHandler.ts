import { SessionDescriptionHandlerFactory } from 'sip.js'
import { SessionDescriptionHandler } from 'sip.js/lib/platform/web/session-description-handler'
import { defaultMediaStreamFactory } from 'sip.js/lib/platform/web/session-description-handler/media-stream-factory-default'
import type { Session } from 'sip.js'
import type { SessionDescriptionHandlerOptions } from 'sip.js/lib/platform/web/session-description-handler'

/**
 * Corrige SDP malformado com fingerprint incompleto ou ausente.
 * 
 * PROBLEMA: O servidor uTech PBX pode enviar `a=fingerprint:SHA-256` sem o valor
 * do fingerprint, causando o erro "Called with SDP without DTLS fingerprint" no WebRTC.
 * 
 * SOLUÇÃO: Se o fingerprint estiver malformado ou ausente, substituímos por um
 * fingerprint dummy válido para permitir que o WebRTC processe o SDP.
 * 
 * NOTA DE SEGURANÇA: Isso permite que a conexão seja estabelecida, mas sem
 * verificação adequada do certificado DTLS (menos seguro, mas funcional).
 * A solução ideal seria corrigir a configuração do servidor para enviar
 * o fingerprint correto.
 */
function fixMalformedSdp(sdp: string): string {
  if (!sdp) return sdp

  const lines = sdp.split(/\r?\n/)
  let hasValidFingerprint = false
  const malformedFingerprintIndices: number[] = []
  let fingerprintAlgorithm = 'SHA-256'
  let hasMediaLine = false
  let mediaLineIndex = -1
  
  // Verifica se há fingerprint válido ou malformado, e localiza linhas de mídia
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Detecta linhas de mídia (m=audio ou m=video)
    if (line.match(/^m=(audio|video)/i)) {
      hasMediaLine = true
      if (mediaLineIndex === -1) {
        mediaLineIndex = i
      }
    }
    
    // Verifica se é uma linha de fingerprint válida (com valor após o algoritmo)
    // Formato esperado: a=fingerprint:sha-256 AA:BB:CC:DD:...
    const validFingerprintMatch = line.match(/^a=fingerprint:(SHA-256|SHA-1|MD5)\s+([A-F0-9:]+)/i)
    if (validFingerprintMatch) {
      hasValidFingerprint = true
      break
    }
    
    // Verifica se é uma linha de fingerprint malformada (sem valor após o algoritmo)
    // Formato problemático: a=fingerprint:SHA-256 (sem o hash)
    const malformedFingerprintMatch = line.match(/^a=fingerprint:(SHA-256|SHA-1|MD5)(\s*)$/i)
    if (malformedFingerprintMatch) {
      malformedFingerprintIndices.push(i)
      fingerprintAlgorithm = malformedFingerprintMatch[1]
    }
  }

  // Se há fingerprint malformado e não há válido, corrige
  if (malformedFingerprintIndices.length > 0 && !hasValidFingerprint) {
    // Gera um fingerprint dummy válido (formato SHA-256: 32 bytes em hex separados por :)
    // Este é um hash SHA-256 válido que permite o WebRTC processar o SDP
    // mesmo sem o fingerprint real do servidor
    const dummyFingerprint = '00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF'
    
    // Substitui o primeiro fingerprint malformado por um válido
    const firstIndex = malformedFingerprintIndices[0]
    lines[firstIndex] = `a=fingerprint:${fingerprintAlgorithm} ${dummyFingerprint}`
    
    // Log para debug
    console.warn(
      '[SDP Fix] Corrigido fingerprint malformado no SDP recebido do servidor.',
      'O servidor enviou um fingerprint incompleto. Isso pode indicar um problema',
      'de configuração no uTech PBX. A conexão será estabelecida, mas sem',
      'verificação adequada do certificado DTLS.'
    )
    
    // Remove os outros fingerprints malformados (se houver)
    for (let i = malformedFingerprintIndices.length - 1; i > 0; i--) {
      lines.splice(malformedFingerprintIndices[i], 1)
    }
  }
  // Se não há fingerprint algum e há linhas de mídia, adiciona um
  else if (!hasValidFingerprint && hasMediaLine && mediaLineIndex >= 0) {
    // Procura a posição correta para inserir o fingerprint (após a linha m= e antes de outras linhas a=)
    let insertIndex = mediaLineIndex + 1
    for (let i = mediaLineIndex + 1; i < lines.length; i++) {
      if (lines[i].startsWith('a=')) {
        insertIndex = i
        break
      }
      if (lines[i].startsWith('m=')) {
        // Nova linha de mídia, insere antes dela
        insertIndex = i
        break
      }
    }
    
    const dummyFingerprint = '00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF'
    lines.splice(insertIndex, 0, `a=fingerprint:${fingerprintAlgorithm} ${dummyFingerprint}`)
    
    console.warn(
      '[SDP Fix] Adicionado fingerprint dummy ao SDP recebido (fingerprint ausente).',
      'O servidor não enviou nenhum fingerprint. Isso pode indicar um problema',
      'de configuração no uTech PBX.'
    )
  }

  return lines.join('\r\n')
}

/**
 * SessionDescriptionHandler customizado que corrige SDPs malformados
 * antes de passá-los para o WebRTC.
 */
class FixedSessionDescriptionHandler extends SessionDescriptionHandler {
  /**
   * Sobrescreve setDescription para corrigir o SDP antes de processar.
   */
  async setDescription(
    sdp: string,
    options?: SessionDescriptionHandlerOptions,
    modifiers?: Array<(sessionDescription: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>>
  ): Promise<void> {
    // Corrige o SDP antes de passar para o handler padrão
    const fixedSdp = fixMalformedSdp(sdp)
    return super.setDescription(fixedSdp, options, modifiers)
  }
}

/**
 * Factory function que cria um SessionDescriptionHandler customizado
 * que corrige SDPs malformados.
 */
export function createFixedSessionDescriptionHandlerFactory(): SessionDescriptionHandlerFactory {
  return (session: Session, options?: object): SessionDescriptionHandler => {
    const logger = (session as any).userAgent?.logger
    const mediaStreamFactory = defaultMediaStreamFactory()
    const handler = new FixedSessionDescriptionHandler(logger, mediaStreamFactory, options as any)
    return handler
  }
}

