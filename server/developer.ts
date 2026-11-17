import { randomUUID } from 'node:crypto'
import { issueSecretApiKey, verifySecretApiKey, type StoredApiKey } from './security.ts'

export interface DeveloperProject {
  id: string
  ownerId: string
  name: string
  allowedOrigins: string[]
  createdAt: string
}
export interface DeveloperApiKey {
  id: string
  projectId: string
  prefix: string
  scopes: string[]
  createdAt: string
  revokedAt: string | null
  stored: StoredApiKey
}

function validOrigin(value: string): boolean {
  try {
    const url = new URL(value)
    return !url.username && !url.password && !url.search && !url.hash && url.pathname === '/' &&
      (url.protocol === 'https:' || url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
  } catch { return false }
}

export class DeveloperProjectManager {
  private readonly projects = new Map<string, DeveloperProject>()
  create(ownerId: string, name: string, allowedOrigins: string[] = []): DeveloperProject {
    if (!ownerId.trim() || name.trim().length < 2 || name.length > 80) throw new Error('Owner and project name are required.')
    if (allowedOrigins.length > 10 || allowedOrigins.some(origin => !validOrigin(origin))) throw new Error('Use explicit HTTPS origins.')
    const item: DeveloperProject = { id: randomUUID(), ownerId, name: name.trim(), allowedOrigins: [...new Set(allowedOrigins)], createdAt: new Date().toISOString() }
    this.projects.set(item.id, item)
    return { ...item, allowedOrigins: [...item.allowedOrigins] }
  }
  getOwned(id: string, ownerId: string): DeveloperProject | undefined {
    const item = this.projects.get(id)
    return item?.ownerId === ownerId ? { ...item, allowedOrigins: [...item.allowedOrigins] } : undefined
  }
  listOwned(ownerId: string): DeveloperProject[] {
    return [...this.projects.values()].filter(item => item.ownerId === ownerId).map(item => ({ ...item, allowedOrigins: [...item.allowedOrigins] }))
  }
}

export class APIKeyManager {
  private readonly keys = new Map<string, DeveloperApiKey>()
  constructor(private readonly projects: DeveloperProjectManager, private readonly pepper: string) {}
  issue(ownerId: string, projectId: string, scopes: string[]): { raw: string; record: Omit<DeveloperApiKey, 'stored'> } {
    if (!this.projects.getOwned(projectId, ownerId)) throw new Error('Project not found.')
    const allowed = new Set(['providers:read', 'proofs:create', 'proofs:read', 'webhooks:manage'])
    if (!scopes.length || scopes.some(scope => !allowed.has(scope))) throw new Error('Invalid key scope.')
    const { raw, stored } = issueSecretApiKey(this.pepper)
    const item: DeveloperApiKey = { id: randomUUID(), projectId, prefix: stored.prefix, scopes: [...new Set(scopes)], createdAt: new Date().toISOString(), revokedAt: null, stored }
    this.keys.set(item.id, item)
    const { stored: _stored, ...record } = item
    return { raw, record }
  }
  authorize(raw: string, scope: string): { projectId: string; keyId: string } | undefined {
    const item = [...this.keys.values()].find(key => !key.revokedAt && key.scopes.includes(scope) && verifySecretApiKey(raw, key.stored, this.pepper))
    return item ? { projectId: item.projectId, keyId: item.id } : undefined
  }
  revoke(ownerId: string, keyId: string): void {
    const item = this.keys.get(keyId)
    if (!item || !this.projects.getOwned(item.projectId, ownerId)) throw new Error('Key not found.')
    item.revokedAt = new Date().toISOString()
  }
}
