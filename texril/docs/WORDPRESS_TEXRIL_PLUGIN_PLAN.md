# WordPress Plugin – Texril SaaS Integration Plan

## 1. Goal & Scope

- লক্ষ্য: WordPress এর **posts, pages + LMS content** এ Texril SaaS editor ব্যবহার করে লেখা ও edit করা যাবে।
- Model: **SaaS-hosted editor + lightweight WordPress plugin** → কোনো core editor code WP তে থাকবে না।
- Focus: **Security, licensing, multi-tenant SaaS** properly handle করা + future LearnDash/TutorLMS ready করা।

## 2. High-Level Architecture (WordPress ↔ Texril SaaS)

1. **Texril SaaS (Next.js app)**
   - `/embed` route → iframe compatible editor UI.
   - `/api/license/validate` → WP plugin এর জন্য licensing/auth gateway।
   - Multi-tenant DB → `tenants`, `domains`, `users`, `documents`, `subscriptions`।
2. **WordPress Plugin**
   - Settings page → API key, tenant ID, base URL, environment (dev/prod)।
   - Shortcode + Gutenberg block → front-end এ editor/embed।
   - Admin editor integration → posts/pages edit screen এ Texril iframe দেখাবে।
3. **Auth & Licensing Layer**
   - WP → `POST /api/license/validate` with `{ apiKey, tenantId, domain, context }`।
   - SaaS → validate license + domain, create **short-lived JWT token**, return `embedUrl`।
   - Browser → iframe `src=embedUrl` → Texril editor load হয়।

## 3. Current Status – কী আছে (existing code, not yet production-hardened)

- Plugin file: `wordpress-plugin/texril-editor/texril-editor.php`।
- Features (v0.1.0):
  - Settings page: API key, tenant ID, Texril Base URL।
  - Shortcode: `[texril_editor]` → front-end এ iframe embed করে।
  - License flow: shortcode render করার সময় `/api/license/validate` call করে → `embedUrl` পেলে iframe দেখায়।
- Limitations (to fix before calling it production-ready):
  - শুধুই **front-end embed**; WordPress admin editor (Gutenberg/Classic) replace করে না।
  - Texril content কে এখনও **WP post content field** এর সাথে sync করা হয় না।

## 4. Target Plugin Design – Posts & Pages Editor Integration

### 4.1 User Experience Goals

- Admin যখন **Add New Post / Edit Post / Page** এ যাবে:
  - Default Gutenberg/Classic editor এর জায়গায় Texril editor iframe দেখাবে।
  - Texril editor এ লেখা content save হলে → WP এর `post_content` field এ HTML/JSON sync হবে।
- Front-end:
  - Default `the_content` HTML render হবে (SEO friendly)।
  - Optionally `[texril_editor]` বা আলাদা shortcode দিয়ে **live SaaS embed** ও করা যাবে।

### 4.2 Integration Model (Admin Editor)

1. **Texril canonical content + WP synced HTML**
   - SaaS side এ `documents` table এ canonical JSON/HTML থাকে (per `tenantId + wpPostId`)।
   - Save করলে Texril → একটি sanitized HTML snapshot প্রস্তুত করে।
   - Snapshot WP তে পাঠানো হয় (postMessage + REST বা AJAX) → `post_content` এ save হয়।
2. **Context parameters**
   - Every embed এ query params: `context_type=wp_post`, `context_id=<post_id>`, `field=content` ইত্যাদি।
   - JWT এর ভিতরে একই context encode থাকবে।
3. **Communication Channel (iframe ↔ WP admin)**
   - `window.postMessage` based protocol:
     - Texril → `parent.postMessage({ type: 'texril-save', html, meta }, origin)`।
     - WP plugin → origin check করে → `#content` বা Gutenberg block attribute update করে।
   - Extra messages: `texril-ready`, `texril-error`, `texril-dirty-state` (unsaved changes warning)।

## 5. SaaS API & Auth Contract (WordPress এর জন্য)

### 5.1 `/api/license/validate` – server-to-server

- **Request (from plugin):**
  - Body: `{ apiKey, tenantId, domain, siteUrl, pluginVersion, contextType }`।
- **Response (from SaaS):**
  - Success: `{ allowed: true, token, embedUrl, expiresAt, plan, features }`।
  - Failure: `{ allowed: false, reason, retryAfter? }`।
- Responsibilities:
  - API key → tenant match করে, Stripe/subscription status check করে।
  - `domain` → `allowed_domains` table এর against verify করে।
  - Short-lived JWT (5–15 min) sign করে, `embedUrl=/embed?token=...` বানিয়ে দেয়।

### 5.2 JWT Token Structure

- Claims (example):
  - `sub` = SaaS user id (optional)।
  - `tenantId`, `domain`, `siteUrl`।
  - `contextType` (wp_post, lesson ইত্যাদি), `contextId` (post_id)।
  - `role` (admin/editor/viewer)।
  - `exp`, `iat`, `nonce`।
- Verify rules:
  - Secret/keys শুধুই SaaS server এ থাকবে; WP plugin কখনও sign করবে না।
  - `/embed` loader **host header/domain** + token এর `domain` match করে দেখবে।

## 6. Security & SaaS Considerations

1. **Domain Locking**
   - প্রতি tenant এর জন্য `allowed_domains` list maintain করা হবে।
   - `/api/license/validate` এ আসা `domain` + actual `Host` header দু’টাকেই cross-check করা হবে।
