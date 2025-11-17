# Texril SaaS Dashboard & Billing – Full Plan

## 1. Goal & Scope

- লক্ষ্য: Texril editor-এর জন্য এমন একটা **SaaS management system** বানানো যেখানে:
  - তুমি (system owner) tenants create/modify করতে পারবে, package/plan activate করতে পারবে।
  - Tenant নিজেও self-service ভাবে signup, payment করে নিজের account চালু করতে পারবে।
  - Landing page থেকে সরাসরি Stripe / PayPal দিয়ে subscription নিয়ে dashboard-এ ঢুকতে পারবে।
- Output:
  - **Admin dashboard (for you)**
  - **Tenant dashboard (for customers)**
  - **Public landing + pricing page**

## 2. Core Roles & Concepts

1. **System Owner / Super Admin (You)**
   - সব tenants manage করবে (create, suspend, plan change, manual billing adjust)।
   - Internal settings (feature flags, global limits, pricing, tax rules) control করবে।
2. **Tenant (Customer Account)**
   - একটি কোম্পানি / সাইট / agency = 1 tenant।
   - Tenant-এর own domains, API keys, users, usage, billing থাকে।
3. **Tenant Admin / Editor Users**
   - Tenant admin: domains, API key, billing info, team manage করবে।
   - Editor users: শুধু editor embed ব্যবহার করবে (WordPress, LMS ইত্যাদিতে)।
4. **Plans / Packages**
   - যেমন: Starter, Pro, Agency.
   - প্রতি plan-এ limits: কতটা domain, কত embed, কত storage, কোন feature (AI, audio, math ইত্যাদি)।
5. **Subscription & Billing**
   - Stripe / PayPal subscription object ↔ Texril `Subscription` record sync।
   - Status: active, trialing, past_due, canceled, unpaid ইত্যাদি।
6. **Integrations / Platforms**
   - Target platforms: WordPress, LearnDash, TutorLMS, Moodle, TalentLMS, Thinkific, Kajabi, Teachable, Canvas LMS, Open edX, Blackboard, Salesforce ইত্যাদি।
   - Dashboard-এর মধ্যে এগুলোকে আলাদা **platform** হিসেবে manage করা হবে (per-tenant integration status, config, app-store install info)।

## 3. High-Level Architecture (App + Landing)

1. **Domains**
   - `www.texril.com` → public landing + pricing + docs।
   - `app.texril.com` → login, dashboard, tenant management।
2. **App Stack**
   - Next.js app (already আছে) → routes ভাগ করে landing + app একেই codebase-এ রাখা যায়:
     - `/` → marketing/landing
     - `/pricing` → packages
     - `/app/*` → SaaS dashboard (auth required)
3. **Auth & Multi-tenant**
   - Auth: email/password + social login optional (later)।
   - প্রতি logged-in user-এর সাথে `tenantId` linked থাকবে।
   - Super Admin users-এর role: `role = super_admin` (সব tenant দেখতে পারবে)।

## 4. Data Model (High-Level)

- `tenants`
  - `id`, `name`, `slug`, `status` (active/suspended), `createdAt` ইত্যাদি।
- `tenant_domains`
  - `tenantId`, `domain`, `verified`, `addedBy`।
- `users`
  - `id`, `tenantId`, `email`, `role` (super_admin, tenant_admin, editor)।
- `plans`
  - `id`, `code` (starter, pro, agency), `name`, `limits`, `priceMonthly`, `priceYearly`।
- `subscriptions`
  - `id`, `tenantId`, `planId`, `status`, `billingProvider` (stripe/paypal), `externalId`, `currentPeriodEnd`।
- `api_keys`
  - `id`, `tenantId`, `key`, `status`, `createdAt`, `lastUsedAt`।
- `platforms`
  - `id`, `code` (wordpress, moodle, talentlms, thinkific, kajabi, teachable, learndash, tutorlms, canvas, openedx, blackboard, salesforce ইত্যাদি), `name`, `category` (lms, cms, app_store, crm), `isActive`।
