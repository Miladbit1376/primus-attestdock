import { randomBytes, randomUUID } from 'node:crypto'
import { ethers } from 'ethers'
import { PrimusZKTLS } from '@primuslabs/zktls-js-sdk'

export const X_TEMPLATE_ID = '2e3160ae-8b1e-45e3-8c59-426366278b9d'
const TTL_MS = 5 * 60_000
const COOKIE = 'attestdock_wallet_session'

export type PrimusReasonCode =
  | 'WALLET_AUTH_REQUIRED' | 'SESSION_NOT_FOUND' | 'SESSION_WALLET_MISMATCH' | 'SESSION_EXPIRED'
  | 'REQUEST_NOT_SIGNED' | 'REPLAY_DETECTED' | 'ATTESTATION_STRUCTURE'
  | 'CONDITIONS_FORMAT' | 'CONDITIONS_STRING_ENCODING' | 'CONDITIONS_TOP_LEVEL_TYPE'
  | 'CONDITIONS_MULTIPLE_ITEMS' | 'CONDITIONS_ENTRY_TYPE'
  | 'CONDITIONS_OPERATOR_MISMATCH' | 'CONDITIONS_FIELD_MISMATCH'
  | 'CONDITIONS_REVEAL_ID_MISSING' | 'CONDITIONS_REVEAL_ID_MISMATCH'
  | 'CONDITIONS_UNKNOWN_PROPERTY' | 'WALLET_BINDING'
  | 'ADDITION_PARAMS_FORMAT' | 'SESSION_BINDING_MISSING' | 'SESSION_BINDING'
  | 'NONCE_MISSING' | 'NONCE_MISMATCH' | 'ADDITION_PARAMS_DUPLICATE_KEYS'
  | 'ADDITION_PARAMS_ALGORITHM_MISMATCH'
  | 'ADDITION_PARAMS_UNEXPECTED_FIELDS'
  | 'TIMESTAMP_FORMAT' | 'TIMESTAMP_OUT_OF_WINDOW' | 'SOURCE_FORMAT' | 'SOURCE_MISMATCH'
  | 'TEMPLATE_FIELD_MISMATCH' | 'SCREEN_NAME_FORMAT' | 'SCREEN_NAME_MISSING' | 'SCREEN_NAME_MISMATCH'
  | 'SDK_VERIFY_ERROR' | 'SDK_SIGNATURE_INVALID' | 'VERIFY_INTERNAL'

const verificationError = 'The X proof failed server verification. Check the account, session, and extension result.'

export class PrimusError extends Error {
  constructor(readonly status: number, message: string, readonly reasonCode?: PrimusReasonCode) { super(message) }
}


type Attestation = Parameters<PrimusZKTLS['verifyAttestation']>[0]
type Pending = { wallet: string; handle: string; nonce: string; createdAt: number; expiresAt: number; signed: boolean; used: boolean; verified: boolean; verifiedAt?: number }
type Challenge = { wallet: string; message: string; expiresAt: number }
type WalletSession = { wallet: string; expiresAt: number }

function text(value: unknown, limit: number): string {
  return typeof value === 'string' && value.length <= limit ? value : ''
}
function address(value: unknown): string {
  try { return ethers.utils.getAddress(value as string) } catch { throw new PrimusError(400, 'A valid EVM wallet address is required.') }
}
function token(): string { return randomBytes(32).toString('hex') }
function equalHandle(a: string, b: string): boolean { return a.replace(/^@/, '').toLowerCase() === b.replace(/^@/, '').toLowerCase() }
function conditionMismatchReason(value: unknown, response: { keyName: string; parsePath: string }): PrimusReasonCode | undefined {
  if (typeof value === 'string') return 'CONDITIONS_STRING_ENCODING'
  if (!Array.isArray(value)) return 'CONDITIONS_TOP_LEVEL_TYPE'
  if (value.length !== 1) return 'CONDITIONS_MULTIPLE_ITEMS'
  const entry: unknown = value[0]
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'CONDITIONS_ENTRY_TYPE'
  const condition = entry as Record<string, unknown>
  if (condition.op !== 'REVEAL_STRING') return 'CONDITIONS_OPERATOR_MISMATCH'
  if (condition.field !== '$.screen_name' || condition.field !== response.parsePath) return 'CONDITIONS_FIELD_MISMATCH'
  if (!Object.prototype.hasOwnProperty.call(condition, 'reveal_id')) return 'CONDITIONS_REVEAL_ID_MISSING'
  if (condition.reveal_id !== 'screen_name' || condition.reveal_id !== response.keyName) return 'CONDITIONS_REVEAL_ID_MISMATCH'
  const keys = Object.keys(condition)
  if (keys.length !== 3 || keys.some(key => key !== 'op' && key !== 'field' && key !== 'reveal_id')) return 'CONDITIONS_UNKNOWN_PROPERTY'
  return undefined
}

