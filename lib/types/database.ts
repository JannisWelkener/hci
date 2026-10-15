export type Profile = {
  id: string
  email: string
  full_name: string
  role: 'student' | 'instructor'
  created_at: string
  updated_at: string
  display_name?: string | null
  avatar_url?: string | null
}

// ISO 9241-210 phases
export type IsoPhase =
  | 'understand_context'
  | 'specify_requirements'
  | 'produce_design_solutions'
  | 'evaluate_against_requirements'

export type PhaseStatusValue = 'not_started' | 'in_progress' | 'completed'

export type PhaseStatus = {
  understand_context: PhaseStatusValue
  specify_requirements: PhaseStatusValue
  produce_design_solutions: PhaseStatusValue
  evaluate_against_requirements: PhaseStatusValue
}

export type MemberRole = 'owner' | 'editor' | 'viewer' | 'member'

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  current_phase: IsoPhase
  start_date: string // ISO date format
  phase_status: PhaseStatus
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: MemberRole
  joined_at: string
  created_at: string
  updated_at: string
}

export interface ProjectMemberWithProfile extends ProjectMember {
  profile: Profile
}

export interface ProjectWithMembers extends Project {
  members?: ProjectMemberWithProfile[]
}

// Project Invitation types
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked'

export interface ProjectInvitation {
  id: string
  project_id: string
  inviter_id: string
  invitee_email: string
  token: string
  status: InvitationStatus
  role: MemberRole
  invited_at: string
  expires_at: string
  accepted_at: string | null
  created_at: string
  updated_at: string
  message: string | null
  project_name: string | null
  project_description: string | null
  inviter_name: string | null
  inviter_email: string | null
}

export interface ProjectInvitationWithInviter extends ProjectInvitation {
  inviter: Profile
  project?: Project
}

// Persona type
export interface Persona {
  id: string               // uuid
  project_id: string       // uuid

  photo_url?: string | null // text

  name: string             // text
  role?: string | null             // text

  age?: number | null      // integer
  occupation?: string | null // text
  location?: string | null //text
  gender?: string | null  //text
  relationship_status?: string | null //text
  education?: string | null

  buzzwords?: string[] | null  // text[]

  personality_01: number //integer
  personality_02: number //integer
  personality_03: number //integer
  personality_04: number //integer

  motivation?: string | null //text
  goals?: string[] | null  // text[]
  pain_points?: string[] | null // text[]

  skill_01: number //integer
  skill_02: number //integer
  skill_03: number //integer

  metadata?: Record<string, any> | null // jsonb
  created_at: string       // timestamp with time zone
  updated_at: string       // timestamp with time zone
  created_by: string       // uuid
}


// User Story type
export type UserStoryPriority = 'low' | 'medium' | 'high' | 'critical'
export type UserStoryStatus = 'backlog' | 'in_progress' | 'done'
export type GenerationMethod = 'manual' | 'ai_generated'

export interface UserStory {
  id: string
  project_id: string
  title: string
  user_role: string
  action: string
  benefit: string
  description?: string | null
  acceptance_criteria?: string[] | null
  priority?: UserStoryPriority | null
  priority_order: number
  status?: UserStoryStatus | null
  story_points?: number | null
  generation_method: GenerationMethod
  dependencies: string[]
  created_at: string
  updated_at: string
  created_by: string
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  data: T | null
  error: {
    message: string
    code?: string
  } | null
}

// Pagination
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

// --- Mockup Types (Phase 2) ---

// (Action Item 5) Type for the mockup category
export type MockupType = 'design' | 'prototype' | 'figjam';

// (Action Item 2) Main Mockup interface (matches the database table)
export interface Mockup {
  id: string; // uuid
  project_id: string; // uuid
  creator_id: string; // uuid
  title: string;
  description: string | null;
  figma_url: string;
  figma_embed_url: string;
  type: MockupType;
  created_at: string; // timestamp
}

// (Action Item 3) Data needed to create a new mockup (for UI forms)
export type CreateMockupData = Pick<
  Mockup,
  'title' | 'description' | 'figma_url' | 'type'
>;

// (Action Item 4) Data needed to update a mockup (all fields optional)
export type UpdateMockupData = Partial<CreateMockupData>;

// --- Wireframes (Phase 2) ---

