export type ProviderId = 'google' | 'discord' | 'x' | 'github' | 'tiktok'
export type ProviderAvailability = 'planned' | 'template_pending' | 'ready' | 'degraded' | 'disabled'
export type AdapterKind = 'enterprise' | 'network'
export type TemplateStatus = 'draft' | 'testing' | 'active' | 'disabled'
export type ProofStatus = 'created' | 'awaiting_user' | 'awaiting_extension' | 'generating' | 'submitted' | 'verifying' | 'verified' | 'rejected' | 'expired' | 'cancelled' | 'failed'
export type ProofMode = 'simulated' | 'live'

export interface ClaimDefinition {
  id: string
  name: string
  description: string
  candidate: true
}

export interface ProviderDefinition {
  id: ProviderId
  name: string
  description: string
  connectionMethod: 'primus_extension'
  claims: ClaimDefinition[]
  availability: ProviderAvailability
  icon: string
  adapters: AdapterKind[]
}

export interface ProofTemplate {
  id: string
  providerId: ProviderId
  claimId: string
  primusTemplateId: string
  version: string
  description: string
  disclosedFields: string[]
  supportedConditions: string[]
  adapter: AdapterKind
  status: TemplateStatus
}

export interface ProofInput {
  providerId: ProviderId
  claimId: string
  recipient: string
  consent: boolean
  mode: ProofMode
}

export interface ProofSession {
  id: string
  providerId: ProviderId
  claimId: string
  recipient: string
  nonce: string
  templateId: string | null
  templateVersion: string | null
  mode: ProofMode
  status: ProofStatus
  createdAt: string
  expiresAt: string
  consumedAt: string | null
}

export interface ProofResult {
  sessionId: string
  mode: ProofMode
  status: ProofStatus
  attestation?: unknown
}

export interface VerificationResult {
  verified: boolean
  mode: ProofMode
  reason: string
}

export interface AttestationVerifier {
  verify(session: ProofSession, attestation: unknown): Promise<VerificationResult>
}

export interface ProofProviderAdapter {
  initialize(): Promise<void>
  createProofSession(input: ProofInput): Promise<ProofSession>
  executeProof(session: ProofSession): Promise<ProofResult>
  verifyProof(result: ProofResult): Promise<VerificationResult>
}
