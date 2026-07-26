'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
}

const SPEEDS = [0.5, 1, 1.5, 2]

/**
 * Bespoke branded video player with:
 * - Custom controls (play/pause, scrubber, volume, speed, fullscreen)
 * - Ambient lighting canvas that mirrors the video's colors behind the player
 * - Keyboard shortcuts: Space (play/pause), ← → (seek), F (fullscreen), M (mute)
 * - Controls auto-hide after 3s of inactivity
 */
export default function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [controlsVisible, setControlsVisible] = useState(true)

  const showControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000)
  }, [])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }, [])

  // Ambient lighting: draw downscaled frames to canvas behind the player
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const draw = () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }
      raf = requestAnimationFrame(draw)
    }
    const start = () => {
      cancelAnimationFrame(raf)
      draw()
    }
    const stop = () => cancelAnimationFrame(raf)

    video.addEventListener('play', start)
    video.addEventListener('pause', stop)
    video.addEventListener('ended', stop)
    return () => {
      cancelAnimationFrame(raf)
      video.removeEventListener('play', start)
      video.removeEventListener('pause', stop)
      video.removeEventListener('ended', stop)
    }
  }, [])

  // Keyboard shortcuts (when the player region has focus/hover)
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current
      if (!v) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          v.currentTime = Math.max(0, v.currentTime - 5)
          break
        case 'ArrowRight':
          v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 5)
          break
        case 'f':
        case 'F':
          if (document.fullscreenElement) document.exitFullscreen()
          else wrap.requestFullscreen?.()
          break
        case 'm':
        case 'M':
          v.muted = !v.muted
          setMuted(v.muted)
          break
      }
      showControls()
    }
    wrap.addEventListener('keydown', onKey)
    return () => wrap.removeEventListener('keydown', onKey)
  }, [togglePlay, showControls])

  useEffect(() => () => void (hideTimer.current && clearTimeout(hideTimer.current)), [])

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative max-w-[1200px] mx-auto">
      {/* Ambient lighting canvas */}
      <canvas
        ref={canvasRef}
        width={64}
        height={36}
        aria-hidden="true"
        className="absolute -inset-8 w-[calc(100%+4rem)] h-[calc(100%+4rem)] scale-110 opacity-60 blur-[80px] brightness-125 pointer-events-none"
      />

      <div
        ref={wrapRef}
        tabIndex={0}
        role="region"
        aria-label={title ? `Video player: ${title}` : 'Video player'}
        className="relative aspect-video bg-[var(--bg-secondary)] overflow-hidden group outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        onMouseMove={showControls}
        onMouseLeave={() => setControlsVisible(false)}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget
            setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0)
          }}
        />

        {/* Controls */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300 ${
            controlsVisible || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Scrubber */}
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={(e) => {
              const v = videoRef.current
              if (!v || !v.duration) return
              v.currentTime = (Number(e.target.value) / 100) * v.duration
            }}
            aria-label="Seek"
            className="w-full h-1 appearance-none bg-white/25 accent-[var(--accent)] cursor-pointer mb-3"
          />

          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              aria-label={playing ? 'Pause' : 'Play'}
              className="text-white hover:text-[var(--accent)] transition-colors"
            >
              {playing ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" />
                  <rect x="14" y="5" width="4" height="14" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <span className="mono text-white text-xs tabular-nums">
              {fmt(videoRef.current?.currentTime ?? 0)} / {fmt(videoRef.current?.duration ?? 0)}
            </span>

            <div className="flex-1" />

            <button
              onClick={() => {
                const v = videoRef.current
                if (!v) return
                v.muted = !v.muted
                setMuted(v.muted)
              }}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="text-white hover:text-[var(--accent)] transition-colors"
            >
              {muted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4 9v6h4l5 5V4L8 9H4z" />
                  <line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" strokeWidth="2" />
                  <line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" strokeWidth="2" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4 9v6h4l5 5V4L8 9H4z" />
                  <path d="M16 8c1.5 1.5 1.5 6.5 0 8" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              )}
            </button>

            <select
              value={speed}
              onChange={(e) => {
                const s = Number(e.target.value)
                setSpeed(s)
                if (videoRef.current) videoRef.current.playbackRate = s
              }}
              aria-label="Playback speed"
              className="mono bg-transparent text-white text-xs border border-white/25 px-1.5 py-1 cursor-pointer"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s} className="bg-black">
                  {s}x
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                const wrap = wrapRef.current
                if (!wrap) return
                if (document.fullscreenElement) document.exitFullscreen()
                else wrap.requestFullscreen?.()
              }}
              aria-label="Fullscreen"
              className="text-white hover:text-[var(--accent)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
