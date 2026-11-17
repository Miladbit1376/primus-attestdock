import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export interface StoredApiKey {
  prefix: string
  salt: string
  hash: string
}

export function issueSecretApiKey(pepper: string): { raw: string; stored: StoredApiKey } {
  if (pepper.length < 32) throw new Error('A strong server pepper is required.')
  const raw = 'ss_sk_' + randomBytes(32).toString('base64url')
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(raw + pepper, salt, 32).toString('hex')
  return { raw, stored: { prefix: raw.slice(0, 13), salt, hash } }
}

export function verifySecretApiKey(raw: string, stored: StoredApiKey, pepper: string): boolean {
  if (!raw.startsWith(stored.prefix) || pepper.length < 32) return false
  if (!/^[0-9a-f]{32}$/.test(stored.salt) || !/^[0-9a-f]{64}$/.test(stored.hash)) return false
  const actual = scryptSync(raw + pepper, stored.salt, 32)
  return timingSafeEqual(actual, Buffer.from(stored.hash, 'hex'))
}

export interface WebhookEnvelope {
  id: string
  type: string
  createdAt: string
  data: Record<string, unknown>
}

export function signWebhook(secret: string, eventId: string, timestampSeconds: number, body: string): string {
  if (secret.length < 32 || !/^[0-9a-f-]{36}$/i.test(eventId) || !Number.isSafeInteger(timestampSeconds)) throw new Error('Invalid webhook signing input.')
  const payload = timestampSeconds + '.' + eventId + '.' + body
  const signature = createHmac('sha256', secret).update(payload).digest('hex')
  return 't=' + timestampSeconds + ',id=' + eventId + ',v1=' + signature
}

export class WebhookVerifier {
  private readonly used = new Set<string>()
  constructor(private readonly clock: () => number = Date.now, private readonly maxAgeSeconds = 300) {}
  verify(secret: string, header: string, body: string): boolean {
    const match = /^t=(\d+),id=([0-9a-f-]{36}),v1=([0-9a-f]{64})$/i.exec(header)
    if (!match || secret.length < 32) return false
    const timestamp = Number(match[1])
    if (!Number.isSafeInteger(timestamp) || Math.abs(Math.floor(this.clock() / 1000) - timestamp) > this.maxAgeSeconds) return false
    if (this.used.has(match[2])) return false
    const expected = signWebhook(secret, match[2], timestamp, body)
    const expectedHash = expected.slice(expected.lastIndexOf('=') + 1)
    const valid = timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(match[3], 'hex'))
    if (valid) this.used.add(match[2])
    return valid
  }
}
