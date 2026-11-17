import type { ProviderDefinition, ProofSession } from '../../../src/platform/types.ts'

export interface AttestDockOptions {
  baseUrl: string
  publishableKey?: string
  fetcher?: typeof fetch
}

export class AttestDockApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); this.name = 'AttestDockApiError' }
}

export class AttestDock {
  private readonly baseUrl: string
  private readonly fetcher: typeof fetch
  private readonly publishableKey?: string

  constructor(options: AttestDockOptions) {
    const url = new URL(options.baseUrl)
    if (url.username || url.password || url.search || url.hash) throw new Error('Use a plain API base URL.')
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
      throw new Error('Use HTTPS outside local development.')
    }
    this.baseUrl = url.origin
    this.fetcher = options.fetcher ?? fetch
    this.publishableKey = options.publishableKey
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    if (init.body) headers.set('Content-Type', 'application/json')
    if (this.publishableKey) headers.set('X-AttestDock-Publishable-Key', this.publishableKey)
    const response = await this.fetcher(this.baseUrl + path, { ...init, headers })
    const body: unknown = await response.json()
    if (!response.ok) {
      const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : 'AttestDock request failed.'
      throw new AttestDockApiError(response.status, message)
    }
    return body as T
  }

  readonly providers = {
    list: async (): Promise<ProviderDefinition[]> => (await this.request<{ providers: ProviderDefinition[] }>('/api/v1/providers')).providers,
    claims: async (providerId: string): Promise<ProviderDefinition['claims']> =>
      (await this.request<{ claims: ProviderDefinition['claims'] }>('/api/v1/providers/' + encodeURIComponent(providerId) + '/claims')).claims
  }

  readonly proofs = {
    createSession: async (input: { providerId: string; claimId: string; recipient: string; consent: true; mode: 'simulated' | 'live'; idempotencyKey: string }): Promise<{ session: ProofSession; simulation: boolean }> =>
      this.request('/api/v1/proof-sessions', { method: 'POST', headers: { 'Idempotency-Key': input.idempotencyKey }, body: JSON.stringify({ providerId: input.providerId, claimId: input.claimId, recipient: input.recipient, consent: input.consent, mode: input.mode }) }),
    getSession: async (id: string): Promise<{ session: ProofSession; simulation: boolean }> =>
      this.request('/api/v1/proof-sessions/' + encodeURIComponent(id)),
    verify: async (input: { proofId: string }): Promise<never> =>
      this.request('/api/v1/attestations/verify', { method: 'POST', body: JSON.stringify(input) })
  }
}
