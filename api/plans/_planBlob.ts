import { put, get, del } from '@vercel/blob'
import type { Plan, PlanIndex } from '../../src/lib/schema'

const CURRENT_VERSION = 1

function indexPath() {
  return 'plans/index.json'
}

function planPath(id: string) {
  return `plans/${id}.json`
}

async function readBlob<T>(path: string): Promise<T | null> {
  const blob = await get(path, { access: 'private', useCache: false })
  if (!blob || !blob.stream) return null
  const chunks: Uint8Array[] = []
  for await (const chunk of blob.stream) chunks.push(chunk as Uint8Array)
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T
}

async function writeBlob(path: string, data: unknown): Promise<void> {
  await put(path, JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

function migratePlan(raw: Record<string, unknown>): Plan {
  const version = typeof raw.schema_version === 'number' ? raw.schema_version : 0
  if (version < 1) {
    return raw as unknown as Plan
  }
  return raw as unknown as Plan
}

function migratePlanIndex(raw: Record<string, unknown>): PlanIndex {
  const version = typeof raw.schema_version === 'number' ? raw.schema_version : 0
  if (version < 1) {
    return { schema_version: CURRENT_VERSION, plans: [] }
  }
  return raw as unknown as PlanIndex
}

export async function readPlan(id: string): Promise<Plan | null> {
  const raw = await readBlob<Record<string, unknown>>(planPath(id))
  if (!raw) return null
  return migratePlan(raw)
}

export async function writePlan(plan: Plan): Promise<void> {
  await writeBlob(planPath(plan.id), { ...plan, schema_version: CURRENT_VERSION })
}

export async function deletePlanBlob(id: string): Promise<void> {
  const blob = await get(planPath(id), { access: 'private', useCache: false })
  if (blob?.url) await del(blob.url)
}

export async function readPlanIndex(): Promise<PlanIndex> {
  const raw = await readBlob<Record<string, unknown>>(indexPath())
  if (!raw) return { schema_version: CURRENT_VERSION, plans: [] }
  return migratePlanIndex(raw)
}

export async function writePlanIndex(index: PlanIndex): Promise<void> {
  await writeBlob(indexPath(), { ...index, schema_version: CURRENT_VERSION })
}

export function defaultPlanLabel(): string {
  return `Plan Created ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}
