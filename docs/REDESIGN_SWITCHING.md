# Redesign Switching & Rollback Runbook

This project maintains **two front-ends**:

| Front-end | Git branch | Where it runs |
|-----------|-----------|---------------|
| **Current site (baseline)** | `main` | Production (Vercel `beatrox-website`) |
| **Alternative redesign** | `redesign` | Vercel preview deployment for the `redesign` branch |

The exact baseline commit is tagged **`baseline-pre-redesign`**. This tag is the permanent restore point for the current site.

Redesign specification: `beatrox-redesign-plan-for-kimi27.md` (repo root).

---

## Previewing the redesign

**Online (client review):** every push to the `redesign` branch triggers a Vercel preview deployment. Get the URL from the Vercel dashboard (`beatrox-website` → Deployments → filter by branch `redesign`) or from the GitHub branch checks.

**Locally:**

```bash
git checkout redesign
cd site && npm install && npm run dev
```

To go back to the current site locally: `git checkout main`.

---

## Promoting the redesign (client approves)

```bash
git checkout main
git merge redesign
git push origin main
```

Vercel auto-deploys `main` to production. The site is now the redesign.

---

## Rolling back (client rejects it)

**Before merge** — nothing to do. Production (`main`) was never touched. Optionally delete the branch:

```bash
git branch -D redesign
git push origin --delete redesign
```

**After merge** — two options:

1. **Revert the merge** (keeps history):

   ```bash
   git checkout main
   git revert -m 1 <merge-commit-sha>
   git push origin main
   ```

2. **Instant production rollback via Vercel** (fastest, no code change):
   Vercel dashboard → Deployments → find the deployment built from tag/commit `baseline-pre-redesign` → **⋯ → Promote to Production**. Production immediately serves the old front-end again.

To fully reset `main` to the baseline locally (destructive, requires force-push):

```bash
git checkout main
git reset --hard baseline-pre-redesign
git push --force origin main   # only with explicit approval
```

---

## Scope guardrails for redesign work

All redesign work happens **only** on the `redesign` branch.

**May change:**
- `site/app/(site)/**` — public pages and layouts
- `site/components/**` — shared UI components
- `site/app/globals.css`, `site/tailwind.config.ts`, `site/app/layout.tsx`
- New assets under `site/public/`
- New dependencies (`gsap`, `lenis`, `motion`, `three`, …) in `site/package.json`

**Must NOT change** (so rollback never affects content or CMS):
- `site/app/(payload)/**` and `site/payload/**` — Payload CMS admin/config
- `site/lib/**` — content/CMS data layer (the redesign must consume the *same* content layer)
- `content/**` — JSON content
- `scripts/**`, `schema/**` — tooling and structured data

**Commit hygiene:** commit in small, phase-aligned commits matching the redesign plan's Phases 1–3 (Foundation → Interaction Layer → Polish). This keeps partial rollback and per-phase review possible.
