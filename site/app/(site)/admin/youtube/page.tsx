import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  exchangeCodeForToken,
  getAuthorizationUrl,
  getYouTubeClient,
  hasSavedToken,
  pushVideoMetadataUpdate,
} from '@/lib/youtube/client'
import { buildManifest, validateOverrideLimits } from '@/lib/youtube/merge'
import { parsePlaylistFilter, parseStatusFilter, regenerateManifest, syncFromYouTube } from '@/lib/youtube/sync'
import { readOverrides, readRawVideos, writeOverrides } from '@/lib/youtube/storage'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = 'force-dynamic'

function isDev() {
  return process.env.NODE_ENV === 'development'
}

function requireDev() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('The local YouTube admin is only available in development mode.')
  }
}

function compact(input?: string | null) {
  const value = (input || '').trim()
  return value.length ? value : undefined
}

async function startConnectAction() {
  'use server'
  requireDev()
  const { url } = getAuthorizationUrl(['youtube.readonly', 'youtube.force-ssl'])
  redirect(url)
}

async function saveOAuthCodeAction(formData: FormData) {
  'use server'
  requireDev()
  const code = compact(formData.get('oauthCode')?.toString())
  if (!code) {
    redirect('/admin/youtube?error=Missing+OAuth+code')
  }
  await exchangeCodeForToken(code)
  redirect('/admin/youtube?notice=YouTube+OAuth+token+saved')
}

async function syncAction(formData: FormData) {
  'use server'
  requireDev()
  const statuses = parseStatusFilter(formData.get('statuses')?.toString())
  const playlists = parsePlaylistFilter(formData.get('playlistIds')?.toString())
  const result = await syncFromYouTube({
    privacyStatuses: statuses,
    playlistIds: playlists,
  })
  redirect(`/admin/youtube?notice=Synced+${result.rawCount}+videos,+manifest+${result.manifestCount}`)
}

async function exportManifestAction(formData: FormData) {
  'use server'
  requireDev()
  const statuses = parseStatusFilter(formData.get('statuses')?.toString())
  const playlists = parsePlaylistFilter(formData.get('playlistIds')?.toString())
  const manifest = regenerateManifest({
    privacyStatuses: statuses,
    playlistIds: playlists,
  })
  redirect(`/admin/youtube?notice=Manifest+exported+(${manifest.count}+videos)`)
}

async function saveOverrideAction(formData: FormData) {
  'use server'
  requireDev()
  const videoId = compact(formData.get('videoId')?.toString())
  if (!videoId) {
    redirect('/admin/youtube?error=Missing+video+id')
  }

  const title = compact(formData.get('title')?.toString())
  const description = compact(formData.get('description')?.toString())
  const seoTitle = compact(formData.get('seoTitle')?.toString())
  const seoDescription = compact(formData.get('seoDescription')?.toString())
  const seoOgImage = compact(formData.get('seoOgImage')?.toString())
  const siteSlug = compact(formData.get('siteSlug')?.toString())
  const tagInput = compact(formData.get('tags')?.toString())
  const noindex = formData.get('noindex') === 'on'

  const tags = tagInput
    ? tagInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined

  const overrides = readOverrides()
  overrides.overrides[videoId] = {
    title,
    description,
    tags,
    siteSlug,
    noindex: noindex || undefined,
    seo: {
      title: seoTitle,
      description: seoDescription,
      ogImage: seoOgImage,
    },
  }
  overrides.updatedAt = new Date().toISOString()
  writeOverrides(overrides)
  regenerateManifest()
  redirect(`/admin/youtube?notice=Saved+override+for+${videoId}`)
}

async function pushVideoAction(formData: FormData) {
  'use server'
  requireDev()
  const videoId = compact(formData.get('videoId')?.toString())
  if (!videoId) {
    redirect('/admin/youtube?error=Missing+video+id')
  }
  const manifest = regenerateManifest()
  const target = manifest.videos.find((video) => video.id === videoId)
  if (!target) {
    redirect('/admin/youtube?error=Video+not+found+in+manifest')
  }

  const yt = getYouTubeClient(['youtube.force-ssl'])
  await pushVideoMetadataUpdate(yt, {
    videoId,
    title: target.title,
    description: target.description,
  })
  redirect(`/admin/youtube?notice=Pushed+title/description+to+YouTube+for+${videoId}`)
}

function writeDebugLog(location: string, message: string, data: Record<string, unknown>) {
  try {
    const logDir = path.join(process.cwd(), '..', '.cursor')
    const logPath = path.join(logDir, 'debug.log')
    fs.mkdirSync(logDir, { recursive: true })
    fs.appendFileSync(logPath, JSON.stringify({ location, message, data, timestamp: Date.now() }) + '\n')
  } catch (_) {}
}

