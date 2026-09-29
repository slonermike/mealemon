import { put, get, del } from '@vercel/blob'
import type { Plan, PlanIndex } from './schema'

const CURRENT_VERSION = 1

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

export async function readPlan(id: string): Promise<Plan | null> {
  const raw = await readBlob<Record<string, unknown>>(`plans/${id}.json`)
  if (!raw) return null
  return raw as unknown as Plan
}

export async function writePlan(plan: Plan): Promise<void> {
  await writeBlob(`plans/${plan.id}.json`, { ...plan, schema_version: CURRENT_VERSION })
}

export async function deletePlanBlob(id: string): Promise<void> {
  const blob = await get(`plans/${id}.json`, { access: 'private', useCache: false })
  if (blob?.url) await del(blob.url)
}

export async function readPlanIndex(): Promise<PlanIndex> {
  const raw = await readBlob<Record<string, unknown>>('plans/index.json')
  if (!raw) return { schema_version: CURRENT_VERSION, plans: [] }
  const version = typeof raw.schema_version === 'number' ? raw.schema_version : 0
  if (version < 1) return { schema_version: CURRENT_VERSION, plans: [] }
  return raw as unknown as PlanIndex
}

export async function writePlanIndex(index: PlanIndex): Promise<void> {
  await writeBlob('plans/index.json', { ...index, schema_version: CURRENT_VERSION })
}

export function defaultPlanLabel(): string {
  return `Plan Created ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}
