import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto'
import { DeveloperProjectManager } from './developer.ts'
import { signWebhook } from './security.ts'

type Ciphertext = { iv: string; tag: string; data: string }
type Endpoint = { id: string; projectId: string; url: string; encryptedSecret: Ciphertext; active: boolean }
export type DeliveryStatus = 'pending' | 'delivered' | 'failed'
export type WebhookEventType = 'proof.created' | 'proof.started' | 'proof.completed' | 'proof.verified' | 'proof.failed' | 'proof.expired'
export interface Delivery {
  id: string
  endpointId: string
  eventId: string
  eventType: WebhookEventType
  sessionId: string
  status: DeliveryStatus
  attempts: number
  nextAttemptAt: number
}

function validateUrl(value: string): void {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) throw new Error('Webhook endpoint must use a plain HTTPS URL.')
}

export class WebhookManager {
  private readonly endpoints = new Map<string, Endpoint>()
  private readonly deliveries = new Map<string, Delivery>()
  constructor(private readonly projects: DeveloperProjectManager, private readonly encryptionKey: Buffer, private readonly clock: () => number = Date.now) {
    if (encryptionKey.length !== 32) throw new Error('A 32-byte encryption key is required.')
  }
  register(ownerId: string, projectId: string, url: string, secret: string): { id: string; url: string } {
    if (!this.projects.getOwned(projectId, ownerId)) throw new Error('Project not found.')
    validateUrl(url)
    if (secret.length < 32) throw new Error('A strong webhook secret is required.')
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv)
    const data = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
    const endpoint: Endpoint = { id: randomUUID(), projectId, url, active: true, encryptedSecret: { iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), data: data.toString('hex') } }
    this.endpoints.set(endpoint.id, endpoint)
    return { id: endpoint.id, url }
  }
  enqueue(endpointId: string, eventId: string, eventType: WebhookEventType, sessionId: string): Delivery {
    if (!this.endpoints.get(endpointId)?.active) throw new Error('Webhook endpoint is unavailable.')
    if (!/^[0-9a-f-]{36}$/i.test(eventId) || !sessionId.trim()) throw new Error('Invalid event.')
    const duplicate = [...this.deliveries.values()].find(item => item.endpointId === endpointId && item.eventId === eventId)
    if (duplicate) return { ...duplicate }
    const item: Delivery = { id: randomUUID(), endpointId, eventId, eventType, sessionId, status: 'pending', attempts: 0, nextAttemptAt: this.clock() }
    this.deliveries.set(item.id, item)
    return { ...item }
  }
  prepare(id: string): { url: string; body: string; signature: string } {
    const delivery = this.deliveries.get(id)
    if (!delivery || delivery.status !== 'pending' || delivery.nextAttemptAt > this.clock()) throw new Error('Delivery is not ready.')
    const endpoint = this.endpoints.get(delivery.endpointId)
    if (!endpoint?.active) throw new Error('Webhook endpoint is unavailable.')
    const secret = this.decrypt(endpoint.encryptedSecret)
    const timestamp = Math.floor(this.clock() / 1000)
    const body = JSON.stringify({ id: delivery.eventId, type: delivery.eventType, createdAt: new Date(this.clock()).toISOString(), data: { sessionId: delivery.sessionId } })
    return { url: endpoint.url, body, signature: signWebhook(secret, delivery.eventId, timestamp, body) }
  }
  recordResult(id: string, delivered: boolean): Delivery {
    const item = this.deliveries.get(id)
    if (!item || item.status !== 'pending') throw new Error('Delivery is not pending.')
    item.attempts += 1
    item.status = delivered ? 'delivered' : item.attempts >= 5 ? 'failed' : 'pending'
    if (item.status === 'pending') item.nextAttemptAt = this.clock() + Math.min(60_000 * 2 ** (item.attempts - 1), 15 * 60_000)
    return { ...item }
  }
  private decrypt(value: Ciphertext): string {
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, Buffer.from(value.iv, 'hex'))
    decipher.setAuthTag(Buffer.from(value.tag, 'hex'))
    return Buffer.concat([decipher.update(Buffer.from(value.data, 'hex')), decipher.final()]).toString('utf8')
  }
}
