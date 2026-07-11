# BEATROX — Full Redesign Plan for Kimi 2.7 (KimiCode)

> **Source Material:** Three comprehensive audits synthesizing front-end architecture, visual aesthetic engineering, animation physics, shader programming, and edge-network deployment strategy.
> **Goal:** Transform the current D+ corporate-template site into an A-grade elite experiential showcase that matches Beatrox's real-world production capabilities.

---

## EXECUTIVE SUMMARY

| Dimension | Current Grade | Target |
|-----------|---------------|--------|
| Hero & First Impression | D+ | A — Cinematic video + kinetic type |
| Media Architecture | D+ | A — Asymmetric bento + WebGL hover |
| Typography & Copy | C+ | A — Display fonts + punchy copy |
| Micro-Interactions & Animation | D+ | A — Magnetic buttons + page transitions |
| Case Study Deep Dive | D+ | A — Custom video player + editorial layout |
| Navigation & Global Polish | C+ | A — Smooth scroll + scroll-aware header |

**The Core Problem:** The gap between what Beatrox *does* (laser shows, drone formations, robotics, projection mapping for Adidas/Netflix/CNN) and what the site *communicates* is massive. Every page should feel like stepping into one of their installations. Currently it feels like reading a brochure about one.

**Overall Strategy:** 3-phase build — Foundation (video heroes, copy, kinetic type, smooth scroll), Interaction Layer (WebGL, page transitions, ticker), Polish (editorial details, SVG animations, footer reveal).

---

## DESIGN TOKENS & GLOBAL SYSTEM

### Color Palette
```
--bg-primary: #0A0A0A        // Deep off-black (not pure #000)
--bg-secondary: #111111      // Card/section backgrounds
--bg-elevated: #1A1A1A       // Hover states, elevated surfaces
--text-primary: #F5F0EB      // Warm off-white (not pure #FFF)
--text-secondary: #8A8A8A    // Muted captions
--text-tertiary: #4A4A4A     // Disabled/subtle
--accent: #C8FF00            // Brand neon-lime (or current brand color)
--accent-dim: #9ECC00        // Darker accent for hover
--border: #262626            // Razor-thin borders for editorial layout
--border-subtle: #1A1A1A     // Very faint dividers
```

### Typography Stack
```
Display/H1/H2:     "PP Neue Montreal", "Monument Extended", or "Clash Display"
                    // Weights: 700-900. All-caps for headlines.
                    // Tight tracking (-0.02em) on headlines.
                    // These fonts have architectural, brutalist presence.

Body:              "Inter" or "Satoshi"
                    // Weight 400. Line-height 1.65-1.7.
                    // High x-height for screen readability.

Technical/Specs:   "JetBrains Mono" (via next/font/google) or "SF Mono"
                    // Weight 400/700. Line-height 1.5.
                    // Used exclusively for: tech specs, metadata,
                    // engineering parameters, capability tags.

Overlines/Labels:  Same display font, reduced weight (400-500)
                    // letter-spacing: 0.2em, uppercase, 12-13px
```

### Spacing System (8px base unit)
```
Base unit: 8px
Scale: 4, 8, 12, 16, 24, 32, 48, 64, 80, 120, 160
Section padding: 120px-160px vertical (generous "luxury" spacing)
Container max-width: 1440px
Content max-width: 1200px
Grid gutter: 24px
```

### Animation Easing Tokens
```
--ease-expo-out: cubic-bezier(0.16, 1, 0.3, 1)
--ease-quart-inout: cubic-bezier(0.76, 0, 0.24, 1)
--ease-power4: "power4.out" (GSAP)
--ease-back-out: "back.out(1.7)" (GSAP)
--ease-elastic: "elastic.out(1, 0.3)" (GSAP)
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)
```

---

## GLOBAL SYSTEM: SCROLL, NAV & TRANSITIONS

These are foundational — implement first, before any page-level work.

### 1. Smooth Scroll (Lenis + GSAP Sync)

```javascript
// hooks/useLenis.ts
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Run Lenis on GSAP's ticker for perfect sync
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
    };
  }, []);

  return lenisRef;
}
```

```jsx
// Layout.tsx - wrap entire app
import { ReactLenis } from 'lenis/react';

function Layout({ children }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
```

### 2. Scroll-Aware Header

```
- Fixed position, z-index: 50
- On scroll DOWN (> 100px from top): translateY(-100%) to hide
- On scroll UP: translateY(0) to reveal
- When visible at top: transparent background
- When visible after scroll: backdrop-filter: blur(12px) + bg: rgba(10,10,10,0.8) + border-bottom: 1px solid var(--border)
- Transition: transform 0.4s var(--ease-expo-out)
- Use Lenis scroll event or ScrollTrigger to detect direction
```

### 3. Navigation Micro-Interactions