- `tenant_integrations`
  - `tenantId`, `platformId`, `status` (enabled/disabled/blocked), `externalId` (যেমন: Thinkific app install id, Teachable integration id, Salesforce org id), `config` (JSON blob for platform-specific settings), `createdAt`।
- `usage_events` / `stats`
  - Per tenant usage snapshot (requests, embeds, storage, per-platform breakdown)।

## 5. Public Landing & Signup Flow

1. **Landing Page Content (www.texril.com)**
   - Hero section: Texril কী, কাদের জন্য, core value (better editor for LMS/WordPress & popular LMS platforms)।
   - Feature sections: TipTap-based rich features, math, audio, tables, SaaS security, domain locking।
   - Compatible with: WordPress, LearnDash, TutorLMS, Moodle, TalentLMS, Thinkific, Kajabi, Teachable, Canvas LMS, Open edX, Blackboard, Salesforce integrations।
   - `How it works`: WordPress/LMS plugin + SaaS dashboard + iframe/script embed flow।
   - Social proof (later): logos, testimonials।
2. **Pricing Page (`/pricing`)**
   - Plan cards: Starter / Pro / Agency (per-domain or per-tenant pricing স্পষ্ট)।
   - প্রতিটা card এ CTA: **"Start free trial" / "Subscribe"**।
   - Monthly / yearly toggle।
3. **Self-Service Signup + Checkout Flow**
   - User plan select করবে → "Continue" ক্লিক।
   - Step 1: Account তৈরি: name, email, password, company/site name।
   - Step 2: Payment provider: Stripe / PayPal select।
   - Step 3: Hosted checkout page (Stripe Checkout / Billing Portal, অথবা PayPal subscription)।
   - Payment success হলে:
     - নতুন `tenant` create।
     - `subscription` record create ও plan attach।
     - Domain add করার পেজে redirect: `/app/onboarding/domain`।
   - Email: "Welcome to Texril" + quick setup instructions + WordPress plugin guide।

## 6. Super Admin Dashboard (Owner Panel)

1. **Tenant List & Detail**
   - Table view: `tenant name`, `plan`, `status`, `domains`, `usage`, `createdAt`।
   - Detail page: tenant-এর সমস্ত info:
     - domains list, API keys, subscriptions, usage chart।
2. **Manual Tenant Creation & Plan Assignment**
   - Internal form: নাম, contact email, initial plan, trial length।
   - Use case: তুমি direct deal করলে manual করে onboarding।
3. **Integrations Overview (By Platform)**

   - Global view: প্রতি platform (WordPress, Moodle, TalentLMS, Thinkific, Kajabi, Teachable, LearnDash, TutorLMS, Canvas LMS, Open edX, Blackboard, Salesforce) অনুযায়ী কতগুলো active tenant আছে, usage কেমন, error rate কত 7া দেখা যাবে।
   - App-store based integrations-এর জন্য (Thinkific app store, Teachable integration listing, Salesforce AppExchange ইত্যাদি):
     - প্রতি listing-এর status (draft, live, deprecated) ও listing URL রাখা হবে।
     - প্রয়োজন হলে প্রতি marketplace-এর client id/secret, webhook endpoint config থেকে manage করার অপশন থাকবে (internal only, tenant-visible না)।

4. **Plan Upgrade/Downgrade & Suspension**
   - Super admin-UI থেকে tenant-এর plan পরিবর্তন করা (Stripe/PayPal-এর সাথে sync করে)।
   - "Suspend" করলে:
     - `subscriptions.status` update + editor embed `/api/license/validate` থেকে `allowed=false` পাবে।
5. **Global Settings**
   - Default limits per plan, feature flags enable/disable।
   - API key rotation rules (maximum keys per tenant, revoke policy)।

## 7. Tenant Dashboard (Customer Panel)

1. **Overview Page**
   - Current plan, next billing date, usage summary (embeds/day, storage, active domains)।
   - Quick links: "Configure integrations (WordPress/LMS)", "Add domain", "View API key"।
