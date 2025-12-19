import type { Invitation, Inviter, Session } from 'sip.js'
import { SessionState } from 'sip.js'

export function isInvitation(session: Session | undefined): session is Invitation {
  return Boolean(session && (session as Invitation).accept)
}

export function isInviter(session: Session | undefined): session is Inviter {
  return Boolean(session && (session as Inviter).invite)
}

export function canSendBye(session: Session | undefined): boolean {
  if (!session) return false
  return session.state === SessionState.Established
}

export function canCancel(inviter: Inviter | undefined): boolean {
  if (!inviter) return false
  // Permite cancelar em qualquer estado que não seja Terminated
  // Isso inclui o estado Initial (dialing) e Establishing (ringing)
  return inviter.state !== SessionState.Terminated
}

export function canReject(invitation: Invitation | undefined): boolean {
  if (!invitation) return false
  // Permite rejeitar em estados anteriores a Established (Initial e Establishing)
  // Uma invitation pode ser rejeitada enquanto não estiver Established ou Terminated
  return invitation.state !== SessionState.Established && invitation.state !== SessionState.Terminated
}


