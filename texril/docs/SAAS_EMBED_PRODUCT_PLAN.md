# SaaS Embed Rich Text Editor – Product & Implementation Plan

## 1. Product Vision & Positioning

**Goal:**
একটা high-quality, web-based rich text editor বানানো যা SaaS হিসেবে বিক্রি হবে এবং সহজে embed করা যাবে যে কোনো LMS / WordPress / course platform-এ, iframe বা script loader দিয়ে।

**Core positioning:**
- **"Web-based SaaS embed = সবার থেকে সেরা"** – কারণ core logic সবসময় তোমার server-এ থাকবে, তারা শুধু embed করবে।
- First-class support: **WordPress → পরে অন্য LMS/XML platforms**।
- Target market: **course creators, LMS owners, agencies** যারা better editor চায় কিন্তু নিজে build/maintain করতে চায় না।

## 2. Business Model Overview

- **SaaS subscription** (monthly / yearly)
  - Free / trial tier (usage limit / watermark / limited features)
  - Pro tier (domain-based license, more seats, AI tools)
  - Agency / Enterprise tier (multiple domains, priority support)
- Billing rules:
  - **Billing cancel / payment failed** → embed editor কাজ করা বন্ধ / limited mode
  - **Domain-based licensing** → প্রতি domain এর জন্য আলাদা license
  - **Per-seat বা per-active-user** add-on রাখা যাবে ভবিষ্যতে

## 3. High-Level Architecture (SaaS Embed Model)

1. **Core Editor SaaS** (Next.js / Node backend + DB)
   - Multi-tenant architecture (প্রতি customer = 1 tenant বা org)
   - Document storage, user management, usage tracking, billing integration
2. **Embed Layer**
   - `iframe` বা `script loader` যা যেকোনো LMS/WordPress page-এ embed হবে
   - Example conceptual pattern (not code):
     - WordPress plugin → shortcode/block → তোমার SaaS-এর script/iframe inject করবে
3. **Auth & Licensing Layer**
   - Domain whitelist
   - Signed JWT token per user/session
   - API key / client_id per tenant
   - Rate limit, abuse detection
4. **Dashboard (SaaS Web App)**
   - Customer login করবে
   - Domain configure, API keys, usage stats, billing, team members manage করবে
   - Marketing upsell: **"Want full LMS? Try our platform"**

## 4. Why SaaS Embed (vs Plugin-Only) – Strategically

### A) কোনো source code ই যায় না

- User side-এ শুধু iframe/script loader থাকে
- Core logic সব তোমার private server-এ থাকে
- Server-side Next.js bundle / logic তারা access করতে পারবে না
- কেউ plugin null করে editor clone করতে পারবে না

### B) তুমি full control এ থাকবে

- তুমি চাইলে:
  - User suspend করতে পারো
  - Token expire করে embed বন্ধ করে দিতে পারো
  - Per-domain licensing enforce করতে পারো
  - Real-time usage limit enforce করতে পারো
  - Domain-level verification করতে পারো
- Plugin-based model এ এগুলো খুব limited / easily bypassable.

### C) Full SaaS business control

- তুমি **monthly recurring enforce** করতে পারো
- Billing cancel হলে → embed editor read-only / disabled
- AI features সবসময় তোমার server থেকে securely run হবে
- Central dashboard থেকে সব customers manage করা যাবে

### D) Industry standard উদাহরণ

- Grammarly (browser extension & web embed)
- Typeform embed
- Tawk.to widget
- Intercom script loader
- Notion embed, modern LMS editors (remote JS embed)
- CodeMirror SaaS implementations

এগুলো সবই একই model follow করে: remote SaaS + embed.

## 5. Target Compatibility & Market Fit

Target product claim:

> "Compatible with: Moodle, TalentLMS, Thinkific, Kajabi, Teachable, LearnDash, TutorLMS, WordPress, Canvas LMS, Open edX, Blackboard"

**Reality strategy:**
- প্রাথমিক version এ **WordPress** (LearnDash, TutorLMS সহ) কে first-class support দিবে।
- বাকি LMS গুলোর জন্য common integration pattern তৈরি করবে:
  - Embed via iframe/script
  - Small connector snippets / docs per platform

