import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { ProviderRegistry } from '../src/platform/providers.ts'
import { TemplateRegistry } from '../src/platform/templates.ts'
import { ProofSessionManager } from '../src/platform/proofs.ts'
import { SimulatedProofAdapter } from '../src/platform/adapters.ts'
import { ProofEngine } from '../src/platform/engine.ts'
import type { ProofInput, ProviderId } from '../src/platform/types.ts'
import { PrimusError, PrimusXFlow } from './primus.ts'

class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

async function parseBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  if (!request.headers['content-type']?.startsWith('application/json')) throw new HttpError(415, 'Use application/json.')
  let body = ''
  for await (const part of request) {
    body += part.toString()
    if (body.length > 65536) throw new HttpError(413, 'Request is too large.')
  }
  try {
    const parsed: unknown = JSON.parse(body)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    return parsed as Record<string, unknown>
  } catch { throw new HttpError(400, 'Invalid JSON object.') }
}

function checkRequest(request: IncomingMessage, requests: Map<string, { count: number; resetAt: number }>): void {
  const host = request.headers.host ?? ''
  if (!/^(127\.0\.0\.1|localhost)(:\d{1,5})?$/.test(host)) throw new HttpError(403, 'Host is not allowed.')
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.origin
    if ((request.url?.startsWith('/api/v1/primus/') && !origin) || (origin && origin !== 'http://' + host)) throw new HttpError(403, 'Origin is not allowed.')
  }
  const ip = request.socket.remoteAddress ?? 'unknown'
  const now = Date.now()
  const previous = requests.get(ip)
  const next = !previous || previous.resetAt <= now ? { count: 1, resetAt: now + 60_000 } : { count: previous.count + 1, resetAt: previous.resetAt }
  requests.set(ip, next)
  if (next.count > 120) throw new HttpError(429, 'Too many requests.')
}

