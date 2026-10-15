// File: lib/utils/journey-map-templates.ts

import { JourneyStage } from '@/lib/types/database'

/**
 * Available stage names for selection
 */
export const AVAILABLE_STAGES = [
  'Awareness',
  'Consideration',
  'Decision',
  'Onboarding',
  'Regular Use',
  'Support & Growth',
] as const

export type StageName = typeof AVAILABLE_STAGES[number]

/**
 * Get a specific stage by name
 */
export function getStageByName(name: StageName): JourneyStage {
  const allStages = getAllAvailableStages()
  const stage = allStages.find((s) => s.name === name)
  if (!stage) {
    throw new Error(`Stage ${name} not found`)
  }
  return stage
}

/**
 * Get stages for selected stage names
 */
export function getStagesByNames(names: StageName[]): JourneyStage[] {
  return names.map(name => getStageByName(name))
}

/**
 * Returns all available journey stages with their full data
 */
function getAllAvailableStages(): JourneyStage[] {
  return [
    {
      name: 'Awareness',
      description: 'User becomes aware of a problem or need',
      actions: ['Searches online for solutions', 'Reads reviews and comparisons', 'Asks friends for recommendations'],
      thoughts: ['Is there a better solution?', 'What do others use?', 'How much will this cost?'],
      emotions: 2,
      painPoints: ['Too many options to choose from', 'Unclear pricing information', 'Conflicting reviews'],
      opportunities: ['Provide comparison tool with clear filters', 'Display transparent pricing upfront', 'Curate verified user testimonials'],
      touchpoints: ['Google Search', 'Social Media', 'Review Sites', 'Word of Mouth'],
    },
    {
      name: 'Consideration',
      description: 'User evaluates different options and compares features',
      actions: ['Compares features of different products', 'Checks pricing and plans', 'Watches demo videos'],
      thoughts: ['Which option fits my needs best?', 'Can I afford this?', 'Is this trustworthy?'],
      emotions: 3,
      painPoints: ['Difficult to compare features', 'Hidden costs', 'Information overload'],
      opportunities: ['Create side-by-side feature comparison', 'Show all-inclusive pricing calculator', 'Offer guided product finder'],
      touchpoints: ['Product Websites', 'Comparison Sites', 'YouTube', 'Documentation'],
    },
    {
      name: 'Decision',
      description: 'User makes the final decision to proceed',
      actions: ['Signs up for free trial', 'Creates account', 'Enters payment information'],
      thoughts: ['Am I making the right choice?', 'Can I cancel if needed?', 'Is my data safe?'],
      emotions: 3,
      painPoints: ['Complex signup process', 'Concerns about commitment', 'Privacy worries'],
      opportunities: ['Streamline to 3-step signup', 'Highlight easy cancellation policy', 'Display security certifications'],
      touchpoints: ['Signup Form', 'Email Verification', 'Payment Gateway'],
    },
    {
      name: 'Onboarding',
      description: 'User experiences the product for the first time',
      actions: ['Completes tutorial', 'Explores features', 'Sets up profile'],
      thoughts: ['How do I use this?', 'Where do I start?', 'Is this really helpful?'],
      emotions: 4,
      painPoints: ['Overwhelming number of features', 'Unclear next steps', 'Missing guidance'],
      opportunities: ['Create progressive feature disclosure', 'Add clear onboarding checklist', 'Provide contextual help guides'],
      touchpoints: ['Welcome Email', 'Tutorial', 'Help Center', 'In-App Tooltips'],
    },
    {
      name: 'Regular Use',
      description: 'User integrates the product into their routine',
      actions: ['Uses core features regularly', 'Invites team members', 'Explores advanced features'],
      thoughts: ['This is making my work easier', 'What else can I do with this?', 'Should I upgrade?'],
      emotions: 4,
      painPoints: ['Occasional bugs', 'Missing integrations', 'Feature limitations on current plan'],
      opportunities: ['Implement bug reporting widget', 'Build popular tool integrations', 'Show upgrade benefits in context'],
      touchpoints: ['Main Application', 'Mobile App', 'Email Notifications', 'Support Chat'],
    },
    {
      name: 'Support & Growth',
      description: 'User seeks help or discovers more value',
      actions: ['Contacts support', 'Upgrades plan', 'Refers friends'],
      thoughts: ['How can I solve this issue?', 'Is there more I can do?', 'Should I recommend this?'],
      emotions: 4,
      painPoints: ['Slow support response', 'Upgrade friction', 'Lack of advanced features'],
      opportunities: ['Add live chat with quick responses', 'Enable one-click plan upgrades', 'Develop advanced feature roadmap'],
      touchpoints: ['Support Portal', 'Community Forum', 'Upgrade Page', 'Referral Program'],
    },
  ]
}

/**
 * Returns a default set of journey stages as a template.
 * Users can use this as a starting point and customize it.
 * @deprecated Use getStagesByNames with AVAILABLE_STAGES instead
 */