2. **Rate Limiting & Abuse Protection**
   - Per-tenant ও per-domain rate limit (license validate + embed load দুটোতেই)।
   - Suspicious activity → SaaS side এ flag + optional temporary block।
3. **Secret Management**
   - Stripe keys, JWT secret, DB credentials কখনও WordPress plugin এ যাবে না।
   - Plugin শুধু **public-ish API key** + tenant ID রাখবে (compromise হলেও limited damage)।
4. **Content Security**
   - Texril editor → XSS / script injection prevent করার জন্য sanitization (DOMPurify বা সমমান কিছু) ব্যবহার করবে।
   - WordPress এ save করা HTML → sanitize/texturize hooks respect করবে (optional filter)।
   - iframe এ `sandbox`, `referrerpolicy="strict-origin-when-cross-origin"`, `CSP` headers ব্যবহার করা যাবে।
5. **Multi-tenant Isolation**
   - সব document/file path এ `tenants/{tenantId}/` prefix থাকবে (already following TipTap roadmap)।
   - WP site compromise হলেও অন্য tenant এর data access করা যাবে না।

## 7. Plugin Feature Roadmap (WordPress Specific)

1. **Phase WP-1 – Hardened Shortcode (Current → Polished)**
   - Existing `[texril_editor]` shortcode কে production-ready করা:
     - Better error messages, timeout handling, logging।
     - `contextType=generic` support, optional attributes: `context", "lesson_id" ইত্যাদি।
2. **Phase WP-2 – Posts/Pages Editor Integration (Core Goal)**
   - Admin editor screen এ Texril iframe add করা (meta box বা full-screen replace)।
   - postMessage ভিত্তিক save protocol implement করা।
   - `post_content` sync + front-end render test করা।
3. **Phase WP-3 – LMS Integration (LearnDash, TutorLMS)**
   - Their lesson edit screens এ একই Texril editor embed করা (hook/filter দিয়ে)।
   - Context: `contextType=ld_lesson` / `tutor_lesson` + `contextId=lesson_id`।
4. **Phase WP-4 – Advanced Features**
   - WordPress multi-site support (per-site tenant mapping)।
   - Role-based permission: শুধুমাত্র `edit_posts` capability থাকা user editor ব্যবহার করতে পারবে।
   - Telemetry: minimal, privacy-safe usage stats (load counts, errors)।

## 8. Local Dev & Testing Checklist (Mapping to Phase 1 Guide)

- `web/` এর Next.js app `npm run dev` (port 3001 বা configured) এ চালু করা।
- Texril plugin install করে settings এ:
  - API Key = `test-api-key`, Tenant ID = `demo-tenant`, Base URL = `http://localhost:3001`।
- Front-end: `[texril_editor]` ব্যবহার করে `/api/license/validate` + iframe flow verify করা (already in Phase 1 guide)।
- Admin editor integration build হলে:
  - New post/page screen এ Texril load হচ্ছে কিনা, save করলে `post_content` update হচ্ছে কিনা, SEO/preview ঠিক আছে কিনা চেক করা।

এই plan টা **SAAS_EMBED_PRODUCT_PLAN.md → Section 6 (WordPress Implementation)** এর detailed technical breakdown হিসেবে ধরে ব্যবহার করা যাবে।

## 9. Production Readiness Checklist

- **Error handling, logging, timeouts**

  - `/api/license/validate` call এর জন্য strict timeout (৫–৮s) ও user-friendly error message থাকতে হবে।
  - wp_remote_post / HTTP error/SSL error হলে clear fallback দেখাবে (admin notice + front-end warning)।
  - SaaS side এ structured logging (request id, tenantId, domain, status) + basic alerting রাখতে হবে।

- **Security review (XSS, iframe sandbox, CSP)**

  - Texril editor output HTML → server-side sanitization (DOMPurify বা সমমান) + WordPress filter respect।
  - iframe এ `sandbox`, `referrerpolicy="strict-origin-when-cross-origin"` already plan এ আছে; সাথে প্রয়োজন হলে CSP header দিয়ে script-src/frame-ancestors tighten করতে হবে।
  - JWT leakage, token reuse, mixed-content (http vs https) ইস্যু manual review + automated tests দিয়ে validate করতে হবে।

- **Backwards-compatibility strategy**

  - Plugin update করার আগে existing `[texril_editor]` shortcode ও পুরনো settings structure break না হয়, সেটা নিশ্চিত করতে versioned options (যেমন: `texril_editor_settings_v1`) ব্যবহার করা যেতে পারে।
  - Editor schema (TipTap extensions, JSON structure) change হলে পুরনো documents migrate/auto-upgrade করার clear path ডিজাইন করতে হবে।
  - WordPress core minimum version এবং PHP minimum version স্পষ্টভাবে define ও test করা হবে (যেমন: WP 6.0+, PHP 8.0+)।

- **Versioning এবং auto-update plan (WP.org বা private distribution)**
  - Plugin header এর `Version` field semantic versioning (MAJOR.MINOR.PATCH) ফলো করবে।
  - Public release strategy পরিষ্কার থাকবে: WP.org এ publish করলে standard auto-update চলবে; private হলে custom update server বা GitHub release based updater ব্যবহার করতে হবে।
  - প্রতি release এর জন্য changelog + security impact note maintain করা হবে, যাতে tenant/admin স্পষ্টভাবে বুঝতে পারে কী পরিবর্তন হয়েছে।
