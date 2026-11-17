import { describe, expect, it } from 'vitest'
import { APIKeyManager, DeveloperProjectManager } from './developer.ts'

const pepper = 'test-only-pepper-with-more-than-32-characters'

describe('developer project ownership', () => {
  it('restricts project reads to the owner', () => {
    const projects = new DeveloperProjectManager()
    const project = projects.create('alice', 'Demo', ['https://app.example'])
    expect(projects.getOwned(project.id, 'alice')).toBeDefined()
    expect(projects.getOwned(project.id, 'bob')).toBeUndefined()
    expect(projects.listOwned('bob')).toEqual([])
  })
  it('rejects unsafe origins', () => {
    const projects = new DeveloperProjectManager()
    expect(() => projects.create('alice', 'Demo', ['http://app.example'])).toThrow(/HTTPS/)
    expect(() => projects.create('alice', 'Demo', ['https://user:pass@app.example'])).toThrow(/HTTPS/)
  })
})

describe('scoped developer API keys', () => {
  it('issues once, authorizes a scope, and revokes', () => {
    const projects = new DeveloperProjectManager()
    const keys = new APIKeyManager(projects, pepper)
    const project = projects.create('alice', 'Demo')
    const { raw, record } = keys.issue('alice', project.id, ['providers:read'])
    expect(record).not.toHaveProperty('stored')
    expect(keys.authorize(raw, 'providers:read')?.projectId).toBe(project.id)
    expect(keys.authorize(raw, 'proofs:create')).toBeUndefined()
    keys.revoke('alice', record.id)
    expect(keys.authorize(raw, 'providers:read')).toBeUndefined()
  })
  it('rejects another owner and unknown scopes', () => {
    const projects = new DeveloperProjectManager()
    const keys = new APIKeyManager(projects, pepper)
    const project = projects.create('alice', 'Demo')
    expect(() => keys.issue('bob', project.id, ['providers:read'])).toThrow(/not found/)
    expect(() => keys.issue('alice', project.id, ['admin:*'])).toThrow(/scope/)
  })
})
