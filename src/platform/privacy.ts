import type { ProofTemplate } from './types.ts'

export type DisclosurePreview =
  | { available: false; message: string; fields: [] }
  | { available: true; message: string; fields: string[] }

export function disclosurePreview(template?: ProofTemplate): DisclosurePreview {
  if (!template || template.status !== 'active') {
    return { available: false, message: 'No approved template is active. Exact disclosures are not known.', fields: [] }
  }
  return { available: true, message: 'Review these fields before you consent.', fields: [...template.disclosedFields] }
}
