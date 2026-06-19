import { supabase } from './supabaseClient'
import type {
  OutcomeInsert,
  TaskInsert,
  RiskScore,
  RiskLevel,
} from './database.types'

// ---------- Outcomes ----------
export const seedOutcomes: OutcomeInsert[] = [
  {
    outcome_number: 1,
    title: 'Education & Prevention',
    description:
      'Increase awareness of labour rights and safe migration pathways among workers in high-risk sectors.',
    color: '#0EA5C9', // ocean
  },
  {
    outcome_number: 2,
    title: 'Community Level Prevention',
    description:
      'Improve victim identification and response capacity among migrant communities, grassroots stakeholders and civil society.',
    color: '#F97316', // coral
  },
  {
    outcome_number: 3,
    title: 'Access to Remedy',
    description:
      'Facilitate higher rates of legal remediation and enforcement against perpetrators for workers facing abuse or wage theft.',
    color: '#6EE7B7', // seafoam
  },
  {
    outcome_number: 4,
    title: 'Research',
    description:
      'Generate critical insights into emerging transnational crime, specifically trafficking into forced scam compounds, to inform policy and advocacy.',
    color: '#F59E0B', // amber
  },
]

// ---------- Tasks (one reference task per outcome) ----------
// `outcome_id` is filled in at seed time after outcomes are inserted.
type SeedTaskTemplate = Omit<TaskInsert, 'outcome_id'> & { outcome_number: number }

export const seedTaskTemplates: SeedTaskTemplate[] = [
  {
    outcome_number: 1,
    title: 'Digital Awareness Campaign',
    description:
      'Share actionable migration information through social media posts, videos and content across multiple platforms.',
    owner: 'Comms Team',
    year_range: 'Y1–Y3',
    target_kpi: '600,000 individuals reached; 3,000 posts published',
    status: 'Not Started',
    percent_complete: 0,
    start_date: null,
    end_date: null,
    notes: null,
  },
  {
    outcome_number: 2,
    title: 'Community Partner Training',
    description:
      'Train grassroots CSO partners and community advocates to identify and prevent worker exploitation.',
    owner: 'Programs',
    year_range: 'Y1–Y2',
    target_kpi: '15–20 partners upskilled; 50 advocates trained',
    status: 'Not Started',
    percent_complete: 0,
    start_date: null,
    end_date: null,
    notes: null,
  },
  {
    outcome_number: 3,
    title: 'Case Management & Legal Support',
    description:
      'Provide direct assistance to migrant workers facing exploitation including complaints filing, repatriation and legal proceedings.',
    owner: 'Case Management / Legal',
    year_range: 'Y1–Y3',
    target_kpi: '6,000 workers assisted; 1,200 complaints filed; 150 repatriated',
    status: 'Not Started',
    percent_complete: 0,
    start_date: null,
    end_date: null,
    notes: null,
  },
  {
    outcome_number: 4,
    title: 'Scam Compound Trafficking Research',
    description:
      'Conduct literature review, survivor interviews, case studies and key informant interviews to produce a published research report.',
    owner: 'Research',
    year_range: 'Y1–Y3',
    target_kpi: '1 published research report; disseminated to 3+ stakeholder groups',
    status: 'Not Started',
    percent_complete: 0,
    start_date: null,
    end_date: null,
    notes: null,
  },
]

// ---------- Risk level helper (decision #3b: compute client-side, persist) ----------
// Standard 3x3 risk matrix.
const RISK_MATRIX: Record<RiskScore, Record<RiskScore, RiskLevel>> = {
  H: { H: 'High',   M: 'High',   L: 'Medium' },
  M: { H: 'High',   M: 'Medium', L: 'Low'    },
  L: { H: 'Medium', M: 'Low',    L: 'Low'    },
}

export function computeRiskLevel(
  likelihood: RiskScore | null,
  impact: RiskScore | null,
): RiskLevel | null {
  if (!likelihood || !impact) return null
  return RISK_MATRIX[likelihood][impact]
}

// ---------- Idempotent seed runner ----------
// Returns true if seeding ran, false if the database already had data.
export async function seedDatabase(): Promise<boolean> {
  const { count, error: countError } = await supabase
    .from('outcomes')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    // eslint-disable-next-line no-console
    console.error('[seed] Could not check outcomes table:', countError)
    throw countError
  }

  if (count && count > 0) return false

  // 1. Insert outcomes, return the inserted rows so we can map outcome_number -> id.
  const { data: insertedOutcomes, error: outcomesError } = await supabase
    .from('outcomes')
    .insert(seedOutcomes)
    .select('id, outcome_number')

  if (outcomesError) {
    // eslint-disable-next-line no-console
    console.error('[seed] Failed to insert outcomes:', outcomesError)
    throw outcomesError
  }

  const idByNumber = new Map<number, string>()
  for (const row of insertedOutcomes ?? []) {
    idByNumber.set(row.outcome_number, row.id)
  }

  // 2. Build task rows with resolved outcome_id and insert.
  const taskRows: TaskInsert[] = seedTaskTemplates.map(({ outcome_number, ...rest }) => {
    const outcome_id = idByNumber.get(outcome_number)
    if (!outcome_id) {
      throw new Error(`[seed] No outcome found for number ${outcome_number}`)
    }
    return { ...rest, outcome_id }
  })

  const { error: tasksError } = await supabase.from('tasks').insert(taskRows)
  if (tasksError) {
    // eslint-disable-next-line no-console
    console.error('[seed] Failed to insert tasks:', tasksError)
    throw tasksError
  }

  return true
}
