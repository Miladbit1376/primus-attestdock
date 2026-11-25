export function createAccessDecision({ target, now, sessionId, nonce, verifySignature }) {
  let used = false
  return async function decide(attestation) {
    if (used || attestation.recipient.toLowerCase() !== target.recipient.toLowerCase()) return false
    if (attestation.request.url !== target.sourceUrl || attestation.request.method !== 'GET' || attestation.request.body !== '') return false
    const field = attestation.reponseResolve[0]
    if (field?.keyName !== target.field || field.parsePath !== `$.${target.field}`) return false
    let data, conditions, binding
    try {
      data = JSON.parse(attestation.data)
      conditions = JSON.parse(attestation.attConditions)
      binding = JSON.parse(attestation.additionParams)
    } catch { return false }
    if (data?.[target.field] !== target.value) return false
    if (conditions.length !== 1 || conditions[0]?.op !== 'REVEAL_STRING' ||
      conditions[0].field !== `$.${target.field}` || conditions[0].reveal_id !== target.field) return false
    if (binding?.sessionId !== sessionId || binding.nonce !== nonce) return false
    if (!Number.isSafeInteger(attestation.timestamp) || attestation.timestamp > now || now - attestation.timestamp > target.maxAgeMs) return false
    if (!verifySignature(attestation)) return false
    used = true
    return true
  }
}