```
NAV LINKS:
- Character swap animation on hover (rolling text effect):
  - Each link has two stacked text layers in overflow:hidden container
  - On hover: top layer slides up translateY(-100%), bottom layer slides up from translateY(100%) to 0
  - Duration: 0.35s, ease: var(--ease-expo-out)
- Active state: 2px bottom border in accent color

BOOK NOW BUTTON:
- MAGNETIC EFFECT:
  - On mousemove within 50px radius: button subtly pulls toward cursor
  - Implementation: calculate distance from cursor to button center,
    apply translate(x * 0.3, y * 0.3) with GSAP quickTo (lerp 0.15)
  - On mouseleave: spring back to origin with gsap.to({x:0, y:0})
- FILL TRANSITION:
  - Default: transparent bg, 1px border in var(--text-primary)
  - Hover: solid fill expands from cursor entry point (CSS clip-path circle expansion)
  - Text color inverts to --bg-primary on fill
```

### 4. Page Transitions (Framer Motion)

```jsx
// AnimatedRoutes.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

function AnimatedRoutes({ children }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.6,
          ease: [0.76, 0, 0.24, 1] // easeInOutQuart
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### 5. Scroll-Triggered Reveals (GSAP ScrollTrigger)

```javascript
// Global scroll reveal pattern
// Every section heading and image gets this treatment

gsap.fromTo(element,
  { y: 40, opacity: 0, scale: 1.02 },
  {
    y: 0,
    opacity: 1,
    scale: 1,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: {
      trigger: element,
      start: "top 85%",
      toggleActions: "play none none none"
    }
  }
);
```

### 6. Footer Curtain Reveal

```
- Footer: position: fixed, bottom: 0, z-index: -1, height: 400px
- Main content wrapper: margin-bottom: 400px (same as footer height)
- Effect: As user scrolls to bottom, the page content lifts up
  like a curtain, revealing the fixed footer underneath
- Creates depth and finality
```

---

## HOMEPAGE REDESIGN

### Section 1: Hero

**CURRENT STATE:** Static image (IMG_3942-Crop), redundant sub-headline + H1, static text, outlined CTAs with no animation.

**REDESIGN SPEC:**

#### A. Cinematic Video Background
```
VIDEO ASSET:
- Replace static hero image with full-viewport cinematic ambient video loop
- Content: Dark, art-directed montage of laser shows, drone formations,
  crowd silhouettes, projection mapping, behind-the-scenes rigging
- Color-graded to dark-mode palette matching --bg-primary
- Overlay: gradient from rgba(10,10,10,0.3) at top to rgba(10,10,10,0.7)
  at bottom for text legibility (NOT a flat tint)

TECHNICAL:
- Format: <video autoplay loop muted playsinline poster="fallback.jpg">
         <source src="hero.webm" type="video/webm; codecs=av1">
         <source src="hero.mp4" type="video/mp4; codecs=hvc1">
         <source src="hero-fallback.mp4" type="video/mp4">
  </video>
- Target file size: < 5MB per loop
- Resolution: 1080p minimum
- Duration: 8-12 second seamless loop
- Fallback: static poster image for low-bandwidth / reduced-motion

FFMPEG PIPELINE (generate these assets):
  # AV1 (primary - smallest file)
  ffmpeg -i input.mov -c:v libsvtav1 -crf 32 -preset 6 -an \
         -movflags faststart -vf "scale=1920:-2" hero.webm

  # HEVC/H.265 (Safari fallback)
  ffmpeg -i input.mov -c:v libx265 -crf 28 -preset medium \
         -tag:v hvc1 -movflags faststart -an \
         -vf "scale=1920:-2" hero.mp4

  # H.264 (legacy fallback)
  ffmpeg -i input.mov -c:v libx264 -crf 23 -preset medium \
         -movflags faststart -an -vf "scale=1920:-2" hero-fallback.mp4
```

#### B. Kinetic Typography (GSAP SplitText)
```
HEADLINE:
- Text: "BUILDING UNFORGETTABLE WORLDS" (was: "WE SPECIALIZE IN EXPERIENTIAL DESIGN AND EVENT PRODUCTION")
- Font: Display font (PP Neue Montreal / Monument Extended), 800+ weight
- Size: clamp(3rem, 8vw, 7rem) — responsive but massive
- Transform: uppercase
- Letter-spacing: -0.02em (tight)
- Color: var(--text-primary)
- Max-width: 12ch per line (force line breaks for impact)

ANIMATION — Staggered Fluid Reveal:
  1. Split H1 into individual characters using GSAP SplitText
     const split = new SplitText("#hero-headline", { type: "chars,words" });

  2. Animate from below with stagger:
     gsap.from(split.chars, {
       y: "120%",
       opacity: 0,
       duration: 0.8,
       ease: "power4.out",
       stagger: 0.03,  // 30ms per character — wave effect
       delay: 0.3      // Wait for video to start
     });

  3. Each character wrapped in overflow:hidden mask
     so it appears to slide up from behind a boundary

  4. Add SplitText mask property (v3.13+) for clean reveal