export interface Wireframe {
  id: string
  project_id: string
  title: string
  description: string | null
  type: 'upload' | 'figma'
  file_type: 'image' | 'pdf' | 'figma'
  file_path: string | null
  figma_url: string | null
  figma_embed_url: string | null
  version: number
  user_story_id: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export type CreateWireframeData = {
  title: string
  description?: string
  type: 'upload' | 'figma'
  file?: File
  figma_url?: string
  version?: number
  user_story_id?: string
}

export type UpdateWireframeData = {
  title?: string
  description?: string
  user_story_id?: string
}

// --- End of Mockup Types ---

// --- User Journey Map Types ---

// Journey stage structure
export interface JourneyStage {
  name: string;
  description: string;
  actions: string[];
  thoughts: string[];
  emotions: number; // 1-5 rating (1=very negative, 5=very positive)
  painPoints: string[];
  opportunities: string[]; // Solution approaches for each pain point
  touchpoints: string[];
}

// Main User Journey Map interface (matches database table)
export interface UserJourneyMap {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  persona_id: string; // Required: exactly 1 persona (FK to personas)
  ai_optimize_timeline: boolean; // Whether AI was allowed to optimize timeline order
  stages: JourneyStage[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

// User Journey Map Timeline entry (junction table)
export interface UserJourneyMapTimeline {
  id: string;
  journey_map_id: string; // FK to user_journey_maps
  user_story_id: string; // FK to user_stories
  position: number; // Zero-based position in timeline
  created_at: string;
}

// Extended User Journey Map with timeline (for UI display)
export interface UserJourneyMapWithTimeline extends UserJourneyMap {
  timeline: UserJourneyMapTimeline[];
  // Optionally include the actual user stories for convenience
  user_stories?: UserStory[];
}

// Data needed to create a new user journey map
export interface CreateUserJourneyMapData {
  title: string;
  description: string | null;
  persona_id: string;
  ai_optimize_timeline: boolean;
  stages: JourneyStage[];
  // Timeline is provided as an ordered array of user story IDs
  timeline: string[]; // Array of user_story_ids in order
}

// Data needed to update a user journey map
export interface UpdateUserJourneyMapData {
  title?: string;
  description?: string | null;
  ai_optimize_timeline?: boolean;
  stages?: JourneyStage[];
  // Timeline can be updated by providing a new ordered array
  timeline?: string[]; // Array of user_story_ids in order
}

// --- End of User Journey Map Types ---

// --- Notification Types ---

export type EntityType = 'journey_map' | 'persona' | 'user_story' | 'prototype' | 'mockup' | 'wireframe'
export type NotificationAction = 'created' | 'updated' | 'deleted'

export interface Notification {
  id: string
  user_id: string
  creator_id: string
  project_id: string
  entity_type: EntityType
  entity_count: number
  action: NotificationAction
  created_at: string
  read: boolean
  entity_id: string | null
  entity_name: string | null
}

// Extended notification with denormalized data for display
export interface NotificationWithDetails extends Notification {
  creator_name: string
  project_name: string
}

// --- End of Notification Types ---

// --- UX Vision Types ---

export interface UXVision {
  id: string
  project_id: string
  vision: string
  created_at: string
  updated_at: string
  created_by: string
}

export type CreateUXVisionData = {
  vision: string
}

export type UpdateUXVisionData = {
  vision?: string
}

// --- End of UX Vision Types ---

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
      }
      project_members: {
        Row: ProjectMember
        Insert: Omit<ProjectMember, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProjectMember, 'id' | 'created_at' | 'updated_at'>>
      }
      project_invitations: {
        Row: ProjectInvitation
        Insert: Omit<ProjectInvitation, 'id' | 'created_at' | 'updated_at' | 'invited_at' | 'accepted_at' | 'project_name' | 'project_description' | 'inviter_name' | 'inviter_email'>
        Update: Partial<Omit<ProjectInvitation, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'invitee_email' | 'token' | 'inviter_id'>>
      }
      personas: {
        Row: Persona
        Insert: Omit<Persona, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Persona, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'created_by'>>
      }
      user_stories: {
        Row: UserStory
        Insert: Omit<UserStory, 'id' | 'created_at' | 'updated_at'> & {
          description?: string | null
          priority_order?: number
          generation_method?: GenerationMethod
          dependencies?: string[]
        }
        Update: Partial<Omit<UserStory, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'created_by'>>
      }

      // (Action Item 6) Add mockups table definition to Supabase types
      mockups: {
        Row: Mockup;
        Insert: Omit<Mockup, 'id' | 'created_at' | 'figma_embed_url'>;
        Update: Partial<Omit<Mockup, 'id' | 'created_at' | 'project_id' | 'creator_id' | 'figma_embed_url'>>;
      },
      
      wireframes: {
        Row: Wireframe
        Insert: Omit<Wireframe, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Wireframe, 'id' | 'user_id' | 'project_id'>>
      }
      user_journey_maps: {
        Row: UserJourneyMap;
        Insert: Omit<UserJourneyMap, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserJourneyMap, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'created_by'>>;
      }
      user_journey_map_timeline: {
        Row: UserJourneyMapTimeline;
        Insert: Omit<UserJourneyMapTimeline, 'id' | 'created_at'>;
        Update: Partial<Omit<UserJourneyMapTimeline, 'id' | 'created_at' | 'journey_map_id'>>;
      }
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at' | 'user_id' | 'creator_id' | 'project_id'>>;
      }
      ux_visions: {
        Row: UXVision;
        Insert: Omit<UXVision, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UXVision, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'created_by'>>;
      }
    }
  }
}