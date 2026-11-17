import type { AttestationVerifier, ProofInput, ProofProviderAdapter, ProofResult, ProofSession, VerificationResult } from './types.ts'
import { IntegrationUnavailableError } from './adapters.ts'

export class ProofEngine {
  constructor(
    private readonly adapter: ProofProviderAdapter,
    private readonly verifier: AttestationVerifier | null = null
  ) {}
  async create(input: ProofInput): Promise<ProofSession> {
    if (input.mode === 'live' && !this.verifier) throw new IntegrationUnavailableError('Trusted server verification is not configured.')
    return this.adapter.createProofSession(input)
  }
  async execute(session: ProofSession): Promise<ProofResult> {
    return this.adapter.executeProof(session)
  }
  async verify(session: ProofSession, result: ProofResult): Promise<VerificationResult> {
    if (session.id !== result.sessionId || session.mode !== result.mode) throw new Error('Proof result does not match its session.')
    if (session.mode === 'simulated') return { verified: false, mode: 'simulated', reason: 'Development simulation has no cryptographic attestation.' }
    if (!this.verifier || !result.attestation) throw new IntegrationUnavailableError('Trusted server verification is not configured.')
    const outcome = await this.verifier.verify(session, result.attestation)
    if (outcome.mode !== 'live') throw new Error('Verifier returned an invalid mode.')
    return outcome
  }
}