OVERLINE (sub-headline replacement):
- Text: "BEATROX" (brand name only — NO redundancy with H1)
- Font: Display font, 400 weight
- Size: 13px
- letter-spacing: 0.2em
- uppercase
- Color: var(--accent)
- Animation: fade in + translateY(-10px to 0), 0.5s, delay: 0.1s

BODY COPY:
- Text: "Laser. Drone. Code. Canvas. We engineer moments that defy expectation."
  (was: "Pushing the limits of creativity and technology...")
- Font: Inter 400
- Size: 1.125rem (18px)
- Color: var(--text-secondary)
- Max-width: 48ch
- Animation: fade in 0.6s, delay: 0.8s (after headline completes)
```

#### C. Hero CTAs
```
"SEE OUR WORK" + "BOOK A CONSULTATION"

STYLE:
- Padding: 16px 32px
- Border: 1px solid var(--text-primary)
- Background: transparent
- Text: uppercase, 14px, letter-spacing 0.1em
- Color: var(--text-primary)

HOVER STATES:
- MAGNETIC PULL: Within 50px radius, button subtly tracks toward cursor
  (GSAP: calculate vector from cursor to button center, apply
   translate with lerp 0.12, elastic easing)
- INVERTED FILL: Background fills from cursor entry point outward
  using CSS clip-path: circle() animation
- Text color inverts on fill completion
- Duration: 0.4s

ANIMATION: Fade in + translateY(20px to 0), delay: 1.2s
```

---

### Section 2: "Who We Are" (Three Pillars)

**CURRENT STATE:** Three text blocks (Who We Are / What We Do / How We Do It) in a standard grid. Generic corporate boilerplate. No images. No media.

**REDESIGN SPEC:**

```
LAYOUT: Asymmetric editorial layout (NOT equal columns)
- Left column (60%): Large feature image/video with parallax
- Right column (40%): Three stacked text blocks with staggered reveals

COPY REWRITES:
| Section | Current | New |
|---------|---------|-----|
| Who We Are | "A team of imaginative storytellers who use technology to bring worlds to life..." | "Engineers, artists, and architects of awe. We build the things people can't stop talking about." |
| What We Do | "From experiential design and creative technology to specialized production..." | "From concept to curtain call — design, fabrication, deployment, and operation. Full spectrum, zero compromise." |
| How We Do It | "Collaboration is everything. We work openly with clients..." | "Your vision + our obsession. We prototype fast, iterate relentlessly, and only stop when it's extraordinary." |

MEDIA:
- Add a large, atmospheric production photo (BTS of laser rigging, control room, drone prep)
- Image: Parallax scroll effect (moves at 0.8x scroll speed)
- Image reveal: Scale 1.05 to 1.0 + fade in on scroll

TYPOGRAPHY:
- Section label: "ABOUT US" — overline style (12px, letter-spacing 0.2em, accent color)
- Each block has a bold heading (Display font, 1.5rem) + body paragraph
- Blocks stagger in from right (x: 30 to 0, opacity 0 to 1, stagger 0.15s)

RESPONSIVE: Stack vertically on mobile, image above text
```

---

### Section 3: Tech Capabilities (The "Tag Cloud" Transformation)

**CURRENT STATE:** Raw inline `<span>` elements in a container — looks like a resume keyword list. No hierarchy, no interaction, no spatial dimensionality.

**REDESIGN SPEC:**

```
CAPABILITIES LIST (same 12 items):
Custom Fabrication, LED Video Wall, Drone Light Shows, Stage Design,
Experiential Events, Event Production, Immersive Environments,
Laser Light Shows, Multimedia Displays, DJ Equipment Rentals,
Audio Production, Projection Mapping

--- PRIMARY: KINETIC TICKER ---

LAYOUT:
- Full-width, edge-to-edge, no container padding
- Two rows of oversized text scrolling in OPPOSITE directions
- Row 1: scrolls left to right
- Row 2: scrolls right to left
- Font: Display font, 7-9vw, weight 800, uppercase
- Color: var(--text-primary), opacity 0.15 (subtle — acts as structural divider)
- White-space: nowrap
- gap between items: 4rem

CSS IMPLEMENTATION:
  .ticker-track {
    display: inline-flex;
    animation: ticker-scroll 40s linear infinite;
    will-change: transform;
  }
  .ticker-track-reverse {
    animation-direction: reverse;
  }
  @keyframes ticker-scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  /* Content duplicated in DOM for seamless loop */

GSAP VELOCITY CONTROL:
  // Tie ticker speed to scroll velocity
  let currentSpeed = 1;
  lenis.on('scroll', ({ velocity }) => {
    currentSpeed = 1 + Math.abs(velocity) * 0.05;
    gsap.to('.ticker-track', {
      timeScale: currentSpeed,
      duration: 0.3
    });
  });

--- SECONDARY: HOVER-TRIGGERED VISUAL PORTALS ---

INTERACTION:
- Each capability in the ticker is an interactive hover target
- On hover: a floating semi-transparent video thumbnail appears
  and anchors to the cursor with slight lag