export default async function AdminYouTubePage({ searchParams }: PageProps) {
  // #region agent log
  writeDebugLog('admin/youtube/page.tsx:entry', 'AdminYouTubePage render started', { NODE_ENV: process.env.NODE_ENV })
  // #endregion
  if (!isDev()) {
    return (
      <section className="pt-28 pb-20 px-6 lg:px-10">
        <div className="max-w-[900px] mx-auto border border-white/10 p-6">
          <h1 className="heading-lg mb-3">YouTube Admin (Local Only)</h1>
          <p className="text-sm text-white/60">
            This route is disabled outside development mode. Run <code>npm run dev</code> locally to access the
            YouTube sync and metadata tooling.
          </p>
        </div>
      </section>
    )
  }

  let params, selectedStatuses, selectedPlaylistIds, raw, overrides, filteredManifest, tokenReady
  try {
    params = await searchParams
    selectedStatuses = parseStatusFilter(params.status)
    selectedPlaylistIds = parsePlaylistFilter(params.playlist)
    // #region agent log
    writeDebugLog('admin/youtube/page.tsx:beforeRead', 'Before readRawVideos', {})
    // #endregion
    raw = readRawVideos()
    writeDebugLog('admin/youtube/page.tsx:afterRaw', 'After readRawVideos', { videoCount: raw?.videos?.length })
    overrides = readOverrides()
    writeDebugLog('admin/youtube/page.tsx:afterOverrides', 'After readOverrides', {})
    filteredManifest = buildManifest(raw, overrides, {
      privacyStatuses: selectedStatuses,
      playlistIds: selectedPlaylistIds,
    })
    writeDebugLog('admin/youtube/page.tsx:afterBuildManifest', 'After buildManifest', { count: filteredManifest?.count })
    tokenReady = hasSavedToken()
    writeDebugLog('admin/youtube/page.tsx:afterHasToken', 'After hasSavedToken', { tokenReady })
  } catch (err) {
    writeDebugLog('admin/youtube/page.tsx:catch', 'Render error', { error: String(err), stack: (err as Error)?.stack })
    throw err
  }
  const limitIssues = validateOverrideLimits(overrides)
  const issueMap = new Set(limitIssues.map((issue) => issue.videoId))
  const statusValue = (selectedStatuses || []).join(',')
  const playlistValue = (selectedPlaylistIds || []).join(',')
  const notice = compact(params.notice?.toString())
  const error = compact(params.error?.toString())

  return (
    <section className="pt-28 pb-20 px-6 lg:px-10">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <header className="space-y-3">
          <p className="heading-sm text-white/40">Admin</p>
          <h1 className="heading-lg">YouTube Manifest + SEO Studio (Local)</h1>
          <p className="text-sm text-white/60 max-w-3xl">
            Sync your uploads, filter by playlist/privacy, edit local SEO/title/description overrides, export the
            merged manifest, and push selected title/description updates back to YouTube.
          </p>
          <p className="text-xs text-white/35">
            Required local env vars: <code>YOUTUBE_OAUTH_CLIENT_PATH</code> and <code>YOUTUBE_OAUTH_TOKEN_PATH</code>{' '}
            (optional if you use defaults in <code>site/.secrets</code>).
          </p>
        </header>

        {notice && <p className="text-xs border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">{notice}</p>}
        {error && <p className="text-xs border border-red-500/40 bg-red-500/10 px-4 py-3">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
          <article className="border border-white/10 p-5 space-y-4">
            <h2 className="heading-sm text-white/80">1) Connect OAuth</h2>
            <p className="text-xs text-white/50">Current token: {tokenReady ? 'saved' : 'missing'}</p>
            <div className="flex flex-wrap gap-3">
              <form action={startConnectAction}>
                <button type="submit" className="btn-ghost">
                  Open Consent Screen
                </button>
              </form>
            </div>
            <form action={saveOAuthCodeAction} className="space-y-2">
              <label className="heading-sm text-white/35 block" htmlFor="oauthCode">
                Paste OAuth code
              </label>
              <textarea
                id="oauthCode"
                name="oauthCode"
                rows={3}
                className="w-full bg-black border border-white/20 px-3 py-2 text-xs text-white/80"
                placeholder="Paste the authorization code returned by Google"
              />
              <button type="submit" className="btn-primary">
                Save Token
              </button>
            </form>
          </article>

          <article className="border border-white/10 p-5 space-y-4">
            <h2 className="heading-sm text-white/80">2) Filters + Sync</h2>
            <form method="GET" className="space-y-4">
              <div className="space-y-2">
                <p className="heading-sm text-white/35">Privacy status</p>
                <div className="flex flex-wrap gap-4 text-xs text-white/70">
                  {(['public', 'unlisted', 'private'] as const).map((status) => (
                    <label key={status} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="status"
                        value={status}
                        defaultChecked={selectedStatuses?.includes(status)}
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="heading-sm text-white/35 block" htmlFor="playlist">
                  Playlist IDs (comma separated)
                </label>
                <input
                  id="playlist"
                  name="playlist"
                  defaultValue={playlistValue}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-xs text-white/80"
                  placeholder="PLxxxx,PLyyyy"
                />
                <div className="text-[11px] text-white/40">
                  Known playlists:{' '}
                  {raw.playlists.length ? raw.playlists.map((playlist) => playlist.title).join(' • ') : 'none yet'}
                </div>
              </div>
              <button type="submit" className="btn-ghost">
                Apply Filters
              </button>
            </form>

            <div className="flex flex-wrap gap-3">
              <form action={syncAction}>
                <input type="hidden" name="statuses" value={statusValue} />
                <input type="hidden" name="playlistIds" value={playlistValue} />
                <button type="submit" className="btn-primary">
                  Sync from YouTube
                </button>
              </form>

              <form action={exportManifestAction}>
                <input type="hidden" name="statuses" value={statusValue} />
                <input type="hidden" name="playlistIds" value={playlistValue} />
                <button type="submit" className="btn-ghost">
                  Export Manifest
                </button>
              </form>
            </div>
          </article>
        </div>

        <div className="border border-white/10 p-5 space-y-3">
          <h2 className="heading-sm text-white/80">Validation</h2>
          <p className="text-xs text-white/60">
            Override limit issues: <strong>{limitIssues.length}</strong>{' '}
            <span className="text-white/40">(YouTube limits: title 100, description 5000)</span>
          </p>
          {limitIssues.length > 0 && (
            <ul className="text-xs text-red-300/85 space-y-1">
              {limitIssues.slice(0, 20).map((issue) => (
                <li key={`${issue.videoId}-${issue.field}`}>
                  {issue.videoId}: {issue.field} is {issue.length} (max {issue.max})
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="heading-sm text-white/80">Videos ({filteredManifest.count})</h2>
          <Link href="/videos" className="btn-ghost">
            Open /videos
          </Link>
        </div>

        <div className="space-y-6">
          {filteredManifest.videos.map((video) => {
            const override = overrides.overrides[video.id]
            return (
              <article key={video.id} className="border border-white/10 p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="heading-sm text-white/85">{video.title}</p>
                  <span className="text-[11px] px-2 py-1 border border-white/20">{video.privacyStatus}</span>
                  {issueMap.has(video.id) && (
                    <span className="text-[11px] px-2 py-1 border border-red-500/40 bg-red-500/10">limit warning</span>
                  )}
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-xs text-white/55">
                    {video.id}
                  </a>
                </div>

                <form action={saveOverrideAction} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <input type="hidden" name="videoId" value={video.id} />
                  <div className="space-y-2">
                    <label className="text-xs text-white/50 block" htmlFor={`title-${video.id}`}>
                      Title
                    </label>
                    <input
                      id={`title-${video.id}`}
                      name="title"
                      defaultValue={override?.title || video.title}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-white/50 block" htmlFor={`siteSlug-${video.id}`}>
                      Site slug (optional)
                    </label>
                    <input
                      id={`siteSlug-${video.id}`}
                      name="siteSlug"
                      defaultValue={override?.siteSlug || ''}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-xs"
                      placeholder="/work/project-slug or /videos/video-id"
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-xs text-white/50 block" htmlFor={`description-${video.id}`}>
                      Description
                    </label>
                    <textarea
                      id={`description-${video.id}`}
                      name="description"
                      rows={5}
                      defaultValue={override?.description || video.description}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-white/50 block" htmlFor={`tags-${video.id}`}>
                      Tags (comma separated)
                    </label>
                    <input
                      id={`tags-${video.id}`}
                      name="tags"
                      defaultValue={(override?.tags || video.tags).join(', ')}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-white/50 block" htmlFor={`seoTitle-${video.id}`}>
                      SEO title
                    </label>
                    <input
                      id={`seoTitle-${video.id}`}
                      name="seoTitle"
                      defaultValue={override?.seo?.title || video.seo.title}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-white/50 block" htmlFor={`seoDescription-${video.id}`}>
                      SEO description
                    </label>
                    <input
                      id={`seoDescription-${video.id}`}
                      name="seoDescription"
                      defaultValue={override?.seo?.description || video.seo.description}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-white/50 block" htmlFor={`seoOgImage-${video.id}`}>
                      SEO OG image URL
                    </label>
                    <input
                      id={`seoOgImage-${video.id}`}
                      name="seoOgImage"
                      defaultValue={override?.seo?.ogImage || video.seo.ogImage || ''}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-white/65">
                    <input type="checkbox" name="noindex" defaultChecked={Boolean(override?.noindex)} />
                    noindex this video page
                  </label>
                  <div className="lg:col-span-2 flex flex-wrap gap-3">
                    <button type="submit" className="btn-primary">
                      Save override
                    </button>
                  </div>
                </form>

                <form action={pushVideoAction}>
                  <input type="hidden" name="videoId" value={video.id} />
                  <button type="submit" className="btn-ghost">
                    Push title/description to YouTube
                  </button>
                </form>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
