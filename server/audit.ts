import { randomUUID } from 'node:crypto'

export interface AuditEvent {
  id: string
  type: string
  actorId: string | null
  metadata: Record<string, string>
  createdAt: string
}
const allowed = new Set(['projectId', 'sessionId', 'eventId', 'status', 'route'])
const statuses = new Set(['created', 'awaiting_user', 'awaiting_extension', 'generating', 'submitted', 'verifying', 'verified', 'rejected', 'expired', 'cancelled', 'failed', 'delivered', 'pending'])
function safeMetadata(key: string, value: string): boolean {
  if (key === 'status') return statuses.has(value)
  if (key === 'route') return /^\/api\/v1\/[a-z0-9/_-]{1,80}$/.test(value)
  return /^[0-9a-f-]{36}$/i.test(value)
}

export class AuditLogger {
  private readonly events: AuditEvent[] = []
  record(type: string, actorId: string | null, metadata: Record<string, string>): AuditEvent {
    if (!type.trim() || Object.keys(metadata).some(key => !allowed.has(key))) throw new Error('Audit metadata is not allowed.')
    if (Object.entries(metadata).some(([key, value]) => !safeMetadata(key, value))) throw new Error('Audit metadata value is not allowed.')
    const item: AuditEvent = { id: randomUUID(), type, actorId, metadata: { ...metadata }, createdAt: new Date().toISOString() }
    this.events.push(item)
    return { ...item, metadata: { ...item.metadata } }
  }
  list(): AuditEvent[] { return this.events.map(item => ({ ...item, metadata: { ...item.metadata } })) }
}