2. **Domains Management**
   - Add domain: `example.com` → verify via DNS txt বা HTML tag (later; initial phase simple)।
   - Domain status: pending / verified / blocked।
3. **Integrations (WordPress, LMS, CRM)**

   - Tenant এখানে নিজের ব্যবহার করা platform গুলো configure করবে:
     - WordPress, LearnDash, TutorLMS, Moodle, TalentLMS, Thinkific, Kajabi, Teachable, Canvas LMS, Open edX, Blackboard, Salesforce ইত্যাদি।
   - প্রতি integration card-এ:
     - Status: Not connected / Connected / Blocked।
     - Platform-specific নির্দেশনা (যেমন WordPress plugin install steps, Moodle block snippet, Canvas LTI/app link)।
     - যদি app-store ভিত্তিক হয় (Thinkific App Store, Teachable integration listing) → external install id/external URL দেখাবে।
   - Tenant level থেকে কোন কোন platform-এর জন্য Texril embed চালু আছে, সেটা এক জায়গা থেকে control করা যাবে।

4. **API Keys Management**
   - Generate new key, revoke old key, view last used।
   - Show WordPress setup snippet (what to put in plugin settings)।
5. **Billing & Subscription Page**
   - Show plan details, invoices (fetched from Stripe/PayPal)।
   - Button: "Change plan" → Stripe Customer Portal বা custom upgrade flow।
   - Cancel subscription, update payment method (via provider’s portal)।

## 8. Billing Integration (Stripe + PayPal)