PORTAL IMPLEMENTATION:
  1. Floating container: position: fixed, pointer-events: none
     z-index: 100, opacity: 0 initially

  2. On mouseenter a capability:
     - Set video src to capability preview (5-10s loop)
     - Start playing (muted)
     - Fade in (opacity 0 to 1, scale 0.9 to 1, 0.3s)

  3. On mousemove: update portal position with LERP
     const lerp = 0.1;
     portal.x += (mouseX - portal.x) * lerp;
     portal.y += (mouseY - portal.y) * lerp;
     // Use transform: translate3d() for GPU acceleration

  4. On mouseleave: fade out, pause video

VIDEO PREVIEWS (generate or source):
  Each capability needs a 5-10 second loop showing that service:
  - Drone Light Shows → drone formation in night sky
  - Laser Light Shows → colored laser beams
  - Projection Mapping → building facade projection
  - LED Video Wall → large LED wall at event
  - etc.

  Lazy-load: Only load video when cursor is within 100px of capability text
  Use IntersectionObserver or mouse proximity detection

RESPONSIVE:
- On mobile (< 768px): Show as vertical list with icons
  (no hover portals — tap to expand)
- Ticker still works but at reduced font size (12vw)
```

---

### Section 4: Featured Work Grid

**CURRENT STATE:** 4 project cards in uniform grid. Predictable aspect ratios. No variation. Basic opacity hover.

**REDESIGN SPEC:**

```
LAYOUT: Asymmetric Bento Grid

Use CSS Grid with intentional size variation:
  .work-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
  }
  .work-card-featured {
    grid-column: span 8;
    grid-row: span 2;
    aspect-ratio: 16/9;
  }
  .work-card-medium {
    grid-column: span 4;
    aspect-ratio: 4/5;
  }
  .work-card-wide {
    grid-column: span 6;
    aspect-ratio: 3/2;
  }

PROJECTS (flagship first):
1. Run for the Oceans (Adidas) — FEATURED (large, spans 8 cols)
2. AKU World (NFT Miami) — MEDIUM (4 cols, vertical)
3. Projekt X (Adriatique) — WIDE (6 cols)
4. MyShelter (Adidas) — WIDE (6 cols)

HOVER EFFECT — WebGL Fluid Distortion:

  OVERVIEW: When cursor moves over a project image, it ripples and
  shifts RGB channels — creating a "living digital asset" effect.

  ARCHITECTURE:
  - Single fullscreen WebGL canvas behind HTML content
  - Each project image has a corresponding THREE.Mesh plane
  - Planes are positioned/sized to match DOM elements via getBoundingClientRect()
  - On hover: shader uniforms animate in (GSAP), effect follows mouse

  SHADER (GLSL Fragment — combined effect):

  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D u_texture;
  uniform vec2 u_mouse;        // Normalized mouse position [0,1]
  uniform float u_time;
  uniform float u_intensity;   // 0 to 1, animated on hover

  // Simplex noise for fluid distortion
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    // ... (standard simplex noise implementation)
  }

  void main() {
    vec2 uv = vUv;

    // 1. Fluid distortion from simplex noise
    float noiseVal = snoise(uv * 3.0 + u_time * 0.3) * 0.008 * u_intensity;
    uv += noiseVal;

    // 2. Mouse-driven ripple
    float dist = distance(uv, u_mouse);
    float ripple = sin(dist * 25.0 - u_time * 3.0) * 0.015 * u_intensity;
    ripple *= smoothstep(0.5, 0.0, dist); // Fade ripple at edges
    uv += ripple;

    // 3. RGB shift (chromatic aberration) based on mouse velocity
    float shift = 0.008 * u_intensity;
    float r = texture2D(u_texture, uv + vec2(shift, 0.0)).r;
    float g = texture2D(u_texture, uv).g;
    float b = texture2D(u_texture, uv - vec2(shift, 0.0)).b;

    gl_FragColor = vec4(r, g, b, 1.0);
  }

  THREE.JS SETUP:
  - Renderer: alpha: true, antialias: false (performance)
  - Camera: orthographic, sized to viewport
  - Geometry: PlaneGeometry(1, 1, 16, 16) — subdivided for smooth distortion
  - Material: ShaderMaterial with custom shaders
  - On resize + scroll: update mesh positions to match DOM

  HOVER STATE ANIMATION:
    // On mouseenter
    gsap.to(material.uniforms.u_intensity, { value: 1, duration: 0.6, ease: "power2.out" });
    // On mouseleave
    gsap.to(material.uniforms.u_intensity, { value: 0, duration: 0.8, ease: "power2.inOut" });

  PERFORMANCE:
    - Disable WebGL on mobile (use CSS fallback: scale + hue-rotate)
    - Lazy-initialize WebGL context only when grid scrolls into view
    - Use IntersectionObserver to pause render loop when off-screen

FALLBACK (CSS-only for non-WebGL):
  .work-card:hover img {
    transform: scale(1.03);
    filter: hue-rotate(10deg);
    transition: all 0.5s var(--ease-smooth);
  }