export function getDefaultJourneyStages(): JourneyStage[] {
  return [
    {
      name: 'Awareness',
      description: 'User becomes aware of a problem or need',
      actions: ['Searches online for solutions', 'Reads reviews and comparisons', 'Asks friends for recommendations'],
      thoughts: ['Is there a better solution?', 'What do others use?', 'How much will this cost?'],
      emotions: 2, // Slightly negative (confused/uncertain)
      painPoints: ['Too many options to choose from', 'Unclear pricing information', 'Conflicting reviews'],
      opportunities: ['Provide comparison tool with clear filters', 'Display transparent pricing upfront', 'Curate verified user testimonials'],
      touchpoints: ['Google Search', 'Social Media', 'Review Sites', 'Word of Mouth'],
    },
    {
      name: 'Consideration',
      description: 'User evaluates different options and compares features',
      actions: ['Compares features of different products', 'Checks pricing and plans', 'Watches demo videos'],
      thoughts: ['Which option fits my needs best?', 'Can I afford this?', 'Is this trustworthy?'],
      emotions: 3, // Neutral (evaluating)
      painPoints: ['Difficult to compare features', 'Hidden costs', 'Information overload'],
      opportunities: ['Create side-by-side feature comparison', 'Show all-inclusive pricing calculator', 'Offer guided product finder'],
      touchpoints: ['Product Websites', 'Comparison Sites', 'YouTube', 'Documentation'],
    },
    {
      name: 'Decision',
      description: 'User makes the final decision to proceed',
      actions: ['Signs up for free trial', 'Creates account', 'Enters payment information'],
      thoughts: ['Am I making the right choice?', 'Can I cancel if needed?', 'Is my data safe?'],
      emotions: 3, // Neutral to slightly positive (hopeful but cautious)
      painPoints: ['Complex signup process', 'Concerns about commitment', 'Privacy worries'],
      opportunities: ['Streamline to 3-step signup', 'Highlight easy cancellation policy', 'Display security certifications'],
      touchpoints: ['Signup Form', 'Email Verification', 'Payment Gateway'],
    },
    {
      name: 'Onboarding',
      description: 'User experiences the product for the first time',
      actions: ['Completes tutorial', 'Explores features', 'Sets up profile'],
      thoughts: ['How do I use this?', 'Where do I start?', 'Is this really helpful?'],
      emotions: 4, // Positive (excited but slightly overwhelmed)
      painPoints: ['Overwhelming number of features', 'Unclear next steps', 'Missing guidance'],
      opportunities: ['Create progressive feature disclosure', 'Add clear onboarding checklist', 'Provide contextual help guides'],
      touchpoints: ['Welcome Email', 'Tutorial', 'Help Center', 'In-App Tooltips'],
    },
    {
      name: 'Regular Use',
      description: 'User integrates the product into their routine',
      actions: ['Uses core features regularly', 'Invites team members', 'Explores advanced features'],
      thoughts: ['This is making my work easier', 'What else can I do with this?', 'Should I upgrade?'],
      emotions: 4, // Positive (satisfied)
      painPoints: ['Occasional bugs', 'Missing integrations', 'Feature limitations on current plan'],
      opportunities: ['Implement bug reporting widget', 'Build popular tool integrations', 'Show upgrade benefits in context'],
      touchpoints: ['Main Application', 'Mobile App', 'Email Notifications', 'Support Chat'],
    },
    {
      name: 'Support & Growth',
      description: 'User seeks help or discovers more value',
      actions: ['Contacts support', 'Upgrades plan', 'Refers friends'],
      thoughts: ['How can I solve this issue?', 'Is there more I can do?', 'Should I recommend this?'],
      emotions: 4, // Positive (engaged)
      painPoints: ['Slow support response', 'Upgrade friction', 'Lack of advanced features'],
      opportunities: ['Add live chat with quick responses', 'Enable one-click plan upgrades', 'Develop advanced feature roadmap'],
      touchpoints: ['Support Portal', 'Community Forum', 'Upgrade Page', 'Referral Program'],
    },
  ]
}

/**
 * Returns a simplified template with fewer stages for quick start.
 */
export function getSimpleJourneyStages(): JourneyStage[] {
  return [
    {
      name: 'Discovery',
      description: 'User discovers the product or service',
      actions: ['Searches for solutions', 'Finds product'],
      thoughts: ['Is this what I need?'],
      emotions: 3,
      painPoints: ['Hard to find information'],
      opportunities: ['Improve SEO and content marketing'],
      touchpoints: ['Search Engine', 'Advertisement'],
    },
    {
      name: 'Evaluation',
      description: 'User evaluates if the product meets their needs',
      actions: ['Reads features', 'Checks pricing'],
      thoughts: ['Does this solve my problem?', 'Is it worth it?'],
      emotions: 3,
      painPoints: ['Unclear value proposition', 'Complex pricing'],
      opportunities: ['Clarify benefits with use cases', 'Simplify pricing structure'],
      touchpoints: ['Website', 'Product Page'],
    },
    {
      name: 'Purchase/Signup',
      description: 'User decides to purchase or sign up',
      actions: ['Creates account', 'Completes purchase'],
      thoughts: ['Am I making the right decision?'],
      emotions: 4,
      painPoints: ['Complicated checkout', 'Payment concerns'],
      opportunities: ['Simplify checkout flow', 'Add trusted payment badges'],
      touchpoints: ['Signup Form', 'Checkout'],
    },
    {
      name: 'Usage',
      description: 'User starts using the product',
      actions: ['Completes onboarding', 'Uses core features'],
      thoughts: ['How does this work?', 'Is this helpful?'],
      emotions: 4,
      painPoints: ['Learning curve', 'Missing features'],
      opportunities: ['Create interactive tutorials', 'Gather feature requests'],
      touchpoints: ['Onboarding Flow', 'Main App'],
    },
  ]
}
