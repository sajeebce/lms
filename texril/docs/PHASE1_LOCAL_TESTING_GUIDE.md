# Phase 1 – Local Dev & Testing Guide

এই গাইডটা হচ্ছে তোমার **SaaS embed editor** লোকালিতে রান করা + WordPress plugin দিয়ে টেস্ট করার জন্য।

## ১. Next.js SaaS app লোকালি রান করা

প্রজেক্ট root: `k:\\projects\\texril`

```bash
cd web
npm install   # (একবার, dependency install করার জন্য)
npm run dev   # dev server চালু করার জন্য
```

এরপর ব্রাউজারে গিয়ে:

- `http://localhost:3001/embed?token=dev-token`
- অথবা context/id সহ:
  - `http://localhost:3001/embed?token=dev-token&context=lesson&lesson_id=123`

এখানে তোমার TipTap-based rich text editor লোড হবে, যেটা future-এ WordPress/LMS থেকে iframe দিয়ে embed হবে।

## ২. License API (`/api/license/validate`) টেস্ট করা

এই endpointটা WordPress plugin / SaaS licensing flow এর জন্য। এখন এটা **MVP stub** – কিন্তু flow পুরোটা টেস্ট করা যাবে।

PowerShell থেকে (Windows):

```powershell
Invoke-WebRequest `
  -Uri 'http://localhost:3001/api/license/validate' `
  -Method POST `
  -ContentType 'application/json' `
  -Body '{"apiKey":"test-api-key","tenantId":"demo-tenant","domain":"localhost"}'
```

একটা successful response এর উদাহরণ (ধরন):

```json
{
  "allowed": true,
  "message": "License valid (MVP stub)",
  "token": "<base64-url-token>",
  "embedUrl": "http://localhost:3001/embed?token=...&context=lesson"
}
```

### এই JSON এর মানে

- `allowed: true` → এই domain+apiKey combination এর জন্য editor চালানোর অনুমতি আছে
- `token` → simple base64-encoded payload (tenantId, domain, issuedAt)
- `embedUrl` → WordPress plugin এই URL টা iframe এ ব্যবহার করবে

## ৩. WordPress plugin (MVP) দিয়ে টেস্ট

Plugin ফাইল এই repo তে আছে:

- `wordpress-plugin/texril-editor/texril-editor.php`

### ৩.১ WordPress এ plugin কপি ও activate

১. তোমার local WordPress প্রজেক্টের ভিতরে কপি করো:

- Source (এই repo):
  - `wordpress-plugin/texril-editor/`
- Destination (WP):
  - `<your-wp-root>/wp-content/plugins/texril-editor/`

২. WordPress admin এ গিয়ে:

- **Plugins → Texril Editor → Activate**

### ৩.২ Plugin settings configure করা

Admin panel এ:

- **Settings → Texril Editor**
- নিচের field গুলো সেট করো:
  - **API Key:** `test-api-key` (এখন stub; পরে real key হবে)
  - **Tenant ID:** `demo-tenant` (payload এ যায়, future multi-tenant এর জন্য)
  - **Texril Base URL:** `http://localhost:3001`

> Production এ গেলে এখানে `https://app.texril.com` টাইপ URL থাকবে।

### ৩.৩ Page/Lesson এ editor embed করা

যেকোনো Page / LearnDash lesson / TutorLMS lesson এর content এ লিখো:

```text
[texril_editor]
```

Frontend থেকে ওই page ভিজিট করলে plugin যা করবে:

1. `http://localhost:3001/api/license/validate` এ JSON POST পাঠাবে:
   - `apiKey`, `tenantId`, `domain` সহ
2. Response এ যদি:
   - `allowed: true` এবং একটা `embedUrl` পায় →
     - `<iframe src="embedUrl" ...>` দিয়ে editor দেখাবে
   - না পেলে বা error হলে → warning message দেখাবে, যেমন:
     - "Texril Editor: license is not active or Texril app is unreachable."

## ৪. Future reminder

- এখন `/api/license/validate` pure stub (hard-coded allow)।
- ভবিষ্যতে এখানে **Stripe billing + domain whitelisting + usage limit** implement করবে, কিন্তু WordPress side flow একই থাকবে:
  - WP → `/license/validate` → `embedUrl` → iframe → `/embed` এ editor।

এই ফাইলটা সাথে রাখলে বাসায় গিয়ে পুরো Phase 1 লোকাল setup + testing আবার সহজে করতে পারবে।