CARD OVERLAY:
  - Project title (Display font, 1.5rem, white)
  - Client name (mono font, 12px, accent color)
  - Category tags (mono, 11px, --text-secondary)
  - Overlay fades in on hover: gradient from bottom + text slide up

RESPONSIVE:
  - Mobile: 2-column equal grid, no WebGL, simple scale hover
  - Tablet: Maintain asymmetry but reduce to 6-col grid
```

---

### Section 5: Infinite Marquee

```
LAYOUT:
- Full-width horizontal scroll at bottom of homepage
- 6-8 high-impact project images/videos in loop
- Height: 300px (desktop), 200px (mobile)

VELOCITY-REACTIVE:
- Base speed: slow crawl (40s per cycle)
- Scroll faster = marquee speeds up proportionally
- Implementation: GSAP with scroll-velocity multiplier

  gsap.to('.marquee-track', {
    xPercent: -100,
    ease: "none",
    duration: 40,
    repeat: -1,
    modifiers: {
      xPercent: gsap.utils.wrap(-100, 0)
    }
  });

  // Speed modulation via Lenis scroll velocity
  lenis.on('scroll', ({ velocity }) => {
    const speed = 1 + Math.abs(velocity) * 0.1;
    gsap.globalTimeline.timeScale(speed);
  });

ITEMS: Mix of project stills and short looping clips
- Each item: aspect-ratio 16/9, object-fit: cover
- Subtle rounded corners (4px)
```

---

### Section 6: CTA Section

```
TEXT: "LET'S BUILD SOMETHING EXTRAORDINARY"
- Display font, clamp(2rem, 5vw, 4rem), centered
- Animation: SplitText character reveal on scroll

SUBTEXT: "Every great experience starts with a conversation."
- Inter 400, --text-secondary

CTA BUTTON: "START A PROJECT" (same magnetic button style as hero)
- Accent color background variant

BACKGROUND: Subtle animated gradient or very faint texture
```

---

## WORK PAGE (/work)

### Hero
```
VIDEO BACKGROUND: Different video from homepage — project montage
- Same technical spec as homepage hero

HEADLINE: "OUR WORK" — kinetic SplitText reveal
BODY: "Permanent installations. Touring spectacles. Global activations.
       Every project is a new frontier."
```

### Filter System
```
CURRENT: Raw kebab-case tags ("ai-computer-vision", "custom-scenic")

FIX:
- Convert to human-readable: "AI & Computer Vision", "Custom Scenic"
- Style: Mono font, 12px, uppercase, letter-spacing 0.1em
- Active state: accent color underline (scaleX animation)
- Inactive: --text-tertiary
- Filter interaction: Active filters pulse subtly

ANIMATION: On filter change, grid items exit with staggered fade-out,
           then filtered items enter with staggered fade-in (GSAP Flip)
```

### Project Grid
```
- Same asymmetric bento layout as homepage work section
- ~14 projects with varying card sizes
- Flagship projects (Adidas, Netflix, CNN) get featured (large) cards
- WebGL hover distortions (same system as homepage)
- Each card links to case study with page transition

PAGE TRANSITION TO CASE STUDY:
- Click project → brief scale-down (0.98) + opacity fade
- Then page wipe transition to case study
- Duration: 0.6s, ease: [0.76, 0, 0.24, 1]
```

---

## CASE STUDY PAGE (/work/destination)

This is where the "illusion of elite" most often collapses. Maximum attention here.

### Hero
```
- Full-viewport project hero image/video
- Project title: Display font, massive, bottom-left aligned
- Client name: Mono font, accent color, above title
- Breadcrumb: "← Work" — subtle, top-left, mono font
```

### Metadata Block (The Editorial Schematic)

```
CURRENT: Static <aside> panel with labeled text blocks. Generic bordered pills.

REDESIGN: Architectural blueprint aesthetic

LAYOUT: Rigid multi-column grid with razor-thin borders
  +------------------+------------------+------------------+
  | CLIENT           | LOCATION         | TYPE             |
  | Journey's x      | Horton Plaza     | Interactive Art  |
  | Adidas           | Park — San Diego | Canvas           |
  |                  | CA               | Custom Scenic    |
  |                  |                  | Fabrication      |
  +------------------+------------------+------------------+
  | TECH             | SPEC             | PARTNERS         |
  | Arduino          | 12x8ft canvas    | Journey's        |
  | TouchDesigner    | 4K projection    | Adidas           |
  | Custom PCB       | Custom firmware  | Local vendors    |
  +------------------+------------------+------------------+

STYLING:
- Border: 1px solid var(--border)
- Font: JetBrains Mono for ALL text in this block
- Labels: 11px, uppercase, letter-spacing 0.15em, --text-secondary
- Values: 13px, --text-primary
- Padding: 20px per cell
- No rounded corners — sharp, technical

ANIMATION: Grid lines draw themselves on scroll (stroke-dasharray
           animation on SVG borders), cells fade in with stagger
