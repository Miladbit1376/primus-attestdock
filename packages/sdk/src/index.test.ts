import { describe, expect, it, vi } from 'vitest'
import { AttestDock, AttestDockApiError } from './index.ts'

describe('AttestDock developer SDK', () => {
  it('rejects insecure remote API origins', () => {
    expect(() => new AttestDock({ baseUrl: 'http://example.com' })).toThrow(/HTTPS/)
    expect(() => new AttestDock({ baseUrl: 'https://user:pass@example.com' })).toThrow(/plain/)
  })
  it('uses typed provider routes without secret credentials', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ providers: [] }), { status: 200, headers: { 'content-type': 'application/json' } }))
    const sdk = new AttestDock({ baseUrl: 'http://127.0.0.1:4174', publishableKey: 'public-demo', fetcher })
    expect(await sdk.providers.list()).toEqual([])
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://127.0.0.1:4174/api/v1/providers')
    expect(new Headers(init.headers).get('X-AttestDock-Publishable-Key')).toBe('public-demo')
  })
  it('does not turn an unavailable verification into success', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: 'Not configured.' }), { status: 503, headers: { 'content-type': 'application/json' } }))
    const sdk = new AttestDock({ baseUrl: 'http://localhost:4174', fetcher })
    await expect(sdk.proofs.verify({ proofId: 'demo' })).rejects.toBeInstanceOf(AttestDockApiError)
  })
})