async function staticFile(pathname: string, response: ServerResponse, directory: string): Promise<boolean> {
  const name = pathname === '/' ? 'index.html' : pathname.slice(1)
  if (!['index.html', 'favicon.svg', 'assurance-report.json', 'external-demo-report.json'].includes(name) && !/^assets\/[A-Za-z0-9_.-]+$/.test(name)) return false
  try {
    const bytes = await readFile(join(directory, name))
    response.statusCode = 200
    response.setHeader('Content-Type', name.endsWith('.html') ? 'text/html; charset=utf-8' : name.endsWith('.svg') ? 'image/svg+xml' : name.endsWith('.json') ? 'application/json; charset=utf-8' : name.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8')
    response.end(bytes)
    return true
  } catch { return false }
}

export function createAttestDockServer(options: { development: boolean; distDirectory: string; primusFlow?: PrimusXFlow }): Server {
  const providers = new ProviderRegistry()
  const templates = new TemplateRegistry(providers)
  const sessions = new ProofSessionManager(providers, templates)
  const engine = new ProofEngine(new SimulatedProofAdapter(sessions))
  const idempotency = new Map<string, { digest: string; sessionId: string }>()
  const requests = new Map<string, { count: number; resetAt: number }>()
  const primus = options.primusFlow ?? new PrimusXFlow({ appId: process.env.PRIMUS_APP_ID ?? '', appSecret: process.env.PRIMUS_APP_SECRET ?? '' })
  return createHttpServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'no-referrer')
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self'; connect-src 'self' https://api.padolabs.org; img-src 'self' data:; base-uri 'none'; form-action 'self'")
    try {
      checkRequest(request, requests)
      const url = new URL(request.url ?? '/', 'http://127.0.0.1')
      const pathname = url.pathname
      if (request.method === 'GET' && pathname === '/health') return send(response, 200, { status: 'ok', mode: options.development ? 'development' : 'unavailable' })
      if (request.method === 'GET' && pathname === '/api/v1/primus/config') return send(response, 200, { ...primus.publicConfig, enabled: options.development && primus.enabled })
      if (pathname.startsWith('/api/v1/primus/') && !options.development) throw new HttpError(503, 'Live proof service is disabled.')
      if (request.method === 'GET' && pathname === '/api/v1/primus/proofs') {
        const wallet = primus.wallet(request.headers.cookie)
        return send(response, 200, { wallet, proofs: primus.listVerified(wallet) })
      }
      if (request.method === 'POST' && pathname === '/api/v1/primus/challenge') {
        const body = await parseBody(request)
        if (Object.keys(body).some(key => key !== 'wallet')) throw new HttpError(400, 'Unsupported wallet field.')
        return send(response, 200, primus.challenge(body.wallet))
      }
      if (request.method === 'POST' && pathname === '/api/v1/primus/authenticate') {
        const body = await parseBody(request)
        if (Object.keys(body).some(key => !['challengeId', 'signature'].includes(key))) throw new HttpError(400, 'Unsupported wallet field.')
        const result = primus.authenticate(body.challengeId, body.signature)
        response.setHeader('Set-Cookie', result.cookie)
        return send(response, 200, { wallet: result.wallet })
      }
      if (request.method === 'POST' && pathname === '/api/v1/primus/sessions') {
        const wallet = primus.wallet(request.headers.cookie)
        const body = await parseBody(request)
        if (Object.keys(body).some(key => !['handle', 'consent'].includes(key)) || body.consent !== true) throw new HttpError(400, 'X proof consent and username are required.')
        return send(response, 201, primus.create(wallet, body.handle))
      }
      if (request.method === 'POST' && pathname === '/api/v1/primus/sign') {
        const wallet = primus.wallet(request.headers.cookie)
        const body = await parseBody(request)
        if (Object.keys(body).some(key => !['sessionId', 'serializedRequest'].includes(key))) throw new HttpError(400, 'Unsupported signing field.')
        return send(response, 200, await primus.sign(wallet, body.sessionId, body.serializedRequest))
      }
      if (request.method === 'POST' && pathname === '/api/v1/primus/verify') {
        const wallet = primus.wallet(request.headers.cookie)
        const body = await parseBody(request)
        if (Object.keys(body).some(key => !['sessionId', 'attestation'].includes(key))) throw new HttpError(400, 'Unsupported verification field.')
        return send(response, 200, await primus.verify(wallet, body.sessionId, body.attestation))
      }
      if (request.method === 'GET' && pathname === '/api/v1/providers') return send(response, 200, { providers: providers.list() })
      const claimMatch = /^\/api\/v1\/providers\/([a-z]+)\/claims$/.exec(pathname)
      if (request.method === 'GET' && claimMatch) {
        const provider = providers.get(claimMatch[1])
        if (!provider) throw new HttpError(404, 'Provider not found.')
        return send(response, 200, { providerId: provider.id, availability: provider.availability, claims: provider.claims })
      }
      if (request.method === 'GET' && pathname === '/api/v1/templates') return send(response, 200, { templates: templates.list() })
      if (request.method === 'POST' && pathname === '/api/v1/proof-sessions') {
        if (!options.development) throw new HttpError(503, 'Proof creation is not configured.')
        const key = request.headers['idempotency-key']
        if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(key)) throw new HttpError(400, 'A valid Idempotency-Key is required.')
        const body = await parseBody(request)
        const allowedFields = new Set(['providerId', 'claimId', 'recipient', 'consent', 'mode'])
        if (Object.keys(body).some(field => !allowedFields.has(field))) throw new HttpError(400, 'Unsupported proof field.')
        if (body.mode !== 'simulated') throw new HttpError(503, 'Live proof creation is not configured.')
        if (typeof body.providerId !== 'string' || typeof body.claimId !== 'string' || typeof body.recipient !== 'string' || body.consent !== true) throw new HttpError(400, 'Invalid proof request.')
        const digest = createHash('sha256').update(JSON.stringify(body)).digest('hex')
        const prior = idempotency.get(key)
        if (prior) {
          if (prior.digest !== digest) throw new HttpError(409, 'Idempotency key already used for different input.')
          return send(response, 200, { session: sessions.get(prior.sessionId), simulation: true })
        }
        const input: ProofInput = { providerId: body.providerId as ProviderId, claimId: body.claimId, recipient: body.recipient, consent: true, mode: 'simulated' }
        let session
        try { session = await engine.create(input) } catch (error) { throw new HttpError(400, error instanceof Error ? error.message : 'Invalid proof request.') }
        idempotency.set(key, { digest, sessionId: session.id })
        return send(response, 201, { session, simulation: true })
      }
      const sessionMatch = /^\/api\/v1\/proof-sessions\/([0-9a-f-]{36})$/.exec(pathname)
      if (request.method === 'GET' && sessionMatch) {
        if (!options.development) throw new HttpError(503, 'Proof sessions are not configured.')
        const session = sessions.get(sessionMatch[1])
        if (!session) throw new HttpError(404, 'Proof session not found.')
        return send(response, 200, { session, simulation: true })
      }
      if (pathname.startsWith('/api/v1/')) throw new HttpError(503, 'This API needs authentication, storage, and verified integration before use.')
      if (request.method === 'GET' && await staticFile(pathname, response, options.distDirectory)) return
      throw new HttpError(404, 'Not found.')
    } catch (error) {
      const status = error instanceof HttpError || error instanceof PrimusError ? error.status : 500
      const body: { error: string; reasonCode?: string } = { error: error instanceof HttpError || error instanceof PrimusError ? error.message : 'Internal error.' }
      if (options.development && process.env.ATTESTDOCK_DEV_MODE === '1' && process.env.NODE_ENV !== 'production' &&
        request.method === 'POST' && request.url?.split('?')[0] === '/api/v1/primus/verify' &&
        error instanceof PrimusError && error.reasonCode) body.reasonCode = error.reasonCode
      send(response, status, body)
    }
  })
}
