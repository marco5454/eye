// Hand-written types mirroring supabase/migrations/001_initial_schema.sql.
// If you ever change the schema, update this file in the same commit.
//
// IMPORTANT: All shape declarations below use `type` aliases (not `interface`).
// Supabase v2.108's `RejectExcessProperties` mapped type on `.insert()` does
// not resolve correctly through interfaces — the inferred Row collapses to
// `never`. Type aliases preserve the structural identity. Do not switch these
// to interfaces without re-validating with `tsc`.

export type TaskStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed'
export type MilestoneStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Completed'
export type MilestoneType = 'Donor Report' | 'Internal' | 'Deliverable'
export type RiskScore = 'H' | 'M' | 'L'
export type RiskLevel = 'High' | 'Medium' | 'Low'

export type Outcome = {
  id: string
  outcome_number: number
  title: string
  description: string | null
  color: string | null
  created_at: string
}

export type Task = {
  id: string
  outcome_id: string | null
  title: string
  description: string | null
  owner: string | null
  year_range: string | null
  target_kpi: string | null
  start_date: string | null
  end_date: string | null
  percent_complete: number
  status: TaskStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type Output = {
  id: string
  outcome_id: string | null
  output_number: string
  description: string
  numeric_target: number | null
  target_label: string
  y1_actual: number
  y2_actual: number
  y3_actual: number
  is_ongoing: boolean
  created_at: string
  updated_at: string
}

export type Milestone = {
  id: string
  year: string
  title: string
  type: MilestoneType | null
  due_description: string | null
  due_date: string | null
  owner: string | null
  status: MilestoneStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type Risk = {
  id: string
  risk_number: number
  description: string
  category: string
  likelihood: RiskScore | null
  impact: RiskScore | null
  risk_level: RiskLevel | null
  mitigation_strategy: string | null
  owner: string | null
  created_at: string
  updated_at: string
}

// Insert payloads — DB-managed columns (id, timestamps) omitted.
export type OutcomeInsert = {
  outcome_number: number
  title: string
  description?: string | null
  color?: string | null
}

export type TaskInsert = {
  outcome_id?: string | null
  title: string
  description?: string | null
  owner?: string | null
  year_range?: string | null
  target_kpi?: string | null
  start_date?: string | null
  end_date?: string | null
  percent_complete?: number
  status?: TaskStatus
  notes?: string | null
}

export type OutputInsert = {
  outcome_id?: string | null
  output_number: string
  description: string
  numeric_target?: number | null
  target_label: string
  y1_actual?: number
  y2_actual?: number
  y3_actual?: number
  is_ongoing?: boolean
}

export type MilestoneInsert = {
  year: string
  title: string
  type?: MilestoneType | null
  due_description?: string | null
  due_date?: string | null
  owner?: string | null
  status?: MilestoneStatus
  notes?: string | null
}

export type RiskInsert = {
  risk_number: number
  description: string
  category: string
  likelihood?: RiskScore | null
  impact?: RiskScore | null
  risk_level?: RiskLevel | null
  mitigation_strategy?: string | null
  owner?: string | null
}

// Database shape consumed by `createClient<Database>(...)`.
export type Database = {
  public: {
    Tables: {
      outcomes: {
        Row: Outcome
        Insert: OutcomeInsert
        Update: Partial<OutcomeInsert>
        Relationships: []
      }
      tasks: {
        Row: Task
        Insert: TaskInsert
        Update: Partial<TaskInsert>
        Relationships: [
          {
            foreignKeyName: 'tasks_outcome_id_fkey'
            columns: ['outcome_id']
            referencedRelation: 'outcomes'
            referencedColumns: ['id']
          },
        ]
      }
      outputs: {
        Row: Output
        Insert: OutputInsert
        Update: Partial<OutputInsert>
        Relationships: [
          {
            foreignKeyName: 'outputs_outcome_id_fkey'
            columns: ['outcome_id']
            referencedRelation: 'outcomes'
            referencedColumns: ['id']
          },
        ]
      }
      milestones: {
        Row: Milestone
        Insert: MilestoneInsert
        Update: Partial<MilestoneInsert>
        Relationships: []
      }
      risks: {
        Row: Risk
        Insert: RiskInsert
        Update: Partial<RiskInsert>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