```

### Custom Video Player (CRITICAL FIX)

```
CURRENT: "Destination Deck Link" text → dumps user to YouTube

REDESIGN: Bespoke branded player with ambient lighting

PLAYER FEATURES:
- Custom SVG controls (play/pause, scrubber, volume, fullscreen)
- Playback speed: 0.5x, 1x, 1.5x, 2x (dropdown)
- Zero external branding — no YouTube chrome, no related videos
- Muted autoplay preview on hover (desktop only)
- Keyboard: Space (play/pause), ← → (seek), F (fullscreen), M (mute)

AMBIENT LIGHTING EFFECT:
  - Canvas element positioned behind video player
  - On every frame: draw current video frame to canvas (downscaled to 1/4 resolution)
  - Apply CSS filter: blur(80px) brightness(1.2) to canvas
  - Result: soft, colored glow around player matching video content
  - Canvas updates only when video is playing

  IMPLEMENTATION:
    const canvas = document.getElementById('ambient-canvas');
    const ctx = canvas.getContext('2d');
    const video = document.getElementById('main-video');

    function drawAmbient() {
      if (video.paused) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawAmbient);
    }
    video.addEventListener('play', drawAmbient);

    // CSS on canvas:
    // filter: blur(80px) brightness(1.2);
    // opacity: 0.6;
    // transform: scale(1.1);

STYLING:
- Player: aspect-ratio 16/9, max-width 1200px, centered
- Controls: appear on hover (fade in from bottom), hide after 3s inactivity
- Scrubber: accent color fill, thin track
- Background behind player: var(--bg-secondary)

REACT COMPONENT STRUCTURE:
  <VideoPlayer>
    <AmbientCanvas videoRef={videoRef} />
    <video ref={videoRef} src={src} />
    <Controls>
      <PlayPause />
      <Scrubber />
      <Volume />
      <SpeedSelector options={[0.5, 1, 1.5, 2]} />
      <Fullscreen />
    </Controls>
  </VideoPlayer>
```

### Key Features List

```
CURRENT: Bulleted list with "—" (em-dash) as bullets

REDESIGN: Animated SVG Node Indicators

SVG DESIGN:
- Each bullet is a custom SVG: tech-styled crosshair or node indicator
- Geometry: Simple — two intersecting lines forming a + with small circle at center
- Style: 1px stroke, var(--accent) color, 20x20px

ANIMATION:
- On scroll into view: each SVG draws itself
- Technique: stroke-dasharray = total path length, stroke-dashoffset animates from full length to 0
- Duration: 0.4s per node, stagger: 0.1s between items
- Easing: easeInOut

GSAP IMPLEMENTATION:
  gsap.fromTo('.feature-icon path',
    { strokeDashoffset: 100 },
    {
      strokeDashoffset: 0,
      duration: 0.4,
      stagger: 0.1,
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: '.features-list',
        start: "top 80%"
      }
    }
  );

LIST STYLING:
- No default list markers
- Each item: flex row with icon left, text right
- Icon: 24px fixed width
- Text: Inter 400, 1rem, --text-primary, max-width 60ch
- Item spacing: 24px vertical gap
```

### Gallery

```
CURRENT: Grid of images with "Expand" buttons. No preview. No lightbox.

REDESIGN: Lightbox with Zoom Animation

GRID:
- Same asymmetric layout as work grid
- Hover: slight scale (1.02) + subtle shadow

LIGHTBOX:
- Click image → zoom from grid position to center
- Implementation: FLIP animation (Framer Motion layoutId)
  <motion.img layoutId={`gallery-${id}`} />
- Background: backdrop-filter: blur(20px) + rgba(0,0,0,0.9)
- Navigation: Arrow keys (← →) to browse, Escape to close
- Counter: "3 / 12" in mono font, top-right
- Close: X button + click outside + Escape
- Transition: 0.5s, ease: [0.76, 0, 0.24, 1]
```

---

## SERVICES PAGE (/services)

```
HERO:
- Video background: production console/mixing desk footage
- Headline: "WHAT WE DO" (kinetic reveal)
- Body: "Full-spectrum experiential production. From the first sketch to the final strike."

SERVICE CATEGORIES:
CURRENT: Four-column text list — readable but dry

REDESIGN: Expandable service cards
- Each category as a horizontal accordion row
- Full-width, border-bottom: 1px solid var(--border)
- Collapsed: Category name (Display font, 1.5rem) + short description
- Expanded: Detailed description + capability list + relevant project image
- Click to expand (only one open at a time)
- Animation: height auto (GSAP), content fades in with stagger

SPECIALTY CARDS:
- Standard card layout but with hover video preview
- Card shows static image, hover plays 3-5s loop
- Same magnetic hover as global buttons
```

---

## ABOUT PAGE (/about)

```
HERO:
- FIX: Do NOT reuse homepage image
- Use unique BTS/production footage or team/workspace video
- Headline: "THE TEAM BEHIND THE TECH" (kinetic reveal)

