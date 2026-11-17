import type { ProofInput, ProofProviderAdapter, ProofResult, ProofSession, VerificationResult } from './types.ts'
import { ProofSessionManager } from './proofs.ts'

const messages: Record<string, string> = {
  '00004': 'The user cancelled the verification.',
  '00006': 'The Primus extension is missing or disabled.',
  '00012': 'The approved template is unavailable.',
  '00002': 'The verification timed out.',
  '10001': 'The network connection is unstable.'
}

export function primusErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
  return messages[code] ?? 'The proof could not be completed. Try again later.'
}

export class IntegrationUnavailableError extends Error {
  constructor(message: string) { super(message); this.name = 'IntegrationUnavailableError' }
}

abstract class DisabledAdapter implements ProofProviderAdapter {
  protected unavailable(): never { throw new IntegrationUnavailableError('No approved template, credentials, and trusted verifier are configured.') }
  async initialize(): Promise<void> { this.unavailable() }
  async createProofSession(_input: ProofInput): Promise<ProofSession> { this.unavailable() }
  async executeProof(_session: ProofSession): Promise<ProofResult> { this.unavailable() }
  async verifyProof(_result: ProofResult): Promise<VerificationResult> { this.unavailable() }
}

export class PrimusEnterpriseAdapter extends DisabledAdapter {
  readonly kind = 'enterprise'
}

export class PrimusNetworkAdapter extends DisabledAdapter {
  readonly kind = 'network'
  readonly developmentChainId = 84532
  readonly productionChainId = 8453
  validateChain(chainId: number, environment: 'development' | 'production'): void {
    const expected = environment === 'development' ? this.developmentChainId : this.productionChainId
    if (chainId !== expected) throw new IntegrationUnavailableError('Switch to the configured Base network before starting a proof.')
  }
}


export class SimulatedProofAdapter implements ProofProviderAdapter {
  constructor(private readonly sessions: ProofSessionManager) {}
  async initialize(): Promise<void> {}
  async createProofSession(input: ProofInput): Promise<ProofSession> {
    if (input.mode !== 'simulated') throw new IntegrationUnavailableError('Simulation cannot create a live proof.')
    return this.sessions.create(input)
  }
  async executeProof(session: ProofSession): Promise<ProofResult> {
    if (session.mode !== 'simulated') throw new IntegrationUnavailableError('Simulation cannot execute a live proof.')
    this.sessions.transition(session.id, 'awaiting_user')
    this.sessions.transition(session.id, 'awaiting_extension')
    this.sessions.transition(session.id, 'generating')
    const submitted = this.sessions.transition(session.id, 'submitted')
    return { sessionId: submitted.id, mode: 'simulated', status: submitted.status }
  }
  async verifyProof(_result: ProofResult): Promise<VerificationResult> {
    return { verified: false, mode: 'simulated', reason: 'Development simulation has no cryptographic attestation.' }
  }
}