export class PrimusXFlow {
  private readonly challenges = new Map<string, Challenge>()
  private readonly wallets = new Map<string, WalletSession>()
  private readonly proofs = new Map<string, Pending>()
  private sdk?: PrimusZKTLS
  constructor(private readonly config: { appId: string; appSecret: string }, private readonly clock: () => number = Date.now, private readonly sdkFactory: () => PrimusZKTLS = () => new PrimusZKTLS()) {}

  get enabled(): boolean { return Boolean(this.config.appId && this.config.appSecret) }
  get publicConfig(): { enabled: boolean; appId: string; templateId: string } {
    return { enabled: this.enabled, appId: this.enabled ? this.config.appId : '', templateId: X_TEMPLATE_ID }
  }
  private requireEnabled(): void { if (!this.enabled) throw new PrimusError(503, 'Primus App ID and App Secret are not configured on the local server.') }
  private async primus(): Promise<PrimusZKTLS> {
    this.requireEnabled()
    if (!this.sdk) {
      const sdk = this.sdkFactory()
      await sdk.init(this.config.appId, this.config.appSecret)
      this.sdk = sdk
    }
    return this.sdk
  }
  challenge(walletInput: unknown): { challengeId: string; message: string } {
    this.requireEnabled()
    const wallet = address(walletInput)
    const challengeId = randomUUID()
    const nonce = token()
    const expiresAt = this.clock() + 2 * 60_000
    const message = `AttestDock local wallet sign-in\nWallet: ${wallet}\nNonce: ${nonce}\nExpires: ${new Date(expiresAt).toISOString()}\nThis signature does not authorize a transaction.`
    this.challenges.set(challengeId, { wallet, message, expiresAt })
    return { challengeId, message }
  }
  authenticate(challengeId: unknown, signature: unknown): { wallet: string; cookie: string } {
    this.requireEnabled()
    const id = text(challengeId, 40)
    const challenge = this.challenges.get(id)
    this.challenges.delete(id)
    if (!challenge || this.clock() > challenge.expiresAt || !text(signature, 200)) throw new PrimusError(401, 'Wallet challenge is invalid or expired.')
    let signer: string
    try { signer = ethers.utils.verifyMessage(challenge.message, signature as string) } catch { throw new PrimusError(401, 'Wallet signature is invalid.') }
    if (address(signer) !== challenge.wallet) throw new PrimusError(401, 'Wallet signature does not match the requested address.')
    const session = token()
    this.wallets.set(session, { wallet: challenge.wallet, expiresAt: this.clock() + 15 * 60_000 })
    return { wallet: challenge.wallet, cookie: `${COOKIE}=${session}; HttpOnly; SameSite=Strict; Path=/api/v1/primus; Max-Age=900` }
  }
  wallet(cookieHeader: string | undefined): string {
    this.requireEnabled()
    const match = new RegExp(`(?:^|;\\s*)${COOKIE}=([0-9a-f]{64})(?:;|$)`).exec(cookieHeader ?? '')
    const session = match && this.wallets.get(match[1])
    if (!session || this.clock() >= session.expiresAt) throw new PrimusError(401, 'Connect and sign in with your wallet first.', 'WALLET_AUTH_REQUIRED')
    return session.wallet
  }
  create(wallet: string, handleInput: unknown): { sessionId: string; nonce: string; expiresAt: string } {
    this.requireEnabled()
    const handle = text(handleInput, 16).replace(/^@/, '')
    if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) throw new PrimusError(400, 'Enter a valid X username.')
    const sessionId = randomUUID()
    const nonce = token()
    const createdAt = this.clock()
    const expiresAt = createdAt + TTL_MS
    this.proofs.set(sessionId, { wallet, handle, nonce, createdAt, expiresAt, signed: false, used: false, verified: false })
    return { sessionId, nonce, expiresAt: new Date(expiresAt).toISOString() }
  }
  listVerified(wallet: string): { sessionId: string; handle: string; verifiedAt: string }[] {
    return [...this.proofs.entries()]
      .filter(([, proof]) => proof.wallet === wallet && proof.verified && proof.verifiedAt !== undefined)
      .sort((a, b) => b[1].verifiedAt! - a[1].verifiedAt!)
      .slice(0, 20)
      .map(([sessionId, proof]) => ({ sessionId, handle: proof.handle, verifiedAt: new Date(proof.verifiedAt!).toISOString() }))
  }
  private proof(sessionId: unknown, wallet: string): Pending {
    const id = text(sessionId, 40)
    const proof = this.proofs.get(id)
    if (!proof) throw new PrimusError(404, 'Proof session is missing or expired.', 'SESSION_NOT_FOUND')
    if (proof.wallet !== wallet) throw new PrimusError(404, 'Proof session is missing or expired.', 'SESSION_WALLET_MISMATCH')
    if (this.clock() >= proof.expiresAt) throw new PrimusError(404, 'Proof session is missing or expired.', 'SESSION_EXPIRED')
    return proof
  }
  async sign(wallet: string, sessionId: unknown, serialized: unknown): Promise<{ signedRequest: string }> {
    const proof = this.proof(sessionId, wallet)
    if (proof.signed || proof.used) throw new PrimusError(409, 'This proof request was already signed.')
    const raw = text(serialized, 4096)
    let request: Record<string, unknown>
    try { request = JSON.parse(raw) as Record<string, unknown> } catch { throw new PrimusError(400, 'Invalid serialized attestation request.') }
    const expectedAddition = JSON.stringify({ sessionId, nonce: proof.nonce, algorithmType: 'proxytls' })
    const allowed = new Set(['appId', 'attTemplateID', 'userAddress', 'timestamp', 'attMode', 'requestid', 'backUrl', 'computeMode', 'extendedParams', 'noProxy', 'allJsonResponseFlag', 'additionParams'])
    if (!request || typeof request !== 'object' || Array.isArray(request) || Object.keys(request).some(key => !allowed.has(key)) ||
      request.appId !== this.config.appId || request.attTemplateID !== X_TEMPLATE_ID || request.userAddress !== wallet ||
      request.additionParams !== expectedAddition || typeof request.timestamp !== 'number' ||
      Math.abs(this.clock() - request.timestamp) > 60_000 || typeof request.requestid !== 'string' || !/^[0-9a-f-]{36}$/i.test(request.requestid) ||
      JSON.stringify(request.attMode) !== JSON.stringify({ algorithmType: 'proxytls', resultType: 'plain' }) ||
      request.backUrl !== '' || request.computeMode !== 'normal' || request.extendedParams !== '' || request.noProxy !== true || request.allJsonResponseFlag !== 'false') {
      throw new PrimusError(400, 'Attestation request does not match the approved X template and session.')
    }
    proof.signed = true
    try { return { signedRequest: await (await this.primus()).sign(raw) } }
    catch { proof.signed = false; throw new PrimusError(502, 'Primus signing failed.') }
  }
  async verify(wallet: string, sessionId: unknown, value: unknown): Promise<{ verified: true; handle: string; wallet: string }> {
    const proof = this.proof(sessionId, wallet)
    if (proof.used) throw new PrimusError(409, 'This proof session is not ready or was already used.', 'REPLAY_DETECTED')
    if (!proof.signed) throw new PrimusError(409, 'This proof session is not ready or was already used.', 'REQUEST_NOT_SIGNED')
    proof.used = true
    const fail = (reasonCode: PrimusReasonCode): never => { throw new PrimusError(422, verificationError, reasonCode) }
    try {
      const att = value as Attestation
      if (!att || typeof att !== 'object' || Array.isArray(att) ||
        !Array.isArray(att.signatures) || att.signatures.length !== 1 || typeof att.signatures[0] !== 'string' ||
        !Array.isArray(att.attestors) || att.attestors.length !== 1 ||
        !att.request || typeof att.request !== 'object' || typeof att.request.method !== 'string' ||
        typeof att.request.body !== 'string' || typeof att.request.url !== 'string' ||
        typeof att.attConditions !== 'string') fail('ATTESTATION_STRUCTURE')

      if (!Array.isArray(att.reponseResolve) || att.reponseResolve.length !== 1 ||
        !att.reponseResolve[0] || att.reponseResolve[0].keyName !== 'screen_name' ||
        att.reponseResolve[0].parsePath !== '$.screen_name') fail('TEMPLATE_FIELD_MISMATCH')

      let conditions: unknown
      try { conditions = att.attConditions === '' ? [] : JSON.parse(att.attConditions) }
      catch { fail('CONDITIONS_FORMAT') }
      // The signed request sets no conditions. Require the confirmed template reveal.
      const conditionReason = conditionMismatchReason(conditions, att.reponseResolve[0])
      if (conditionReason) fail(conditionReason)

      const recipient = (() => {
        try { return ethers.utils.getAddress(att.recipient) }
        catch { return fail('WALLET_BINDING') }
      })()
      if (recipient !== wallet) fail('WALLET_BINDING')

      if (typeof att.additionParams !== 'string') fail('ADDITION_PARAMS_FORMAT')
      let addition: unknown
      try { addition = JSON.parse(att.additionParams) }
      catch { fail('ADDITION_PARAMS_FORMAT') }
      if (!addition || typeof addition !== 'object' || Array.isArray(addition)) fail('ADDITION_PARAMS_FORMAT')
      const binding = addition as Record<string, unknown>
      // JSON.parse keeps the last value of a duplicate key. Reject duplicates before comparing bindings.
      if ((att.additionParams.match(/"sessionId"\s*:/g) ?? []).length > 1 ||
        (att.additionParams.match(/"nonce"\s*:/g) ?? []).length > 1 ||
        (att.additionParams.match(/"algorithmType"\s*:/g) ?? []).length > 1) fail('ADDITION_PARAMS_DUPLICATE_KEYS')
      if (!Object.prototype.hasOwnProperty.call(binding, 'sessionId')) fail('SESSION_BINDING_MISSING')
      if (binding.sessionId !== sessionId) fail('SESSION_BINDING')
      if (!Object.prototype.hasOwnProperty.call(binding, 'nonce')) fail('NONCE_MISSING')
      if (binding.nonce !== proof.nonce) fail('NONCE_MISMATCH')
      if (binding.algorithmType !== 'proxytls') fail('ADDITION_PARAMS_ALGORITHM_MISMATCH')
      if (Object.keys(binding).some(key => key !== 'sessionId' && key !== 'nonce' && key !== 'algorithmType'))
        fail('ADDITION_PARAMS_UNEXPECTED_FIELDS')
      const timestampText = String(att.timestamp)
      if (!/^\d{13}$/.test(timestampText)) fail('TIMESTAMP_FORMAT')
      const timestamp = Number(timestampText)
      if (!Number.isSafeInteger(timestamp) || timestamp < proof.createdAt - 60_000 ||
        timestamp > this.clock() + 60_000 || timestamp > proof.expiresAt) fail('TIMESTAMP_OUT_OF_WINDOW')

      if (att.request.method.toUpperCase() !== 'GET' || att.request.body !== '') fail('SOURCE_MISMATCH')
      const url = (() => {
        try { return new URL(att.request.url) }
        catch { return fail('SOURCE_FORMAT') }
      })()
      if (url.protocol !== 'https:' || url.hostname !== 'api.x.com' ||
        url.pathname !== '/1.1/account/settings.json' || url.username || url.password || url.hash) fail('SOURCE_MISMATCH')

      let data: unknown
      try { data = JSON.parse(att.data) }
      catch { fail('SCREEN_NAME_FORMAT') }
      const screenName = typeof data === 'object' && data !== null && 'screen_name' in data
        ? (data as { screen_name: unknown }).screen_name : data
      if (typeof screenName !== 'string') fail('SCREEN_NAME_MISSING')
      if (!equalHandle(screenName as string, proof.handle)) fail('SCREEN_NAME_MISMATCH')

      const signatureValid = await (async () => {
        try { return (await this.primus()).verifyAttestation(att) }
        catch { return fail('SDK_VERIFY_ERROR') }
      })()
      if (!signatureValid) fail('SDK_SIGNATURE_INVALID')
      proof.verified = true
      proof.verifiedAt = this.clock()
      return { verified: true, handle: proof.handle, wallet }
    } catch (error) {
      if (error instanceof PrimusError) throw error
      throw new PrimusError(422, verificationError, 'VERIFY_INTERNAL')
    }
  }
}