COMPANY STORY:
- Editorial layout: large pull-quote + body text columns
- Pull-quote: Display font, 2rem, accent color — "We don't just produce events. We engineer awe."

TEAM SECTION:
CURRENT: Vertical stack with photos. Dense bio text.

REDESIGN:
- Horizontal scroll carousel on desktop (draggable)
- Each card: Team photo (aspect 3:4) + name + role + 2-line bio
- Photo treatment: Slight desaturation, full color on hover
- On click: Expand to modal with full bio + credentials highlights
- Credential highlights use mono font for specificity

RESPONSIVE: Stack vertically on mobile
```

---

## RENTALS PAGE (/rentALS)

```
HERO:
- Crowd silhouettes with lighting (retain — fits context)
- Headline: "GEAR THAT DELIVERS" (kinetic reveal)

PRODUCT SPECS:
CURRENT: "—" dash bullets, no visual hierarchy

REDESIGN:
- Same SVG node indicators as case study Key Features
- Spec values in JetBrains Mono
- "Available" badges: accent color bg, small pill
- Filter by category with animated tabs

RENTAL CARDS:
- Image + product name + daily rate + availability badge
- Hover: image zoom + specs overlay
- Same scroll-triggered reveal animation
```

---

## CONTACT PAGE (/contact)

```
CURRENT: Best-designed page. Comprehensive form.

RETAIN:
- Two-column layout
- Field labels and required indicators
- Service checkboxes (two-column grid)
- Budget selector dropdown

ENHANCE:
- Form field focus states: accent color border glow
- Submit button: magnetic effect
- Success state: animated checkmark SVG + confetti burst
- Background: subtle animated mesh gradient (very faint)
```

---

## TECHNICAL ARCHITECTURE

### Animation Stack
| Library | Purpose | When to Use |
|---------|---------|-------------|
| **GSAP + ScrollTrigger** | Scroll-triggered reveals, parallax, staggers, timelines | Primary animation engine for all scroll-based effects |
| **GSAP SplitText** | Character/word-level text animations | Hero headlines, section headings |
| **Lenis** | Smooth scroll with inertia | Global scroll behavior, synced with GSAP ticker |
| **Three.js** | WebGL image hover distortions | Work grids, gallery hover effects |
| **Framer Motion** | Page transitions, layout animations, magnetic buttons | Route transitions, FLIP animations, React component animations |
| **next/font** | Font optimization | All font loading (Inter, JetBrains Mono, Display font) |

### Performance Budget
```
Hero video:          < 5MB (AV1/WebM primary, H.265 fallback)
WebGL effects:       Disabled on mobile (< 768px)
GSAP animations:     Use will-change sparingly; prefer transform + opacity
Images:              WebP/AVIF format, lazy-loaded below fold
Fonts:               Subset display fonts; preload critical weights (400, 700)
JS bundles:          Code-split Three.js (dynamic import, ssr: false)
Total page weight:   < 2MB first load (excluding video)
```

### Accessibility Requirements
```
- prefers-reduced-motion:
  → All video backgrounds fallback to static poster image
  → Kinetic typography: show text immediately, skip animation
  → WebGL effects: show static images
  → Ticker: stop animation, show as static list
  → All transitions: instant (no animation)

- Custom video player:
  → Full keyboard control (tab navigation, shortcuts)
  → ARIA labels on all controls
  → Focus trapping in lightbox

- Color contrast:
  → All text meets WCAG AA (4.5:1 minimum)
  → Interactive elements: visible focus rings

- Screen readers:
  → Skip-to-content link
  → Semantic heading hierarchy
  → Alt text on all images
```

### Image Asset Pipeline
```
INPUT: High-res source images (PNG/TIFF from Beatrox)
PROCESS:
  1. Convert to WebP with cwebp (quality 85)
  2. Generate responsive srcset: 400w, 800w, 1200w, 1600w, 2000w
  3. Use next/image for automatic optimization
  4. Lazy load below-fold images
  5. Set priority={true} on above-fold hero images

VIDEO ASSETS:
  1. Source: ProRes or high-bitrate H.264 masters
  2. Process through FFmpeg pipeline (see Hero section)
  3. Host on Vercel Edge (same domain) or dedicated CDN
  4. Set Cache-Control: public, max-age=31536000, immutable
