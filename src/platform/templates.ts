import { ProviderRegistry } from './providers.ts'
import type { ProofTemplate, ProviderId } from './types.ts'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export class TemplateRegistry {
  private readonly templates = new Map<string, ProofTemplate>()
  constructor(private readonly providers: ProviderRegistry, templates: ProofTemplate[] = []) {
    for (const template of templates) this.register(template)
  }
  register(template: ProofTemplate): void {
    if (!this.providers.getClaim(template.providerId, template.claimId)) throw new Error('Unknown provider claim.')
    if (!uuid.test(template.primusTemplateId)) throw new Error('A verified Primus template UUID is required.')
    if (!template.version.trim() || !template.id.trim()) throw new Error('Template ID and version are required.')
    if (template.disclosedFields.length === 0) throw new Error('Disclosed fields must be explicit.')
    if (this.templates.has(template.id)) throw new Error('Template ID already exists.')
    this.templates.set(template.id, { ...template, disclosedFields: [...template.disclosedFields], supportedConditions: [...template.supportedConditions] })
  }
  list(): ProofTemplate[] {
    return [...this.templates.values()].map(item => ({ ...item, disclosedFields: [...item.disclosedFields], supportedConditions: [...item.supportedConditions] }))
  }
  resolveActive(providerId: ProviderId, claimId: string): ProofTemplate | undefined {
    return this.list().find(item => item.providerId === providerId && item.claimId === claimId && item.status === 'active')
  }
  disable(id: string): void {
    const item = this.templates.get(id)
    if (!item) throw new Error('Unknown template.')
    this.templates.set(id, { ...item, status: 'disabled' })
  }
}

export const templateRegistry = new TemplateRegistry(new ProviderRegistry())
