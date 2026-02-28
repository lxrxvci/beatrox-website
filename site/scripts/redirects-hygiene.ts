import { runRedirectHygiene } from '@/lib/redirects/hygiene'

function parseArgs(argv: string[]) {
  const apply = argv.includes('--apply')
  const dryRun = argv.includes('--dry-run') || !apply
  return { apply: apply && !dryRun ? true : apply, dryRun: !apply || dryRun }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const report = await runRedirectHygiene(args.apply)

  const summary = {
    scanned: report.scanned,
    applied: report.applied,
    deleted: report.deleted,
    updated: report.updated,
    selfRedirects: report.issues.filter((issue) => issue.kind === 'self_redirect').length,
    chainFlattenCandidates: report.issues.filter((issue) => issue.kind === 'chain_flatten').length,
    loopRisks: report.issues.filter((issue) => issue.kind === 'loop_risk').length,
  }

  console.log(JSON.stringify(summary, null, 2))

  if (report.issues.length > 0) {
    console.log('\nIssues:')
    for (const issue of report.issues) {
      const path = issue.path?.join(' -> ')
      const suffix = issue.suggestedTo ? ` => ${issue.suggestedTo}` : ''
      console.log(`- [${issue.kind}] ${issue.from} -> ${issue.to}${suffix}${path ? ` (${path})` : ''}`)
    }
  }

  if (!args.apply) {
    console.log('\nDry run complete. Use --apply to write changes.')
  }
}

main().catch((error) => {
  console.error('redirects-hygiene failed:', error)
  process.exitCode = 1
})