```

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1) — D+ → B+
| # | Task | Details |
|---|------|---------|
| 1 | Set up design tokens | Colors, typography (next/font), spacing, easing |
| 2 | Implement Lenis smooth scroll | Global, synced with GSAP ticker |
| 3 | Build scroll-aware header | Hide/show on scroll direction + backdrop blur |
| 4 | Replace all hero images with video | FFmpeg pipeline, <video> element with multi-format sources |
| 5 | Rewrite all hero copy | Per spec — eliminate redundancy, add punch |
| 6 | Implement GSAP SplitText on hero H1s | Staggered character reveal on every page |
| 7 | Set up scroll-triggered reveals | Global pattern for all sections below fold |
| 8 | Implement nav hover animations | Character swap + magnetic BOOK NOW button |
| 9 | Add page transitions | Framer Motion AnimatePresence setup |

### Phase 2: Interaction Layer (Week 2) — B+ → A-
| # | Task | Details |
| --- |------|---------|
| 10 | Build asymmetric bento work grid | CSS Grid with varying spans, all projects |
| 11 | Implement WebGL hover distortions | Three.js shader pipeline, single canvas |
| 12 | Build kinetic capabilities ticker | Dual-row marquee + hover video portals |
| 13 | Add horizontal marquee | Scroll-velocity-reactive, homepage bottom |
| 14 | Build custom video player | React component with ambient canvas lighting |
| 15 | Redesign case study metadata | Editorial schematic grid with mono font |
| 16 | Implement gallery lightbox | FLIP zoom + keyboard navigation |

### Phase 3: Polish (Week 3) — A- → A
| # | Task | Details |
|---|------|---------|
| 17 | SVG animated node indicators | Replace all "—" bullets (case studies, rentals, services) |
| 18 | Footer curtain reveal | Fixed footer, z-index -1 reveal |
| 19 | Per-page copy refinements | All remaining rewrites from spec |
| 20 | Mobile responsive pass | Disable WebGL, simplify layouts, test all interactions |
| 21 | Accessibility audit | prefers-reduced-motion, keyboard nav, contrast, ARIA |
| 22 | Performance optimization | Code splitting, image optimization, Core Web Vitals |
| 23 | Cross-browser testing | Safari (H.265), Chrome/Edge (AV1), Firefox (fallback) |

---

## ASSET GENERATION PROMPTS

### Hero Video Content (for Beatrox to provide or commission)
```
DURATION: 8-12 seconds, seamless loop
RESOLUTION: 1920x1080 minimum
CONTENT MIX:
  - Shot 1: Wide angle of laser show in dark venue, colored beams cutting through haze
  - Shot 2: Drone formation in night sky, geometric patterns with LED lights
  - Shot 3: Close-up of production console, hands on controls, screens glowing
  - Shot 4: Crowd silhouettes with dramatic backlighting, hands raised
  - Shot 5: Projection mapping on building facade, geometric patterns
  - Shot 6: Behind-the-scenes: rigging crew positioning truss/lights
COLOR GRADING: Dark, moody, desaturated with neon accent highlights.
  Shadows: deep blacks. Highlights: subtle color (blue, purple, amber).
MOTION: Slow, deliberate camera movements. No fast cuts.
AUDIO: None (muted loop)
```

### Capability Preview Videos (12 short loops)
```
Each: 5 seconds, silent, shows the specific capability in action
Example for "Drone Light Shows": Night sky, drones forming shapes
Example for "Laser Light Shows": Colored laser beams in haze
Example for "Projection Mapping": Building facade with projected art
DELIVERY: 480x270 (quarter-res), WebM AV1, < 500KB each
```

### Project Photography
```
Run for the Oceans (Adidas): Marathon activation, runners, LED installations
AKU World (NFT Miami): Purple/pink immersive environment, digital art displays
Projekt X (Adriatique): Stage design, dramatic lighting, crowd
MyShelter (Adidas): Product launch, branded environment, interactive elements
FORMAT: High-res TIFF/RAW source → WebP delivery
ASPECT RATIOS: Mix of 16:9 (wide), 4:5 (vertical), 1:1 (square) for bento grid
```

---

## BENCHMARK REFERENCE

Study these sites for the standard we're targeting:

| Agency | URL | What They Do Right |
|--------|-----|-------------------|
| **Obscura Digital** | obscuradigital.com | Dark, immersive, project-forward with video heroes |
| **Moment Factory** | momentfactory.com | Editorial case studies, cinematic video, refined typography |
| **Tait Towers** | taittowers.com | Technical precision, engineering-forward layout |
| **NERD** | nerd.tv | Minimal, typographically bold, animation-rich |
| **Lusion** | lusion.co | WebGL mastery, real-time 3D, award-winning interactions |
| **Resn** | resn.co.nz | Gooey interactions, narrative-driven, cinematic |

The common thread: **every one of these sites feels like an experience before you read a single word.** That's the target.

---

## VERDICT

The current Beatrox website is a functional informational site with clear navigation and readable copy. For a local service business, it would be acceptable. For an agency that deploys laser shows, custom robotics, drone formations, and immersive environments for global brands — it is a significant brand dilution.

The gap between what Beatrox *does* and what the site *communicates* is the core problem. Every page should feel like stepping into one of their installations. This plan provides the complete technical blueprint to close that gap.

**The investment is medium-complexity, high-impact.** The technical stack (GSAP, Three.js, Lenis, Framer Motion) is well-documented and proven. Begin with Phase 1 — those changes alone transform the site from D+ to B+. Phases 2 and 3 push it to A-grade elite status.

---

*End of Redesign Plan*