### Market Segments

1. **WordPress LMS Users**
   - LearnDash
   - TutorLMS
   - LifterLMS (future)
2. **Hosted course platforms**
   - Kajabi, Teachable, Thinkific → custom code/embed blocks
3. **Enterprise / edu LMS**
   - Moodle, Canvas, Open edX, Blackboard
   - Typically allow custom HTML/JS blocks or LTI-like integration

## 6. Phase 1 – WordPress Implementation (MVP)

**Objectives:**
- WordPress plugin build করা
- LearnDash/TutorLMS course lesson editor এর জায়গায় তোমার SaaS editor embed করা
- Basic licensing & domain locking ready রাখা

### 6.1 WordPress Plugin Scope

- Plugin features:
  - Settings page: SaaS API key, Tenant ID, default domain, environment URL
  - Gutenberg block / Classic editor button / shortcode:
    - Example usage in content: `[saas_editor field="lesson_body"]`
  - Integration hooks for:
    - LearnDash: lesson/topic content fields
    - TutorLMS: lesson content field
  - Simple license validation:
    - Plugin call করবে তোমার SaaS `/license/validate` endpoint
    - Response অনুযায়ী editor load হবে বা warning দেখাবে

### 6.2 Embed Flow (WordPress)

1. Site admin তোমার SaaS-এ account খুলবে
2. Dashboard থেকে:
   - WordPress domain add করবে
   - API key / client_id generate করবে
3. WordPress plugin:
   - Settings-এ API key + domain set করবে
   - প্রতি editor load এ:
     - Signed token fetch করবে (server-to-server অথবা client-side signed token)
     - iframe/src বা script tag render করবে যেমন:
       - `https://your-saas.com/embed?token=SIGNED_TOKEN&context=lesson&lesson_id=123`

### 6.3 Security for WordPress MVP

- **Domain locking:**
  - SaaS-এ প্রতি tenant এর জন্য `allowed_domains`
- **Signed JWT token:**
  - Contains: tenant_id, user_id, role, domain, expiry
- **Rate limiting:**
  - প্রতি tenant-এর জন্য embed/API call limit
- **No offline version:**
  - Editor UI + logic সবসময় তোমার server থেকে আসবে (no local build).

## 7. Phase 2 – Generic LMS Compatibility Layer

Goal: একবার architecture build হয়ে গেলে, নতুন LMS এর জন্য শুধু **"integration recipe"** publish করতে হবে।

Tasks:
- Standardized embed parameters design:
  - `context_type` (course, lesson, quiz, assignment)
  - `context_id`
  - `user_id`, `role`
- Per-LMS docs:
  - Moodle: custom HTML block + JS init
  - Canvas: app/ext embed guide
  - Open edX: XBlock / custom component approach (later)
  - Blackboard: content editor script embed

## 8. Dashboard & Admin Features (SaaS Core)

- Tenant management
- Domain management (add/remove/verify)
- API keys / secret rotation
- Usage analytics:
  - Active users, documents, storage
  - Requests per day
- Billing integration (Stripe ইত্যাদি)
- Feature flags (AI enabled, collaboration, templates)

## 9. Roadmap (Short Summary)

1. **MVP (WordPress focus)**
   - Core SaaS editor stable (already building)
   - Simple multi-tenant model
   - WordPress plugin (LearnDash + TutorLMS integration)
   - Domain locking + JWT auth
2. **Early Access**
   - 10–20 WordPress LMS sites onboard
   - Feedback → UX & performance tuning
3. **LMS Expansion**
   - Docs + snippets for Kajabi, Teachable, Thinkific
   - Moodle simple embed guide
4. **Enterprise / Edu**
   - Canvas, Open edX, Blackboard integrations
   - SSO / LTI-style integrations (later phase)

এই document টা high-level plan হিসেবে থাকবে। Implementation details (API contract, DB schema, plugin code structure) আলাদা technical spec এ break down করা যাবে পরের ধাপে।
