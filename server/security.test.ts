import { describe, expect, it } from 'vitest'
import { issueSecretApiKey, signWebhook, verifySecretApiKey, WebhookVerifier } from './security.ts'

const pepper = 'test-only-pepper-with-more-than-32-characters'
const secret = 'test-only-webhook-secret-with-32-characters'
const eventId = '123e4567-e89b-42d3-a456-426614174000'

describe('developer API key protection', () => {
  it('stores a salted hash and verifies the raw key once', () => {
    const { raw, stored } = issueSecretApiKey(pepper)
    expect(stored.hash).not.toContain(raw)
    expect(stored.prefix.length).toBeLessThan(raw.length)
    expect(verifySecretApiKey(raw, stored, pepper)).toBe(true)
    expect(verifySecretApiKey(raw + 'x', stored, pepper)).toBe(false)
  })
  it('requires a strong server pepper', () => expect(() => issueSecretApiKey('short')).toThrow(/strong/))
})

describe('webhook signatures', () => {
  it('validates body, timestamp, and event ID once', () => {
    const now = 1_700_000_000_000
    const verifier = new WebhookVerifier(() => now)
    const body = JSON.stringify({ type: 'proof.failed', data: { sessionId: 'demo' } })
    const header = signWebhook(secret, eventId, now / 1000, body)
    expect(verifier.verify(secret, header, body)).toBe(true)
    expect(verifier.verify(secret, header, body)).toBe(false)
  })
  it('rejects tampered body and stale signatures', () => {
    const now = 1_700_000_000_000
    const body = '{}'
    const header = signWebhook(secret, eventId, now / 1000, body)
    expect(new WebhookVerifier(() => now).verify(secret, header, '{"changed":true}')).toBe(false)
    expect(new WebhookVerifier(() => now + 301_000).verify(secret, header, body)).toBe(false)
  })
})
