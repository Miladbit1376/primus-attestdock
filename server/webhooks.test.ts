import { describe, expect, it } from 'vitest'
import { DeveloperProjectManager } from './developer.ts'
import { WebhookVerifier } from './security.ts'
import { WebhookManager } from './webhooks.ts'
import { AuditLogger } from './audit.ts'

const secret = 'test-only-webhook-secret-with-32-characters'
const eventId = '123e4567-e89b-42d3-a456-426614174000'

describe('internal webhook queue', () => {
  it('enforces project ownership and creates minimal signed payloads', () => {
    const projects = new DeveloperProjectManager()
    const project = projects.create('alice', 'Demo')
    const now = 1_700_000_000_000
    const webhooks = new WebhookManager(projects, Buffer.alloc(32, 3), () => now)
    expect(() => webhooks.register('bob', project.id, 'https://hooks.example/path', secret)).toThrow(/not found/)
    expect(() => webhooks.register('alice', project.id, 'http://hooks.example/path', secret)).toThrow(/HTTPS/)
    const endpoint = webhooks.register('alice', project.id, 'https://hooks.example/path', secret)
    const delivery = webhooks.enqueue(endpoint.id, eventId, 'proof.failed', 'demo-session')
    expect(webhooks.enqueue(endpoint.id, eventId, 'proof.failed', 'demo-session').id).toBe(delivery.id)
    const prepared = webhooks.prepare(delivery.id)
    expect(prepared.body).toContain('demo-session')
    expect(prepared.body).not.toContain('attestation')
    expect(new WebhookVerifier(() => now).verify(secret, prepared.signature, prepared.body)).toBe(true)
    expect(webhooks.recordResult(delivery.id, true).status).toBe('delivered')
  })
  it('caps retries after five failures', () => {
    const projects = new DeveloperProjectManager()
    const project = projects.create('alice', 'Demo')
    let now = 1_700_000_000_000
    const webhooks = new WebhookManager(projects, Buffer.alloc(32, 3), () => now)
    const endpoint = webhooks.register('alice', project.id, 'https://hooks.example/path', secret)
    const delivery = webhooks.enqueue(endpoint.id, eventId, 'proof.failed', 'demo-session')
    for (let attempt = 1; attempt <= 5; attempt++) {
      const state = webhooks.recordResult(delivery.id, false)
      if (attempt < 5) { expect(state.status).toBe('pending'); now = state.nextAttemptAt }
      else expect(state.status).toBe('failed')
    }
  })
})

describe('audit log data limits', () => {
  it('rejects credential-like metadata fields', () => {
    const log = new AuditLogger()
    expect(() => log.record('proof.failed', 'alice', { appSecret: 'test-only' })).toThrow(/not allowed/)
    expect(() => log.record('proof.failed', 'alice', { status: 'appSecret=test-only' })).toThrow(/not allowed/)
    expect(log.record('proof.failed', 'alice', { status: 'failed' }).metadata).toEqual({ status: 'failed' })
  })
})
