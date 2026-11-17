import type { ClaimDefinition, ProviderDefinition, ProviderId } from './types.ts'

function claim(id: string, name: string, description: string): ClaimDefinition {
  return { id, name, description, candidate: true }
}

const candidates: ProviderDefinition[] = [
  { id: 'google', name: 'Google Account', description: 'Candidate account identity claims. Gmail inbox access is not included.', icon: 'G', connectionMethod: 'primus_extension', adapters: ['enterprise'], availability: 'template_pending', claims: [
    claim('account_identity', 'Account identity', 'Prove a supported account identity field.'),
    claim('account_email', 'Email address', 'Prove an email address only when a suitable template is approved.')
  ] },
  { id: 'discord', name: 'Discord', description: 'Candidate account claims. Server membership needs a separate verified template.', icon: 'D', connectionMethod: 'primus_extension', adapters: ['enterprise'], availability: 'template_pending', claims: [
    claim('account_identity', 'Account identity', 'Prove supported account identity fields.'),
    claim('account_status', 'Account status', 'Prove a supported status field.')
  ] },
  { id: 'x', name: 'X', description: 'Candidate account and public activity claims.', icon: 'X', connectionMethod: 'primus_extension', adapters: ['enterprise'], availability: 'template_pending', claims: [
    claim('account_ownership', 'Account ownership', 'Prove control of a supported account.'),
    claim('follower_information', 'Follower information', 'Prove a supported follower condition or field.'),
    claim('tweet_information', 'Tweet information', 'Prove a supported post field.')
  ] },
  { id: 'github', name: 'GitHub', description: 'Candidate public profile claims.', icon: 'GH', connectionMethod: 'primus_extension', adapters: ['enterprise'], availability: 'template_pending', claims: [
    claim('profile_identity', 'Profile identity', 'Prove a supported profile identifier.'),
    claim('public_profile', 'Public profile attributes', 'Prove selected public profile fields.')
  ] },
  { id: 'tiktok', name: 'TikTok', description: 'Candidate account attributes.', icon: 'T', connectionMethod: 'primus_extension', adapters: ['enterprise'], availability: 'template_pending', claims: [
    claim('account_identity', 'Account identity', 'Prove supported account identity fields.'),
    claim('account_attributes', 'Account attributes', 'Prove selected supported attributes.')
  ] }
]

function copy(provider: ProviderDefinition): ProviderDefinition {
  return { ...provider, adapters: [...provider.adapters], claims: provider.claims.map(item => ({ ...item })) }
}

export class ProviderRegistry {
  constructor(private readonly providers: ProviderDefinition[] = candidates) {}
  list(): ProviderDefinition[] { return this.providers.map(copy) }
  get(id: string): ProviderDefinition | undefined {
    const item = this.providers.find(provider => provider.id === id)
    return item ? copy(item) : undefined
  }
  getClaim(providerId: ProviderId, claimId: string): ClaimDefinition | undefined {
    return this.get(providerId)?.claims.find(item => item.id === claimId)
  }
}

export const providerRegistry = new ProviderRegistry()