1. **Stripe (Recommended primary)**
   - Use **Stripe Billing + Checkout**:
     - Products = Texril plans।
     - Prices = monthly/yearly variants।
   - Webhooks: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted` ইত্যাদি।
   - Webhook handler:
     - tenant/subscription record update করে।
     - `/api/license/validate` যে billing status ধরে, সেটা এখানে sync।
2. **PayPal (Optional / Phase 2)**
   - PayPal Subscriptions বা PayPal via Paddle/other aggregator।
   - Similar webhook-like IPN/notification → subscription status sync।
3. **License Validation Coupling**
   - `/api/license/validate` endpoint শুধু এই জিনিসগুলো দেখবে:
     - tenant active? subscription status = active/trialing?
     - domain allowed? usage limit cross করেছে কিনা?
   - যদি fail করে → editor embed বন্ধ বা read-only mode।

## 9. Security, Roles & Compliance

- Strict multi-tenant isolation (per-tenant row level access control, tenantId-scope সব queries)।
- Role-based access control:
  - super_admin → সব tenants।
  - tenant_admin → নিজের tenant data।
  - editor → শুধুই editor embed context (কোনো billing/dashboard নেই)।
- Login security: strong password rules, rate limiting, later 2FA।
- Billing data: card data সব Stripe/PayPal side; তোমার DB-তে শুধু customer + subscription meta।

## 10. Implementation Roadmap

1. **Phase S1 – Internal Admin + Basic Tenant Model**
   - DB tables: tenants, users, plans, subscriptions, domains, api_keys basic form এ তৈরি।
   - Super admin login + tenant list & detail view।
   - Manual tenant create + plan assign + domain add।
   - `/api/license/validate` কে প্রকৃত subscription status ও domain check-এর সাথে connect করা।
2. **Phase S2 – Tenant Dashboard + Stripe Only Self-Service**
   - Public landing + pricing page।
   - Self-service signup flow (Stripe Checkout integration)।
   - Tenant dashboard: overview + domains + API key + basic billing view।
3. **Phase S3 – PayPal + Multi-Platform Integrations & Advanced Features**
   - PayPal integration (optional কিন্তু requested)।
   - Domain verification (DNS/HTML) + detailed usage analytics।
   - Email notifications (trial ending, payment failed, high usage)।
   - Multi-platform integrations dashboard: per-platform config (WordPress, LearnDash, TutorLMS, Moodle, TalentLMS, Thinkific, Kajabi, Teachable, Canvas LMS, Open edX, Blackboard, Salesforce) + app-store listing metadata (Thinkific App Store, Teachable integration listing, Salesforce AppExchange)।

## 11. Detailed Build Checklist (Delivery-Ready)

### Phase S1 – Super Admin Foundations

| Module | Tasks | Output |
| --- | --- | --- |
| **Schema & Migrations** | - Prisma models লিখা: `Tenant`, `TenantDomain`, `Plan`, `Subscription`, `ApiKey`, `User` (role enum সহ)।<br>- Base seed (default plans + super admin)। | `prisma/migrations/*`, `prisma/seed.ts` |
| **Auth Middleware** | - NextAuth / custom JWT setup.<br>- Role guard utility (e.g. `requireRole("super_admin")`) এবং `tenantId` context resolver। | `/lib/auth/*`, Edge middleware |
| **Super Admin UI** | - `/app/admin/tenants` list (filters: status, plan)।<br>- Tenant detail drawer: domains, keys, subscription snapshot।<br>- Actions: create tenant, suspend/reactivate, reset API key, manual plan change। | React server components + shadcn UI |
| **License API v1** | - `/api/license/validate` → tenant+domain+subscription check।<br>- `/api/embed/token` → short-lived JWT issue (context, expiry) । | Route handlers + tests |
| **Observability** | - Audit log table (`audit_events`) + helper to log admin actions।<br>- Basic rate limiting middleware for validation API। | `lib/audit.ts`, cron job stubs |

#### S1.1 Schema & Migration Specs (✅ detailed)

**Prisma model details**

```prisma
model Tenant {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  status        TenantStatus @default(ACTIVE)
  planId        String?
  currentPeriodEnd DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  domains       TenantDomain[]
  subscriptions Subscription[]
  apiKeys       ApiKey[]
  users         User[]
  integrations  TenantIntegration[]
  auditEvents   AuditEvent[]
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  TRIAL
}

model Plan {
  id            String   @id @default(cuid())
  code          String   @unique // starter, pro, agency
  name          String
  description   String?
  limits        Json     // { domains: 2, embeds: 5000, storageMB: 1024 }
  priceMonthly  Int?
  priceYearly   Int?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  subscriptions Subscription[]
  tenants       Tenant[]
}

model Subscription {
  id              String   @id @default(cuid())
  tenantId        String
  planId          String
  status          SubscriptionStatus @default(TRIALING)
  billingProvider BillingProvider @default(STRIPE)
  externalId      String? // stripe subscription id / paypal agreement id
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  trialEndsAt        DateTime?
  cancelAtPeriodEnd  Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  plan            Plan     @relation(fields: [planId], references: [id])
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
}

enum BillingProvider {
  STRIPE
  PAYPAL
  MANUAL
}

model TenantDomain {
  id        String   @id @default(cuid())
  tenantId  String
  domain    String
  verified  Boolean  @default(false)
  addedById String?
  createdAt DateTime @default(now())
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  addedBy   User?    @relation("UserAddedDomain", fields: [addedById], references: [id])
}

model ApiKey {
  id        String   @id @default(cuid())
  tenantId  String
  keyHash   String   // hashed for security
  label     String?
  status    ApiKeyStatus @default(ACTIVE)
  lastUsedAt DateTime?
  createdAt DateTime @default(now())
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
}

enum ApiKeyStatus {
  ACTIVE
  INACTIVE
  REVOKED
}

model User {
  id        String   @id @default(cuid())
  tenantId  String?
  email     String   @unique
  name      String?
  role      UserRole @default(EDITOR)
  passwordHash String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tenant    Tenant?  @relation(fields: [tenantId], references: [id])
  domainsAdded TenantDomain[] @relation("UserAddedDomain")
}

enum UserRole {
  SUPER_ADMIN
  TENANT_ADMIN
  EDITOR
}

model TenantIntegration {
  id          String   @id @default(cuid())
  tenantId    String
  platformId  String
  status      IntegrationStatus @default(NOT_CONNECTED)
  externalId  String?
  config      Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  platform    Platform @relation(fields: [platformId], references: [id])
}

enum IntegrationStatus {
  NOT_CONNECTED
  CONNECTED
  BLOCKED
}

model Platform {
  id        String   @id @default(cuid())
  code      String   @unique
  name      String
  category  PlatformCategory
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  integrations TenantIntegration[]
}

enum PlatformCategory {
  LMS
  CMS
  APP_STORE
  CRM
}

model AuditEvent {
  id        String   @id @default(cuid())
  actorId   String?
  tenantId  String?
  action    String   // e.g. "TENANT_SUSPENDED"
  payload   Json?
  createdAt DateTime @default(now())
  actor     User?    @relation(fields: [actorId], references: [id])
  tenant    Tenant?  @relation(fields: [tenantId], references: [id])
}
```

**Migration steps**

1. Create new migration `s1_init_multi_tenant` containing all models + enums above.
2. Seed script tasks:
   - Insert Starter/Pro/Agency plans with JSON limits (domains, embeds, storage, feature flags)।
   - Seed `Platform` records for WordPress, LearnDash, TutorLMS, Moodle, TalentLMS, Thinkific, Kajabi, Teachable, Canvas, OpenEdx, Blackboard, Salesforce।
   - Create initial `User` with `role = SUPER_ADMIN`, password hash env-driven।
3. Add SQL indexes:
   - `Tenant.slug`, `ApiKey.keyHash`, `TenantDomain.domain`, `Subscription.externalId`, `TenantIntegration.platformId+tenantId`.
4. Add MySQL/Postgres check constraints (if supported) for enforcing lowercase slug + domain uniqueness per tenant.

**Validation rules**

- `Tenant.slug` → kebab-case, unique, auto-generated from name but editable।
- `TenantDomain.domain` → FQDN only, stored lowercase, unique per tenant।
- API key generation → store only hash, return plaintext once।
- Plan limits JSON schema enforced via Zod when parsing (numbers for counts, booleans for features)।

**Implementation status**

- Prisma schema lives in `texril/prisma/schema.prisma` and matches the spec line‑for‑line (tenants, domains, plans, subscriptions, API keys, users, integrations, platforms, audit events, enums).
- Initial migration SQL captured under `texril/prisma/migrations/20251117000000_init/migration.sql` (generated via `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`).
- `npx prisma generate` + `npx prisma format` run successfully after the schema update.
- Pending step for local runs: set `DATABASE_URL` (PostgreSQL) before executing `npm run db:migrate && npm run db:seed`.

এই subsection এখন কেবল blueprint নয়, বাস্তব schema + migration ফাইলসহ সম্পূর্ণ — যেকোনো dev Postgres URL পেয়ে গেছেন মানেই migrations apply করতে পারবেন।

#### S1.2 Auth & Role Guard Blueprint (✅ detailed)

**Stack decision**

- Use **NextAuth.js** (Auth.js v5) with Credentials provider for now (email/password) + ability to plug social login later.
- Sessions stored in Prisma adapter tables (reuse existing database connection).
- Password hashing via `bcrypt` (pure JS-friendly for Edge/middleware) যাতে bundler সীমাবদ্ধতা এড়ানো যায়।
- JWT sessions (`session.strategy = "jwt"`) to keep App Router server actions simple; embed `tenantId` + `role` claims।

**Key files**

| File | Responsibility |
| --- | --- |
| `lib/auth/config.ts` | NextAuth config (providers, callbacks, session). |
| `lib/auth/hash.ts` | Helpers `hashPassword`, `verifyPassword`. |
| `lib/auth/guards.ts` | `requireUser()`, `requireRole()` server utilities (throws Redirect/Unauthorized). |
| `middleware.ts` | Edge middleware to protect `/app/*` routes, pass session cookie downstream. |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth route handlers (App Router convention)। |

**Session payload shape**

```ts
type SessionUser = {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "TENANT_ADMIN" | "EDITOR";
  tenantId?: string;
};

type Session = {
  user: SessionUser;
  tenantContext?: {
    id: string;
    slug: string;
    status: string;
  };
  expires: string;
};
```

**Callbacks**

- `authorize(credentials)` → lookup user by email, verify password hash.
- `session({ session, token })` → attach `tenantId`, `role` from token.
- `jwt({ token, user })` → on login set user info; on subsequent calls fetch tenant status if missing.

**Guard helpers**

```ts
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireRole(role: UserRole | UserRole[]) {
  const user = await requireUser();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.role)) notFound(); // or throw
  return user;
}

export async function requireTenantContext() {
  const user = await requireRole(["TENANT_ADMIN", "EDITOR"]);
  if (!user.tenantId) throw new Error("Tenant context missing");
  return user.tenantId;
}
```

**Route protection**

- `middleware.ts` checks pathname prefixes:
  - `/app/admin` → require `SUPER_ADMIN`.
  - `/app/tenant` → require tenant-bound user.
  - `/api/license/*` → allow but ensure rate limit (done later).
- Public routes (`/`, `/pricing`, `/docs`) bypass middleware.

**Login/Logout UI**

- `/login` page with shadcn form, uses server action `signIn`.
- `/logout` link triggers `signOut({ redirectTo: "/login" })`.
- Super admin creation seeded earlier; first login uses seeded credentials.

**Testing checklist**

- Unit test hashing helpers.
- E2E (Playwright) smoke: login as super admin, access `/app/admin/tenants`; ensure tenant admin is redirected if hitting admin route.
- Confirm middleware handles unauthenticated hitting `/app/...` by redirecting to `/login?callbackUrl=...`.

এই subsection ready থাকায় auth implementation শুরু করলে developer জানবে কোন ফাইল লাগবে, কীভাবে role guards enforce করতে হবে, আর কী কী acceptance criteria check করতে হবে।

#### S1.3 Super Admin UI Blueprint (✅ detailed)

**Primary routes**

| Route | Purpose | Access |
| --- | --- | --- |
| `/app/admin/layout.tsx` | Shell with sidebar + topbar (tenant search, user avatar) | SUPER_ADMIN |
| `/app/admin/tenants/page.tsx` | Paginated table of tenants | SUPER_ADMIN |
| `/app/admin/tenants/[tenantId]/page.tsx` | Detailed view with tabs (Overview, Domains, Subscriptions, API Keys, Audit) | SUPER_ADMIN |
| `/app/admin/plans/page.tsx` | Plan catalog editor | SUPER_ADMIN |
| `/app/admin/audit-log/page.tsx` | Global audit feed filterable by tenant/action | SUPER_ADMIN |

**UI components**

- `components/admin/AdminShell.tsx` – wraps pages with nav + breadcrumbs.
- `components/admin/TenantTable.tsx` – server component fetching tenants via Prisma, client subcomponents for filters/search.
- `components/admin/TenantDrawer.tsx` – slide-over to quick view/edit without full page navigation.
- `components/admin/forms/CreateTenantForm.tsx` – server action backed form (name, slug, plan, initial domain, contact email)।
- `components/admin/forms/PlanForm.tsx` – JSON editor for plan limits with schema validation (Zod + code editor view)।

**Tenant list requirements**

- Columns: Name, Status badge, Plan, Domains (#), Subscription status, Last activity, Actions.
- Filters: status multi-select, plan select, text search (name/slug/domain)।
- Bulk actions: suspend/reactivate selected tenants (confirmation modal)।
- Empty/zero state with CTA “Create first tenant”.

**Tenant detail tabs**

1. **Overview** – summary cards (plan, subscription dates, usage snapshot), quick actions (suspend, change plan, impersonate tenant dashboard)।
2. **Domains** – table of allowed domains with verification state; button to add domain manually; ability to mark verified/unverified।
3. **Subscriptions** – history timeline, link out to Stripe customer portal, ability to set manual status override (with confirmation + reason)।
4. **API Keys** – list hashed keys, last used, ability to revoke/regenerate (calls ApiKey server action)।
5. **Audit** – log entries filtered to tenant scope (from `AuditEvent`), export CSV।

**Server actions / APIs powering UI**

| Action | Input | Side effects |
| --- | --- | --- |
| `createTenantAction` | `{ name, slug?, planId, domains?: string[], primaryEmail }` | Creates tenant + default subscription row, seeds API key, logs audit event।
| `updateTenantStatusAction` | `{ tenantId, status, reason }` | Updates status, cascades to license validator cache, sends notification।
| `assignPlanAction` | `{ tenantId, planId, billingProvider?, externalId? }` | Changes plan + updates subscription record।
| `addTenantDomainAction` | `{ tenantId, domain }` | Inserts `TenantDomain`, enforces format, logs actor।
| `toggleDomainVerificationAction` | `{ domainId, verified }` | Updates flag + writes audit trail।
| `regenerateApiKeyAction` | `{ tenantId, label? }` | Creates key, returns plaintext once, revokes previous if requested।

**UX states to cover**

- Loading skeletons for table/tab change।
- Error toasts via `useToast()` hook on mutation failure।
- Optimistic states avoided; rely on server revalidation (`revalidateTag("tenants")`)।
- Disable destructive buttons while action pending।

**Design tokens**

- Reuse shadcn button/input components; icons from Lucide (UserCog, Building2, KeyRound, Activity)।
- Status colors: Active = green, Suspended = red, Trial = amber। Use `Badge` component variants।
- Tables built with `@tanstack/react-table` (already used elsewhere in repo) for sort/filter.

**Acceptance criteria**

1. Super admin can create tenant with plan + optional domain, sees success notice, tenant appears in list without manual refresh।
2. Attempting to visit `/app/admin/tenants` as tenant admin redirects to `/app/tenant` (covered by guards)।
3. Domain add form blocks invalid inputs (e.g., spaces, protocols) with inline message।
4. Audit tab shows every admin action triggered from UI with timestamp + actor email।
5. All forms keyboard accessible + support screen readers (labels, aria-describedby)।

Manual testing for this feature will be documented once UI implementation finishes; keep a placeholder to remind future steps.

### Phase S2 – Tenant Self-Service + Landing

| Module | Tasks | Output |
| --- | --- | --- |
| **Landing & Pricing** | - `/` hero + feature sections (CMS driven via dashboard? placeholder JSON ok)।<br>- `/pricing` cards + billing FAQ।<br>- CTA buttons -> Stripe Checkout session create API। | Marketing pages in `/app/(marketing)` |
| **Stripe Checkout Flow** | - `/api/billing/create-session` takes `planId` + email.<br>- Success page handles `session_id`, creates tenant, links subscription, sends welcome email।<br>- Webhook handler updates status + trial_end dates। | API routes, webhook serverless function |
| **Tenant Dashboard (App Shell)** | - Layout with sidebar (Overview, Domains, API Keys, Billing, Integrations)।<br>- Overview cards: usage, plan, status, last invoice।<br>- Domains CRUD with verification status badges। | `/app/(dashboard)/[tenantSlug]/...` routes |
| **API Key Manager** | - Rotate/regenerate modal, copy-to-clipboard, last-used timestamp surface। | Client component using server actions |
| **Docs/Onboarding** | - Inline setup checklist (WordPress plugin link, script snippet)।<br>- Email templates: trial start, “connect your first platform”, payment success। | `/emails/*`, Resend/SMTP integration |

### Phase S3 – Advanced Integrations & Analytics

| Module | Tasks | Output |
| --- | --- | --- |
| **PayPal Support** | - Checkout button toggles provider.<br>- Webhook listener for PayPal events → unify with Stripe update pipeline। | PayPal SDK usage docs |
| **Usage Analytics** | - Background job aggregates `usage_events` to daily rows.<br>- Dashboard charts (requests, embeds, storage, per-platform breakdown)। | Cron worker / queue setup |
| **Platform Integrations UI** | - Grid of cards with connect buttons, each launching modal specific instructions (WordPress plugin, Moodle block, Canvas LTI)।<br>- Store `tenant_integrations` records; toggle status। | `/app/.../integrations` page |
| **Content CMS for Landing** | - Super admin editable sections (hero copy, CTA text, pricing features)।<br>- Versioning/publish toggle + preview route। | Reusable `EditableSection` component |
| **Notifications & Compliance** | - Email reminders (trial ending, payment failed) triggered via scheduler।<br>- Export data button (per-tenant data export zip)।<br>- Consent/logging updates for GDPR. | Notification worker + download endpoint |

## 12. API Contract Snapshot

| Endpoint | Method | Purpose | Request Shape | Response |
| --- | --- | --- | --- | --- |
| `/api/license/validate` | POST | WordPress/LMS plugin token request | `{ apiKey, tenantId, domain, context }` | `{ allowed, embedUrl, token, reason? }` |
| `/api/tenants` | GET/POST | Super admin tenant CRUD | GET filters: `status`, `plan`. POST body: tenant info + plan | Standard JSON |
| `/api/tenants/[id]/domains` | POST/DELETE | Manage allowed domains | `{ domain }` | Domain record |
| `/api/api-keys` | POST | Rotate tenant API key | `{ tenantId }` | `{ key, last4 }` |
| `/api/billing/create-session` | POST | Stripe checkout session | `{ planId, email, billingCycle }` | `{ checkoutUrl }` |
| `/api/webhooks/stripe` | POST | Webhook receiver | Raw payload + signature | 200/400 |
| `/api/webhooks/paypal` | POST | (Phase 3) Webhook receiver | Raw payload | 200/400 |

API গুলো server actions বা route handlers whichever fits architecture ব্যবহার করবে, কিন্তু প্রতিটার সাথে validation (zod/valibot) + logging যুক্ত করতে হবে যাতে SaaS support সহজ হয়।

## 13. UI Deliverables Inventory

1. **Marketing**
   - Landing hero, feature tiles, integration carousel, CTA footer।
   - Pricing toggle + FAQ accordion।
2. **Auth**
   - Signup (email/password), login, forgot password, invite accept।
3. **Super Admin**
   - Tenants table (with CSV export), tenant drawer, audit log timeline।
   - Plan catalog editor (create/update plan pricing + limits)।
4. **Tenant Dashboard**
   - Overview cards, usage charts, setup checklist panel।
   - Domains management table + verification wizard।
   - API key manager + WordPress snippet block।
   - Billing page with invoice table (data pulled from Stripe API).
   - Integrations gallery page (connect buttons, status pills)।
5. **Shared Components**
   - Status badges, limit progress bars, copy-to-clipboard button, JSON viewer for configs, confirm modals।

## 14. Acceptance Criteria Template (Per Story)

প্রতিটা feature শুরু করার আগে নিচের acceptance criteria স্পষ্ট করতে হবে:

1. **Data Validation** – কোন ফিল্ড optional/required, max length, enum list।
2. **State Coverage** – success, empty, loading, error, suspended tenant, expired subscription।
3. **Auditability** – কোন action audit log-এ লিখতে হবে (who, what, when)।
4. **Security** – role guards enforced? tenantId leakage নেই তো? rate limit দরকার?
5. **DX** – Story সম্পন্ন হলে docs/README আপডেট হয়েছে? API playground/request sample আছে?
6. **Testing** – কোন automated test (unit/integration/e2e) লিখা হয়েছে, কীভাবে run করতে হবে।

এই template মাথায় রেখে Jira/Linear ticket তৈরি করলে developer + reviewer দুই পক্ষই পরিষ্কার context পাবে।

---

এই expanded version এখন Texril SaaS dashboard build করার সময় executable reference হিসেবে কাজ করবে। উপরের checklist, API snapshot আর UI inventory ধরে ধরে যাওয়ায় প্রতিটা module-এর scope পরিষ্কার – ফলে design/implementation/start করতে আর আলাদা discovery phase লাগবে না। প্রয়োজন হলে প্রত্যেক Phase-এর subticket/iteration এই ডক থেকেই lift করা যাবে।
