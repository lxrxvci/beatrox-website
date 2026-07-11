# BEATROX Website - Complete Front-End, Back-End & Architecture Audit
## Expanded Audit with PostgreSQL, Prisma, Sales Funnels, Scheduling & Subdomain Strategy

**Audit Date:** July 7, 2026
**Audited URLs:** https://beatrox-website.vercel.app/ (staging) | https://www.beatrox.com/ (production)
**Overall Grade: C+ (Needs Immediate Attention)**

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Critical Issues](#3-critical-issues)
4. [Front-End Deep Dive](#4-front-end-deep-dive)
5. [Back-End Deep Dive](#5-back-end-deep-dive)
6. [Architecture Decisions Analysis](#6-architecture-decisions-analysis)
   - 6.1 PostgreSQL as Backend Database
   - 6.2 Prisma as Schema Tool
   - 6.3 Sales Funnels for Services
   - 6.4 Integrated Scheduling System
   - 6.5 Subdomain Architecture Strategy
7. [Database Schema Design](#7-database-schema-design)
8. [API Architecture (tRPC + Prisma)](#8-api-architecture)
9. [Security Audit](#9-security-audit)
10. [SEO & Marketing Assessment](#10-seo--marketing-assessment)
11. [Performance Audit](#11-performance-audit)
12. [Accessibility Audit](#12-accessibility-audit)
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [Risk Analysis](#14-risk-analysis)
15. [Recommendations](#15-recommendations)

---

## 1. EXECUTIVE SUMMARY

The BEATROX website is currently a **static Next.js application** hosted on Vercel with no functional backend. While the visual design is strong and content architecture is well-organized, the site has **critical failures** that prevent lead capture and suffers from a divergence between staging (beatrox-website.vercel.app) and production (www.beatrox.com).

### The Five Architectural Decisions

| Decision | Impact | Complexity |
|----------|--------|------------|
| PostgreSQL backend database | Transforms static site into data-driven application | Medium |
| Prisma as schema/ORM tool | Type-safe database layer, replaces Drizzle default | Medium |
| Sales funnels for services | New revenue stream, requires dynamic content | High |
| Integrated scheduling system | Customer self-service, requires calendar integration | High |
| Subdomain architecture | Multi-tenant separation of concerns | Medium |

### Gap Between Current State and Target Architecture

```
CURRENT STATE                              TARGET ARCHITECTURE
----------------                           --------------------
Static Next.js                             Full-Stack React + tRPC
No database                                PostgreSQL + Prisma
No API layer                               tRPC routers + Zod validation
Broken contact form (Formspree placeholder) Integrated scheduling + sales funnels
Single domain (vercel.app)                 Subdomains: agency, rentals, production
No user sessions                           OAuth + JWT auth
Hardcoded content                          CMS-driven dynamic content
No analytics                               Full analytics + conversion tracking
```

---

## 2. CURRENT STATE ASSESSMENT

### 2.1 Technology Stack (Current)

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend Framework | Next.js (React) | Confirmed |
| Styling | CSS Modules / Tailwind | Likely |
| Animation | Framer Motion or GSAP | Suspected |
| Images | Static assets (no optimization) | Confirmed |
| Forms | Formspree (BROKEN - placeholder) | Confirmed |
| Hosting | Vercel | Confirmed |
| Analytics | None detected | Confirmed |
| CMS | None (hardcoded) | Confirmed |
| Backend API | None | Confirmed |
| Database | None | Confirmed |

### 2.2 Page Inventory

| Page | Route | Status | Content Source |
|------|-------|--------|----------------|
| Homepage | / | Active | Hardcoded |
| About | /about | Active | Hardcoded |
| Work (Portfolio) | /work | Active | Hardcoded |
| Work Detail | /work/[slug] | Active | Hardcoded |
| Work by Tag | /work/tag/[tag] | Active | Hardcoded |
| Services | /services | Active | Hardcoded |
| Rentals | /rentals | Active | Hardcoded |
| Team | /team | Active | Hardcoded |
| Contact | /contact | **BROKEN** | Formspree placeholder |

### 2.3 Feature Comparison: Staging vs Production

| Feature | beatrox-website.vercel.app | www.beatrox.com | Notes |
|---------|---------------------------|-----------------|-------|
| **Design Theme** | Dark, modern (2025) | Lighter, older | Significant visual divergence |
| **Cart/Shop** | Missing | Present | Production has e-commerce |
| **Rentals Page** | Present | Missing | Staging has new page |
| **Navigation** | 6 items + no cart | 5 items + cart | Different IA |
| **Address** | 8625 NE Halsey St | 4822 NE Sandy Blvd | **Data inconsistency** |
| **Email** | No link | hello@beatrox.com | Missing on staging |
| **Phone** | No link | Present | Missing on staging |
| **Copyright** | 2026 | 2025 | Different |
| **Brand Logo** | B E A T R O X | BEATROX | Spacing differs |

**Assessment:** The staging site (vercel.app) appears to be an incomplete redesign that has not been properly reconciled with production data.

---

## 3. CRITICAL ISSUES

### 3.1 CRITICAL - Contact Form 100% Non-Functional
- **Endpoint:** `https://formspree.io/f/placeholder`
- **Error:** "Form not found - Please check the form hashid"
- **Business Impact:** Zero lead capture. Every potential client who fills out the form hits a dead end.
- **Fix Priority:** Immediate - before any other work

### 3.2 CRITICAL - Staging/Production Data Divergence
- Two different business addresses across environments
- Missing contact information on staging (email, phone)
- Different navigation structures
- Risk of deploying incorrect business information

### 3.3 HIGH - No Analytics
- No Google Analytics 4, GTM, Meta Pixel, or Vercel Analytics
- Flying blind on user behavior, conversion rates, and traffic sources

### 3.4 HIGH - Missing Security Headers
- No Content-Security-Policy
- No X-Frame-Options
- No Referrer-Policy
- No Permissions-Policy

---

## 4. FRONT-END DEEP DIVE

### 4.1 Visual Design Assessment

| Element | Score | Notes |
|---------|-------|-------|
| Typography | 8/10 | Good hierarchy, clean sans-serif, adequate sizing |
| Color Scheme | 8/10 | Consistent dark theme with accent colors |
| Imagery | 9/10 | High-quality project photography |
| Layout | 7/10 | Clean grids, some awkward spacing on wide screens |
| Mobile Responsiveness | 7/10 | Functional but needs refinement |
| Animation/Transitions | 7/10 | Smooth but may impact performance |
| CTA Placement | 6/10 | Present but could be more prominent |
| Footer | 6/10 | Adequate but missing social proof elements |

### 4.2 Component-Level Issues

| Component | Issue | Severity |
|-----------|-------|----------|
| Hero Section | Large unoptimized images | Medium |
| Work Cards | No lazy loading visible | Medium |
| Gallery Expand | No loading state/feedback | Low |
| Service Lists | Wall of text, poor scannability | Medium |
| Team Photos | Some have inconsistent sizing | Low |
| Navigation | No mobile hamburger menu visible | Medium |
| Footer | Missing newsletter signup | Low |

### 4.3 Front-End Technical Debt

1. **Image Optimization Missing** - No `next/image` usage, no WebP/AVIF conversion, no responsive images
2. **No Error Boundaries** - Component crashes could take down entire pages
3. **No Loading States** - Route transitions and data fetching lack skeleton loaders
4. **Hardcoded Content** - All text is embedded in components; no CMS or content API
5. **No Type System Evidence** - Likely not using TypeScript strictly
6. **No Component Library** - Inconsistent UI patterns across pages

---

## 5. BACK-END DEEP DIVE

### 5.1 Current Backend State: NON-EXISTENT

The website is a purely static frontend with:
- No API endpoints
- No database
- No server-side rendering (beyond Next.js static generation)
- No authentication/authorization
- No session management
- No data persistence layer

### 5.2 Infrastructure

| Element | Status | Provider |
|---------|--------|----------|
| Hosting | Active | Vercel |
| SSL/HTTPS | Active | Vercel (auto) |
| CDN | Active | Vercel Edge |
| DNS | Active | Vercel / Third-party |
| Edge Functions | Not used | - |
| Serverless Functions | Not used | - |
| Custom Domain (prod) | Active | www.beatrox.com |
| Custom Domain (staging) | Not configured | beatrox-website.vercel.app |

### 5.3 What Needs to Be Built

```
REQUIRED BACKEND COMPONENTS:
----------------------------
1. Hono HTTP server (tRPC middleware)
2. tRPC router system with Zod validation
3. PostgreSQL database with Prisma ORM
4. OAuth 2.0 authentication (admin/customer roles)
5. Contact form API endpoint
6. Sales funnel API endpoints
7. Scheduling system API endpoints
8. Content management API (for dynamic pages)
9. Image upload/storage service
10. Analytics tracking API
11. Webhook handlers (calendar, payment)
12. Admin dashboard API
```

---

## 6. ARCHITECTURE DECISIONS ANALYSIS

### 6.1 PostgreSQL as Backend Database

**Decision:** Use PostgreSQL as the native database system for all backend data.

**Assessment:**

| Aspect | Analysis | Grade |
|--------|----------|-------|
| Data Integrity | ACID compliance, foreign keys, constraints - excellent | A+ |
| JSON Support | Native JSONB for flexible content schemas - ideal for CMS | A |
| Full-Text Search | Built-in tsvector for project/portfolio search | A |
| Concurrency | MVCC handles multiple users well | A |
| Scalability | Vertical first, read replicas available | B+ |
| Hosting Cost | Free tier on Supabase/Neon, paid on AWS/RDS | B+ |
| Complexity | More complex than SQLite, requires managed instance | B |

**Recommended Schema for BEATROX:**

```sql
-- Core Business Tables
users                    -- Admin accounts, customer accounts
projects                 -- Portfolio work items
project_images           -- Gallery images per project
project_tags             -- Tag taxonomy (event-production, etc.)
services                 -- Service offerings with funnel configs
service_funnel_steps     -- Sales funnel stage definitions
rental_categories        -- LED walls, sound, DJ, lighting, etc.
rental_products          -- Individual rental items
rental_inventory         -- Availability tracking
contacts                 -- Form submissions (CRITICAL fix)
consultations            -- Scheduled consultations
consultation_slots       -- Available time slots
calendar_events          -- Integrated calendar data
settings                 -- Site configuration
```

**Recommendation:** Proceed with PostgreSQL. Use **Supabase** or **Neon** for managed hosting with generous free tiers. Both offer connection pooling (PgBouncer) which is critical for serverless deployments.

---

### 6.2 Prisma as Schema Tool

**Decision:** Use Prisma as the standard for schema and database management.

**Assessment:**

| Aspect | Analysis | Grade |
|--------|----------|-------|
| Type Safety | Full TypeScript types generated from schema | A+ |
| Schema Definition | Declarative, intuitive Prisma Schema Language | A+ |
| Migration System | Prisma Migrate - production-ready | A |
| Query API | Prisma Client - fluent, type-safe queries | A |
| IDE Support | Excellent VSCode extension | A |
| Migration from Drizzle | Requires rewrite of existing code | B |
| Bundle Size | Larger than Drizzle (but acceptable for server) | B |
| Raw SQL Fallback | Available when needed | A |

**Note on Stack Compatibility:**
The default backend-building skill uses **Drizzle ORM + MySQL**. The decision to use **Prisma + PostgreSQL** requires a custom stack configuration:

```
Custom Stack Required:
- Replace Drizzle ORM with Prisma Client
- Replace MySQL with PostgreSQL
- Replace drizzle.config.ts with prisma/schema.prisma
- Update api/queries/connection.ts for Prisma
- Keep tRPC + Hono (these are ORM-agnostic)
- Update all query files to use Prisma syntax
```

**Prisma Schema Preview for BEATROX:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      UserRole @default(CUSTOMER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  consultations Consultation[]
  contacts      Contact[]
}

model Project {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  client      String
  location    String?
  description String   @db.Text
  techStack   String[]
  partners    String[]
  featured    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  images ProjectImage[]
  tags   ProjectTag[]
}

model Service {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  category    ServiceCategory
  description String   @db.Text
  funnelSteps Json?    // Sales funnel configuration
  pricing     Json?    // Variable pricing tiers
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Contact {
  id        String   @id @default(cuid())
  name      String
  email     String
  company   String?
  location  String?
  budget    BudgetRange?
  message   String   @db.Text
  status    ContactStatus @default(NEW)
  createdAt DateTime @default(now())
  
  userId String?
  user   User?   @relation(fields: [userId], references: [id])
}

model Consultation {
  id        String   @id @default(cuid())
  startTime DateTime
  endTime   DateTime
  status    ConsultationStatus @default(SCHEDULED)
  notes     String? @db.Text
  createdAt DateTime @default(now())
  
  userId String
  user   User   @relation(fields: [userId], references: [id])
}

enum UserRole {
  ADMIN
  CUSTOMER
}

enum BudgetRange {
  UNDER_10K
  K10_TO_25K
  K25_TO_50K
  K50_TO_100K
  K100_TO_250K
  OVER_250K
  UNSURE
}

enum ContactStatus {
  NEW
  CONTACTED
  QUALIFIED
  CONVERTED
  ARCHIVED
}

enum ConsultationStatus {
  SCHEDULED
  CONFIRMED
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum ServiceCategory {
  DESIGN
  BUILD
  TECHNICAL
  PRODUCTION
  RENTAL
}
```

**Recommendation:** Proceed with Prisma. It's an excellent choice for this project. Budget extra time for the custom stack setup (departing from the default Drizzle/MySQL template).

---

### 6.3 Sales Funnels for Services

**Decision:** Implement service-specific sales funnels for all offerings.

**Current State Analysis:**

The current Services page lists offerings in four categories (Design, Build, Technical, Production) as static text. There is **no conversion mechanism** beyond a generic contact form that is broken.

**Gap Analysis:**

| Current State | Required for Sales Funnels | Gap |
|--------------|---------------------------|-----|
| Static service list | Interactive funnel per service | Major |
| Generic contact form | Service-specific lead capture | Major |
| No pricing | Transparent pricing tiers | Major |
| No qualification | Automated client qualification | Major |
| No CRM integration | Lead tracking & nurturing | Major |
| No analytics | Funnel analytics & A/B testing | Major |

**Proposed Sales Funnel Architecture:**

```
SALES FUNNEL FLOW PER SERVICE:
-------------------------------
1. AWARENESS
   - Service landing page (SEO optimized)
   - Related portfolio projects
   - Client testimonials/case studies
   
2. INTEREST
   - Interactive service configurator
   - Visual examples & capabilities
   - Downloadable spec sheets
   
3. CONSIDERATION
   - Transparent pricing calculator
   - Comparison with other services
   - FAQ & common objections
   
4. INTENT
   - Consultation booking (scheduling system)
   - Quote request form
   - Live chat availability
   
5. CONVERSION
   - Proposal generation
   - Contract e-signature
   - Deposit payment
   
6. POST-CONVERSION
   - Project portal access
   - Milestone tracking
   - Feedback collection
```

**Database Requirements for Funnels:**

```
funnel_configs          -- Per-service funnel configuration
funnel_steps            -- Individual step definitions
funnel_conversions      -- User progress through funnels
funnel_analytics        -- Step-by-step conversion data
lead_scores             -- Automated lead qualification
```

**Recommendation:** This is a high-impact, high-complexity feature. Start with **one funnel** (e.g., "LED Video Wall Rentals") as a pilot, then replicate across services. Requires significant frontend and backend work.

---

### 6.4 Integrated Scheduling System

**Decision:** Implement an integrated calendar scheduling system for automated consultation booking.

**Current State Analysis:**

The contact page has a "Book a Discovery Call" CTA but **no actual scheduling functionality**. The broken form is the only path to consultation.

**Gap Analysis:**

| Feature | Current | Required |
|---------|---------|----------|
| Real-time availability | None | Calendar integration |
| Self-service booking | None | User-selectable time slots |
| Time zone handling | None | Automatic detection |
| Calendar sync | None | Google/Outlook integration |
| Reminders | None | Email/SMS notifications |
| Rescheduling | None | Self-service modification |
| Cancellation | None | Self-service cancellation |
| Buffer time | None | Configurable between meetings |
| Meeting types | None | Discovery, technical review, site visit |

**Technical Architecture:**

```
SCHEDULING SYSTEM COMPONENTS:
-----------------------------
1. CALENDAR PROVIDER INTEGRATION
   - Google Calendar API (primary)
   - Microsoft Outlook/Graph API (secondary)
   - iCal feed support
   
2. AVAILABILITY ENGINE
   - Business hours configuration
   - Staff-specific schedules
   - Blackout dates/holidays
   - Buffer time between meetings
   - Min/max advance booking
   
3. BOOKING API
   - Slot availability query
   - Booking creation
   - Rescheduling
   - Cancellation
   - Conflict detection
   
4. NOTIFICATION SYSTEM
   - Confirmation emails
   - Reminder emails (24hr, 1hr)
   - Cancellation notifications
   - Rescheduling notifications
   
5. MEETING INTEGRATION
   - Google Meet auto-generation
   - Zoom link integration
   - Teams link integration
```

**Database Requirements:**

```
calendar_providers       -- Connected calendar accounts
availability_rules       -- Business hours & rules
consultation_types       -- Meeting type definitions
consultation_slots       -- Available/generated time slots
consultations            -- Booked meetings
consultation_participants -- Attendee records
notifications            -- Scheduled notification queue
```

**Third-Party Options:**

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **Cal.com** (self-hosted) | Full control, white-label | Hosting overhead | Free self-hosted |
| **Calendly** | Easy setup, established | Limited branding, monthly cost | $10-20/seat/mo |
| **SavvyCal** | Developer-friendly | Smaller ecosystem | $12-20/mo |
| **Custom build** | Full control, integrated | Development time | Free (dev cost) |

**Recommendation:** Start with **Cal.com self-hosted** or **Calendly embed** for speed to market, then migrate to a custom-integrated solution. The database schema should be designed to accommodate either approach.

---

### 6.5 Subdomain Architecture Strategy

**Decision:** Use subdomains to separate agency, production services, and rental content.

**Current State:**

Single domain with all content mixed together:
- beatrox-website.vercel.app/ (homepage - agency)
- beatrox-website.vercel.app/services (services - mixed)
- beatrox-website.vercel.app/rentals (rentals)
- beatrox-website.vercel.app/work (portfolio)

**Proposed Architecture:**

```
SUBDOMAIN STRATEGY:
-------------------
www.beatrox.com          -- Main agency site (brand, portfolio, about)
                         -- Hero: "Experiential Design & Event Production"
                         -- Primary CTA: "Book a Consultation"
                         
services.beatrox.com     -- Service-specific funnels
                         -- Detailed service pages with pricing
                         -- Interactive configurators
                         -- Case studies per service
                         -- Primary CTA: "Get a Quote"
                         
rentals.beatrox.com      -- Equipment rental catalog
                         -- Product listings with specs
                         -- Availability calendar
                         -- Online quote builder
                         -- Primary CTA: "Request a Rental Quote"
                         
book.beatrox.com         -- Scheduling system (or embed)
                         -- Consultation booking
                         -- Meeting type selection
                         -- Calendar view
                         
admin.beatrox.com        -- Internal admin dashboard
                         -- Lead management (CRM)
                         -- Project management
                         -- Content management
                         -- Analytics dashboard
```

**Implementation Approaches:**

| Approach | Pros | Cons | Complexity |
|----------|------|------|------------|
| **Monorepo with subdomains** | Shared components, single deploy | Larger codebase | Medium |
| **Separate apps per subdomain** | Independent scaling, teams | Code duplication | High |
| **Single app with subdomain routing** | Simplest setup | Less separation | Low |

**DNS Configuration Required:**

```
# Vercel Project Setup
- Create separate Vercel projects OR
- Use Vercel's multi-domain feature

# DNS Records
CNAME  www.beatrox.com     -> cname.vercel-dns.com
CNAME  services.beatrox.com -> cname.vercel-dns.com
CNAME  rentals.beatrox.com  -> cname.vercel-dns.com
CNAME  book.beatrox.com     -> cname.vercel-dns.com
CNAME  admin.beatrox.com    -> cname.vercel-dns.com

# Vercel Domain Config
- Add all subdomains to project
- Configure subdomain routing in vercel.json
```

**Shared Infrastructure:**

```
SHARED ACROSS SUBDOMAINS:
-------------------------
- PostgreSQL database (same instance, schema-separated)
- Prisma ORM (shared schema package)
- tRPC API (shared backend or API gateway)
- Authentication (SSO across subdomains)
- Design system (shared component library)
- CDN/Assets (shared Vercel edge network)
- Analytics (cross-subdomain tracking)
```

**Recommendation:** Start with the **monorepo approach** using a shared database and component library. This allows incremental rollout of subdomains while maintaining consistency.

---

## 7. DATABASE SCHEMA DESIGN

### 7.1 Complete Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============== CORE ==============

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  phone         String?
  company       String?
  role          UserRole  @default(CUSTOMER)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  consultations Consultation[]
  contacts      Contact[]
  quotes        Quote[]
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ============== PORTFOLIO ==============

model Project {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  client      String
  clientLogo  String?
  location    String?
  heroImage   String
  description String   @db.Text
  objective   String?  @db.Text
  concept     String?  @db.Text
  outcome     String?  @db.Text
  techStack   String[]
  partners    String[]
  videoUrl    String?
  featured    Boolean  @default(false)
  published   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  images ProjectImage[]
  tags   ProjectTag[]
}

model ProjectImage {
  id        String  @id @default(cuid())
  url       String
  caption   String?
  order     Int     @default(0)
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model ProjectTag {
  id        String  @id @default(cuid())
  name      String  @unique
  slug      String  @unique
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

// ============== SERVICES & FUNNELS ==============

model Service {
  id             String          @id @default(cuid())
  slug           String          @unique
  title          String
  category       ServiceCategory
  subtitle       String?
  description    String          @db.Text
  features       String[]
  pricingNotes   String?         @db.Text
  heroImage      String?
  icon           String?
  funnelEnabled  Boolean         @default(false)
  funnelConfig   Json?           // Custom funnel step configuration
  published      Boolean         @default(true)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  funnelEntries  FunnelEntry[]
  pricingTiers   PricingTier[]
}

model PricingTier {
  id          String   @id @default(cuid())
  serviceId   String
  name        String
  description String?
  priceRange  String   // Display string like "$5,000 - $10,000"
  features    String[]
  isPopular   Boolean  @default(false)
  order       Int      @default(0)
  service     Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
}

model FunnelEntry {
  id          String        @id @default(cuid())
  serviceId   String
  userEmail   String
  userName    String?
  currentStep Int           @default(1)
  formData    Json?         // Accumulated form data through funnel
  status      FunnelStatus  @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  service Service @relation(fields: [serviceId], references: [id])
}

// ============== RENTALS ==============

model RentalCategory {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?  @db.Text
  image       String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())

  products RentalProduct[]
}

model RentalProduct {
  id           String   @id @default(cuid())
  categoryId   String
  name         String
  slug         String   @unique
  description  String   @db.Text
  specs        Json?    // Flexible spec storage
  images       String[]
  dailyRate    Decimal? @db.Decimal(10, 2)
  weeklyRate   Decimal? @db.Decimal(10, 2)
  monthlyRate  Decimal? @db.Decimal(10, 2)
  availability AvailabilityStatus @default(AVAILABLE)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  category RentalCategory @relation(fields: [categoryId], references: [id])
}

// ============== CONTACTS & CRM ==============

model Contact {
  id        String        @id @default(cuid())
  name      String
  email     String
  phone     String?
  company   String?
  location  String?
  budget    BudgetRange?
  service   String?       // Which service they're interested in
  message   String        @db.Text
  source    String        @default("website") // funnel, direct, referral
  status    ContactStatus @default(NEW)
  assignedTo String?      // Admin user ID
  notes     String?       @db.Text
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  userId String?
  user   User?   @relation(fields: [userId], references: [id])
}

// ============== SCHEDULING ==============

model ConsultationType {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  description     String?
  duration        Int      // Minutes
  bufferBefore    Int      @default(0)
  bufferAfter     Int      @default(0)
  minNoticeHours  Int      @default(24)
  maxNoticeDays   Int      @default(30)
  color           String?  // Calendar color
  createdAt       DateTime @default(now())

  consultations Consultation[]
}

model Consultation {
  id                 String               @id @default(cuid())
  typeId             String
  userId             String
  startTime          DateTime
  endTime            DateTime
  status             ConsultationStatus   @default(SCHEDULED)
  meetingLink        String?
  notes              String?              @db.Text
  cancellationReason String?
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt

  type ConsultationType @relation(fields: [typeId], references: [id])
  user User             @relation(fields: [userId], references: [id])
}

model AvailabilityRule {
  id        String   @id @default(cuid())
  dayOfWeek Int      // 0-6 (Sunday-Saturday)
  startTime String   // "HH:mm" format
  endTime   String   // "HH:mm" format
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

model BlackoutDate {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  reason    String?
  createdAt DateTime @default(now())
}

// ============== QUOTES ==============

model Quote {
  id          String      @id @default(cuid())
  userId      String
  serviceId   String?
  rentalIds   String[]    // Array of rental product IDs
  status      QuoteStatus @default(DRAFT)
  totalAmount Decimal?    @db.Decimal(12, 2)
  details     Json?       // Line items
  validUntil  DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user User @relation(fields: [userId], references: [id])
}

// ============== SETTINGS ==============

model SiteSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  updatedAt DateTime @updatedAt
}

// ============== ANALYTICS ==============

model PageView {
  id        String   @id @default(cuid())
  path      String
  referrer  String?
  userAgent String?
  ipHash    String?  // Hashed for privacy
  createdAt DateTime @default(now())
}

model FunnelEvent {
  id          String   @id @default(cuid())
  funnelId    String
  step        Int
  event       String   // "view", "complete", "abandon"
  userEmail   String?
  metadata    Json?
  createdAt   DateTime @default(now())
}

// ============== ENUMS ==============

enum UserRole {
  ADMIN
  CUSTOMER
}

enum ServiceCategory {
  DESIGN
  BUILD
  TECHNICAL
  PRODUCTION
  RENTAL
}

enum FunnelStatus {
  ACTIVE
  COMPLETED
  ABANDONED
}

enum AvailabilityStatus {
  AVAILABLE
  LIMITED
  UNAVAILABLE
  BOOKED
}

enum ContactStatus {
  NEW
  CONTACTED
  QUALIFIED
  CONVERTED
  ARCHIVED
}

enum ConsultationStatus {
  SCHEDULED
  CONFIRMED
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
  DECLINED
  EXPIRED
}
```

### 7.2 Schema Statistics

| Category | Tables | Purpose |
|----------|--------|---------|
| Core/Auth | 5 | Users, sessions, OAuth accounts |
| Portfolio | 3 | Projects, images, tags |
| Services | 3 | Services, pricing tiers, funnel entries |
| Rentals | 2 | Categories, products |
| CRM | 1 | Contact/lead management |
| Scheduling | 4 | Consultations, types, availability, blackouts |
| Sales | 1 | Quotes |
| Settings | 1 | Site configuration |
| Analytics | 2 | Page views, funnel events |
| **TOTAL** | **22 tables** | |

---

## 8. API ARCHITECTURE (tRPC + Prisma)

### 8.1 Router Structure

```
api/
 router.ts                    # Main app router
 middleware.ts                # Auth & role middleware
 lib/
   hono.ts                    # Hono app instance
   prisma.ts                  # Prisma client singleton
   auth.ts                    # Auth helpers
 routers/
   auth.ts                    # OAuth + session management
   project.ts                 # Portfolio CRUD
   service.ts                 # Service + funnel operations
   rental.ts                  # Rental catalog
   contact.ts                 # Contact form + CRM
   consultation.ts            # Scheduling system
   quote.ts                   # Quote builder
   analytics.ts               # Tracking + reporting
   settings.ts                # Site configuration
   admin.ts                   # Dashboard data
```

### 8.2 Example Router (Contact)

```typescript
// api/routers/contact.ts
import { z } from "zod";
import { router, publicProcedure } from "../middleware";
import { prisma } from "../lib/prisma";

export const contactRouter = router({
  submit: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      company: z.string().optional(),
      location: z.string().optional(),
      budget: z.enum(["UNDER_10K", "K10_TO_25K", "K25_TO_50K", 
                       "K50_TO_100K", "K100_TO_250K", "OVER_250K", "UNSURE"]).optional(),
      service: z.string().optional(),
      message: z.string().min(10),
    }))
    .mutation(async ({ input }) => {
      const contact = await prisma.contact.create({
        data: {
          ...input,
          status: "NEW",
          source: "website",
        },
      });
      
      // Trigger notification (email to admin)
      // await sendNotificationEmail(contact);
      
      return { success: true, id: contact.id };
    }),

  list: adminProcedure
    .input(z.object({
      status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "ARCHIVED"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      return prisma.contact.findMany({
        where: input?.status ? { status: input.status } : undefined,
        take: input?.limit ?? 50,
        skip: input?.offset ?? 0,
        orderBy: { createdAt: "desc" },
      });
    }),
});
```

---

## 9. SECURITY AUDIT

### 9.1 Current Security Posture

| Layer | Status | Risk |
|-------|--------|------|
| SSL/TLS | Active (Vercel) | Low |
| DDoS Protection | Vercel default | Low-Medium |
| WAF | Not configured | Medium |
| Security Headers | Missing | **High** |
| Form Validation | None client-side | **High** |
| Rate Limiting | None | **High** |
| Authentication | None | N/A (no auth yet) |
| Data Encryption | None (no data) | N/A |
| Input Sanitization | None | **High** |
| XSS Protection | None | **High** |
| CSRF Protection | None | **High** |

### 9.2 Required Security Headers (Vercel Config)

```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.vercel-insights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://vitals.vercel-insights.com; frame-ancestors 'none';"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

### 9.3 Authentication Requirements

```
AUTHENTICATION STRATEGY:
------------------------
1. ADMIN AUTH (OAuth 2.0)
   - Role: ADMIN
   - Access: Dashboard, CRM, content management
   - Method: OAuth 2.0 with JWT sessions
   
2. CUSTOMER AUTH (Optional)
   - Role: CUSTOMER
   - Access: Project portal, consultation history, quotes
   - Method: Magic link or OAuth
   
3. PUBLIC ACCESS
   - No auth required
   - Rate limited API endpoints
   - CAPTCHA on forms
```

### 9.4 Data Protection

| Requirement | Implementation |
|-------------|---------------|
| GDPR compliance | Privacy policy, cookie consent, data deletion |
| CCPA compliance | Do Not Sell, consumer rights |
| Data encryption at rest | PostgreSQL native encryption |
| Data encryption in transit | TLS 1.3 |
| Password storage | bcrypt (if local auth added) |
| PII handling | Minimize collection, secure storage |
| Audit logging | Track admin actions |

---

## 10. SEO & MARKETING ASSESSMENT

### 10.1 Current SEO Status

| Element | Status | Impact |
|---------|--------|--------|
| Title Tags | Present, descriptive | Positive |
| Meta Descriptions | Present | Positive |
| Semantic HTML | Partial | Neutral |
| Heading Hierarchy | Generally good | Positive |
| URL Structure | Clean, keyword-rich | Positive |
| Image Alt Text | Unknown | Check needed |
| Structured Data | **Missing** | **Negative** |
| Open Graph Tags | Unknown | Check needed |
| Twitter Cards | Unknown | Check needed |
| XML Sitemap | Unknown | Check needed |
| Robots.txt | Unknown | Check needed |
| Canonical URLs | Unknown | Check needed |
| Page Speed | Unknown (likely slow) | **Negative** |
| Mobile Experience | Functional | Neutral |
| Internal Linking | Good navigation | Positive |
| Blog/Content | **Missing** | **Negative** |
| Backlink Profile | Unknown | Check needed |

### 10.2 Required SEO Improvements for New Architecture

```
SEO PRIORITIES:
---------------
1. Add Structured Data (JSON-LD)
   - Organization schema (beatrox.com)
   - LocalBusiness schema (Portland, OR)
   - CreativeWork schema (portfolio projects)
   - Service schema (each service offering)
   - Event schema (if applicable)
   - FAQ schema (service pages)
   - BreadcrumbList schema (all pages)

2. Create Content Hub
   - Blog: "Behind the Scenes" project stories
   - Case studies with rich media
   - Industry insights and trends
   - Equipment guides (for rentals)

3. Technical SEO
   - Generate sitemap.xml dynamically
   - Configure robots.txt
   - Implement canonical URLs
   - Add hreflang if international
   - Configure 301 redirects (staging to production)

4. Local SEO
   - Google Business Profile optimization
   - Local citations (Yelp, Eventective, etc.)
   - Location-based landing pages
   - Client testimonials with Schema markup
```

### 10.3 Sales Funnel SEO

Each sales funnel needs dedicated SEO:

```
FUNNEL SEO STRUCTURE:
--------------------
/services/led-video-walls/          -- Main service page
/services/led-video-walls/pricing   -- Pricing & packages
/services/led-video-walls/case-studies -- Related projects
/services/led-video-walls/faq       -- Common questions
/services/led-video-walls/quote     -- Quote request (noindex)
```

---

## 11. PERFORMANCE AUDIT

### 11.1 Current Performance Issues

| Metric | Estimated | Target | Gap |
|--------|-----------|--------|-----|
| LCP (Largest Contentful Paint) | 3-5s | < 2.5s | **Poor** |
| FID (First Input Delay) | Unknown | < 100ms | Unknown |
| CLS (Cumulative Layout Shift) | High | < 0.1 | **Poor** |
| FCP (First Contentful Paint) | 1.5-2.5s | < 1.8s | Borderline |
| TTFB (Time to First Byte) | Fast (Vercel) | < 600ms | Good |
| Total Page Weight | 5-10MB | < 3MB | **Poor** |
| JavaScript Bundle | Unknown | < 200KB | Unknown |
| Image Weight | 3-8MB | < 1MB | **Poor** |

### 11.2 Performance Optimization Plan

```
OPTIMIZATION ROADMAP:
---------------------
1. IMAGES (Highest Impact)
   - Convert all images to WebP/AVIF
   - Implement responsive images (srcset)
   - Add blur placeholder for LCP images
   - Lazy load below-fold images
   - Use CDN for image delivery
   
2. CODE SPLITTING
   - Route-based code splitting
   - Component-level lazy loading
   - Dynamic imports for heavy components
   
3. CACHING
   - Configure Vercel edge caching
   - Add Cache-Control headers
   - Implement stale-while-revalidate
   
4. FONTS
   - Use next/font or font-display: swap
   - Preload critical fonts
   - Subset font files
   
5. THIRD-PARTY SCRIPTS
   - Defer non-critical scripts
   - Load analytics asynchronously
   - Use Partytown for heavy scripts
```

### 11.3 Backend Performance Considerations

```
API PERFORMANCE:
----------------
- Connection pooling (PgBouncer) - REQUIRED for serverless
- Query optimization with Prisma
- Database indexing strategy
- Redis caching layer (for hot data)
- Rate limiting to prevent abuse
- Request/response compression
- Edge caching for static API responses
```

---

## 12. ACCESSIBILITY AUDIT

### 12.1 Current Accessibility Status

| Check | Status | WCAG Level |
|-------|--------|------------|
| Color contrast (main) | Likely passes AA | AA |
| Color contrast (body text) | May fail AA | AA |
| Keyboard navigation | Unknown | A |
| Focus indicators | Unknown | AA |
| ARIA labels | Partial | A |
| Alt text | Unknown | A |
| Skip links | **Missing** | A |
| Reduced motion | **Missing** | A |
| Screen reader support | Unknown | A |
| Form labels | Present | A |
| Heading hierarchy | Generally good | A |

### 12.2 Required Accessibility Improvements

```
A11Y FIXES:
-----------
1. Add skip-to-content link
2. Ensure all interactive elements are keyboard accessible
3. Add visible focus indicators (2px outline)
4. Implement prefers-reduced-motion
5. Add ARIA landmarks (main, nav, aside, footer)
6. Ensure form error messages are announced
7. Add aria-live regions for dynamic content
8. Test with screen reader (NVDA/VoiceOver)
9. Verify color contrast ratios (4.5:1 for text)
10. Add aria-expanded to collapsible sections
```

---

## 13. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| Set up PostgreSQL database (Supabase/Neon) | Critical | 1 day |
| Configure Prisma ORM with schema | Critical | 2 days |
| Set up tRPC + Hono backend | Critical | 2 days |
| Fix contact form (working endpoint) | Critical | 1 day |
| Add security headers | Critical | 1 day |
| Deploy to Vercel with env vars | Critical | 1 day |
| Add analytics (Vercel + GA4) | High | 1 day |
| Set up subdomain routing | High | 2 days |

### Phase 2: Core Features (Weeks 3-6)

| Task | Priority | Effort |
|------|----------|--------|
| Implement auth (OAuth 2.0) | High | 3 days |
| Build portfolio API (projects, images, tags) | High | 3 days |
| Build services API with dynamic content | High | 3 days |
| Build rentals catalog API | High | 3 days |
| Create admin dashboard | High | 5 days |
| Add structured data (JSON-LD) | Medium | 2 days |
| Implement image optimization | Medium | 2 days |
| Add sitemap.xml generation | Medium | 1 day |

### Phase 3: Sales Funnels (Weeks 7-10)

| Task | Priority | Effort |
|------|----------|--------|
| Design funnel data model | High | 2 days |
| Build funnel API endpoints | High | 4 days |
| Create service configurator UI | High | 5 days |
| Implement pricing calculator | High | 3 days |
| Build quote request system | High | 3 days |
| Add funnel analytics tracking | Medium | 3 days |
| A/B testing framework | Low | 3 days |

### Phase 4: Scheduling (Weeks 11-14)

| Task | Priority | Effort |
|------|----------|--------|
| Design scheduling data model | High | 2 days |
| Build availability engine | High | 4 days |
| Integrate calendar provider (Cal.com/Google) | High | 4 days |
| Build booking UI | High | 4 days |
| Implement notification system | High | 3 days |
| Add meeting link generation | Medium | 2 days |
| Build admin calendar view | Medium | 3 days |

### Phase 5: Polish & Launch (Weeks 15-16)

| Task | Priority | Effort |
|------|----------|--------|
| Performance optimization | High | 3 days |
| Accessibility improvements | High | 2 days |
| Cross-browser testing | High | 2 days |
| Mobile responsiveness audit | High | 2 days |
| SEO final review | Medium | 2 days |
| Security audit | High | 2 days |
| Documentation | Medium | 2 days |
| Production deployment | Critical | 2 days |

**Total Estimated Timeline: 16 weeks (4 months)**

---

## 14. RISK ANALYSIS

### 14.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Custom stack (Prisma vs Drizzle) causes issues | Medium | High | Thorough testing, fallback plan |
| PostgreSQL connection limits (serverless) | Medium | High | Use PgBouncer, connection pooling |
| Calendar API rate limits | Medium | Medium | Implement caching, queue pattern |
| Subdomain SEO dilution | Medium | Medium | Proper canonical tags, cross-linking |
| Image storage costs | Low | Medium | Use Cloudflare R2 or S3 |
| Performance regression with dynamic content | Medium | High | Implement caching, optimize queries |

### 14.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Extended timeline delays ROI | Medium | High | Phased launch, MVP first |
| Staging/production data divergence | High | **Critical** | Reconcile data before any deployment |
| Contact form downtime = lost leads | High | **Critical** | Fix immediately, before any other work |
| Complex funnels confuse users | Medium | Medium | User testing, iterative refinement |
| Scheduling no-shows | Medium | Low | Reminders, confirmation required |

### 14.3 Resource Requirements

| Resource | Est. Cost/Month | Notes |
|----------|----------------|-------|
| Vercel Pro | $20/mo | Required for team features |
| PostgreSQL (Supabase) | $0-25/mo | Free tier sufficient initially |
| Prisma | $0 (self-hosted) | Free for self-hosted |
| Cal.com / Calendly | $0-12/mo | Self-hosted Cal.com is free |
| Image CDN (Cloudflare) | $0 | Free tier generous |
| Google Analytics | $0 | Free |
| Email service (Resend) | $0-20/mo | Free tier: 3,000 emails/mo |
| Domain (already owned) | $0 | Using existing beatrox.com |
| **Total Monthly** | **$20-77/mo** | |

---

## 15. RECOMMENDATIONS

### Immediate Actions (This Week)

1. **Fix the contact form** - This is bleeding leads RIGHT NOW
2. **Reconcile staging/production data** - Address and phone must match
3. **Add analytics** - Start collecting data immediately
4. **Add security headers** - Zero-cost security improvement

### Short-Term (Next 4 Weeks)

5. **Set up PostgreSQL + Prisma** - Database foundation
6. **Build tRPC API layer** - Backend infrastructure
7. **Migrate content to database** - Projects, services, team
8. **Build admin dashboard** - Content management
9. **Fix all critical SEO gaps** - Structured data, sitemap

### Medium-Term (Next 3 Months)

10. **Launch rentals.beatrox.com** - Separate rental experience
11. **Implement first sales funnel** - LED Video Walls pilot
12. **Deploy scheduling system** - Self-service booking
13. **Add quote builder** - Rental/service quoting

### Long-Term (Next 6 Months)

14. **Full subdomain rollout** - services, book, admin
15. **Customer portal** - Project tracking for clients
16. **Advanced analytics** - Funnel optimization
17. **Marketing automation** - Email nurturing sequences

---

## APPENDIX A: TECHNOLOGY STACK (Recommended)

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 19.x |
| Build Tool | Vite | 6.x |
| Language | TypeScript | 5.7+ |
| Styling | Tailwind CSS | 3.4+ |
| Components | shadcn/ui | latest |
| Routing | react-router | v7 |
| State Management | React Query (tRPC) | latest |
| Backend Framework | Hono | latest |
| API Layer | tRPC | 11.x |
| Validation | Zod | 3.x |
| Database | PostgreSQL | 15+ |
| ORM | Prisma | 6.x |
| Auth | OAuth 2.0 + JWT | - |
| Scheduling | Cal.com API | v2 |
| Email | Resend | latest |
| Hosting | Vercel | - |
| CDN | Vercel Edge | - |
| Images | Next/Image + Cloudflare | - |
| Analytics | Vercel Analytics + GA4 | - |

## APPENDIX B: SUBDOMAIN DNS CONFIGURATION

```
; DNS Zone File for beatrox.com
$ORIGIN beatrox.com.

; A Records (if using A records instead of CNAME)
; @     A     76.76.21.21    ; Vercel IP (use CNAME preferred)

; CNAME Records (recommended)
www          CNAME   cname.vercel-dns.com.
services     CNAME   cname.vercel-dns.com.
rentals      CNAME   cname.vercel-dns.com.
book         CNAME   cname.vercel-dns.com.
admin        CNAME   cname.vercel-dns.com.
api          CNAME   cname.vercel-dns.com.

; Vercel verification
_vercel      TXT     "vc-domain-verify=..."

; SPF Record (for email)
@            TXT     "v=spf1 include:_spf.google.com ~all"

; DMARC
_dmarc       TXT     "v=DMARC1; p=quarantine; rua=mailto:dmarc@beatrox.com"
```

## APPENDIX C: ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/beatrox?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/beatrox?schema=public"

# Auth (OAuth)
OAUTH_CLIENT_ID=""
OAUTH_CLIENT_SECRET=""
OAUTH_ISSUER_URL=""
JWT_SECRET=""

# API
API_BASE_URL="https://api.beatrox.com"
TRPC_URL="/api/trpc"

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="hello@beatrox.com"
ADMIN_EMAIL="admin@beatrox.com"

# Calendar
CAL_COM_API_KEY=""
CAL_COM_WEBHOOK_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Storage
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="beatrox-assets"
R2_PUBLIC_URL="https://assets.beatrox.com"

# Analytics
GA_MEASUREMENT_ID="G-..."
VERCEL_ANALYTICS_ID=""

# App
APP_URL="https://www.beatrox.com"
NODE_ENV="production"
```

---

*This audit was conducted on July 7, 2026. The recommendations are based on industry best practices and the specific requirements outlined for the BEATROX website redesign and backend implementation.*
