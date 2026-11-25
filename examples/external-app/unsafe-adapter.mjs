import { target } from './adapter.mjs'

export { target }

export function createAdapter() {
  return { decide: attestation => attestation.recipient.toLowerCase() === target.recipient.toLowerCase() }
}
