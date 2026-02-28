import { getPayload } from 'payload'
import payloadConfig from '@/payload.config'

export type RedirectDoc = {
  id: number | string
  from: string
  to: string
  statusCode?: '301' | '302' | string
  isEnabled?: boolean
}

export type RedirectIssueKind = 'self_redirect' | 'loop_risk' | 'chain_flatten'

export type RedirectIssue = {
  kind: RedirectIssueKind
  from: string
  to: string
  path?: string[]
  resolution: 'delete' | 'update' | 'manual_review'
  suggestedTo?: string
  id?: number | string
}

export type RedirectHygieneReport = {
  scanned: number
  applied: boolean
  deleted: number
  updated: number
  issues: RedirectIssue[]
}

function normalizePath(input: string): string {
  const value = String(input || '').trim()
  if (!value) return '/'
  if (/^https?:\/\//i.test(value)) return value
  return value.startsWith('/') ? value : `/${value}`
}

function buildIndex(rows: RedirectDoc[]): Map<string, RedirectDoc> {
  const map = new Map<string, RedirectDoc>()
  for (const row of rows) {
    const from = normalizePath(row.from)
    map.set(from, { ...row, from, to: normalizePath(row.to) })
  }
  return map
}

function traceDestination(from: string, byFrom: Map<string, RedirectDoc>) {
  const path: string[] = [from]
  const seen = new Set<string>([from])
  let cursor = from

  while (true) {
    const row = byFrom.get(cursor)
    if (!row) return { terminal: cursor, path, hasLoop: false }
    const next = normalizePath(row.to)
    path.push(next)
    if (seen.has(next)) return { terminal: next, path, hasLoop: true }
    seen.add(next)
    cursor = next
  }
}

export function analyzeRedirectRows(rows: RedirectDoc[]): RedirectIssue[] {
  const enabledRows = rows.filter((row) => row.isEnabled !== false)
  const byFrom = buildIndex(enabledRows)
  const issues: RedirectIssue[] = []

  for (const row of enabledRows) {
    const from = normalizePath(row.from)
    const to = normalizePath(row.to)
    if (from === to) {
      issues.push({
        kind: 'self_redirect',
        from,
        to,
        resolution: 'delete',
        id: row.id,
      })
      continue
    }

    const trace = traceDestination(from, byFrom)
    if (trace.hasLoop) {
      issues.push({
        kind: 'loop_risk',
        from,
        to,
        path: trace.path,
        resolution: 'manual_review',
        id: row.id,
      })
      continue
    }

    const terminal = normalizePath(trace.path[trace.path.length - 1] || to)
    if (terminal !== to) {
      issues.push({
        kind: 'chain_flatten',
        from,
        to,
        path: trace.path,
        resolution: 'update',
        suggestedTo: terminal,
        id: row.id,
      })
    }
  }

  return issues
}

export async function runRedirectHygiene(apply: boolean): Promise<RedirectHygieneReport> {
  const payload = await getPayload({ config: payloadConfig })
  const result = await payload.find({
    collection: 'redirects',
    limit: 1000,
    depth: 0,
    sort: 'from',
    overrideAccess: true,
    draft: false,
  })

  const docs = result.docs as unknown as RedirectDoc[]
  const issues = analyzeRedirectRows(docs)

  let deleted = 0
  let updated = 0

  if (apply) {
    for (const issue of issues) {
      if (!issue.id) continue
      if (issue.kind === 'self_redirect' && issue.resolution === 'delete') {
        await payload.delete({
          collection: 'redirects',
          id: issue.id,
          overrideAccess: true,
        })
        deleted += 1
      }
      if (issue.kind === 'chain_flatten' && issue.resolution === 'update' && issue.suggestedTo) {
        await payload.update({
          collection: 'redirects',
          id: issue.id,
          data: { to: issue.suggestedTo },
          overrideAccess: true,
        })
        updated += 1
      }
    }
  }

  return {
    scanned: docs.length,
    applied: apply,
    deleted,
    updated,
    issues,
  }
}
