# 🔐 Device Security & Active Device Implementation

**Created:** 2025-11-19
**Status:** 📋 Planning / Design
**Scope:** Per‑user device policies, Active Device column + modal, and login enforcement for the LMS (multi‑tenant, no paid tools).

---

## 1️⃣ Goals & Principles

**Goals**

- Limit how many devices a student/user can use for this LMS.
- Let admins see and manage active devices per student (from Students table modal).
- Enforce limits at **login/session level**, not just UI.
- Never rely on paid SaaS tools; use built‑in browser/Node APIs + simple custom logic.

**Security principles**

- No access to real MAC address in browser → we use **fingerprints**, not hardware IDs.
- Store only **hashed identifiers** (no raw fingerprint/IP in DB or UI).
- Always scope by `tenantId` and `userId`/`studentId`.
- Admin‑only control; students cannot change their device limit.
- Clear UX: when login blocked because of device limit, show helpful message.

---

## 2️⃣ Data Model Design

### 2.1 Policy fields

Policy is attached to the **user/student account**:

- Add to `User` or `Student` (final placement can be decided when real auth is wired):
  - `deviceAccessMode: DeviceAccessMode`
    - Enum: `SINGLE`, `MULTIPLE`, `UNLIMITED`
  - `deviceLimit: Int?`
    - Used only when `deviceAccessMode = MULTIPLE` (e.g., 2–10).
  - `lastDevicePolicyUpdatedAt: DateTime` (audit).

All policy fields must include `tenantId` in unique/index constraints via their parent model (`User`/`Student`).

### 2.2 Device tracking table

New Prisma model (name can be `UserDevice`):

- `id: String @id @default(cuid())`
- `tenantId: String`
- `userId: String` (FK → User)
- `deviceIdHash: String`
  - SHA‑256 hash of a device fingerprint string.
- `deviceName: String`
  - Human friendly, e.g. `Chrome • Windows · Laptop`.
- `userAgent: String`
- `ipHash: String?`
  - Optional hash of IP (e.g., first 3 octets + salt).
- `approxLocation: String?`
  - Optional coarse value like `BD (Dhaka)` if we later derive from IP using a free DB or manual mapping.
- `firstSeenAt: DateTime @default(now())`
- `lastActiveAt: DateTime @default(now())`
- `revokedAt: DateTime?` (if admin/device limit revokes it)
- `createdByUserId: String?` (admin who set it, if applicable).

Constraints:

- `@@unique([tenantId, userId, deviceIdHash])`
- Index on `[tenantId, userId, revokedAt]` to query active devices quickly.

**Note:** No MAC address or raw IP is stored; only hashed identifiers + derived labels.

---

## 3️⃣ Device Fingerprint & Name (No Paid Tools)

### 3.1 Fingerprint generation (client)

On login/signup page (browser):

- Build a **fingerprint string** combining:
  - `navigator.userAgent`
  - `navigator.language` / `languages`
  - `screen.width x screen.height x colorDepth`
  - `timezone` (Intl.DateTimeFormat().resolvedOptions().timeZone)
  - A stable random client ID stored in `localStorage` (e.g., `lms_device_seed`).
- Concatenate in deterministic order → `fingerprintRaw`.
- Send `fingerprintRaw` to server along with login request.

### 3.2 Hashing & storage (server)

- Use built‑in Node `crypto` (no external paid library):
  - `deviceIdHash = sha256(fingerprintRaw + tenantId + userId + serverSalt)`.
- Never store or log `fingerprintRaw` after hashing; discard immediately.

### 3.3 Deriving deviceName

- Parse `userAgent` with a **small in‑house helper**, not a big third‑party DB:
  - Detect browser: Chrome, Edge, Safari, Firefox, Other.
  - Detect OS: Windows, macOS, Android, iOS, Linux.
  - Optionally derive form factor `Desktop / Laptop / Tablet / Phone` using screen size + OS hints.
- Build name like: `Chrome • Windows · Laptop` or `Safari • iOS · iPhone`.
- Store this `deviceName` in `UserDevice` and show it in UI instead of raw UA.

---

## 4️⃣ Login Enforcement Logic

### 4.1 When a session is created

On successful credential validation (or token issue), before final success:

1. Compute `deviceIdHash` from `fingerprintRaw`.
2. Lookup `UserDevice` for `(tenantId, userId, deviceIdHash)`.
3. If not found, create new `UserDevice` row (unless blocked by policy).
4. Apply policy:
   - **UNLIMITED:** always allow; mark `lastActiveAt`.
   - **SINGLE:**
     - If existing `UserDevice` for this user and not revoked, mark **all others revoked** or mark them as inactive.
     - Update `lastActiveAt` on the current device.
   - **MULTIPLE:**
     - Count active devices: `activeCount = UserDevice` where `revokedAt IS NULL`.
     - If this `deviceIdHash` already exists → update `lastActiveAt` and allow.
     - If new and `activeCount < deviceLimit` → create row and allow.
     - If new and `activeCount >= deviceLimit` → **reject login** with friendly error.

### 4.2 Blocking login when over limit

- API returns 4xx with message like:
  `"You have reached the maximum number of devices for this account. Please ask an admin to remove an old device or increase the limit."`
- Frontend shows this message in a styled error panel on login form.
- No information about which devices exists is leaked to non‑admins; only admin UI can list them.

### 4.3 Session invalidation

- Session store (whatever auth mechanism later uses) must link session → `UserDevice.id`.
- When admin **revokes** a device from the modal, backend should invalidate all active sessions for that `UserDevice.id` (logout from that device on next request).
- For `SINGLE` mode, when a new device logs in successfully, existing sessions from other devices should be marked invalid.

---

## 5️⃣ Active Device Column & Modal – Server Side

### 5.1 Column data

For each student row on `/students`:

- Compute policy summary from `deviceAccessMode` + `deviceLimit`.
  - Examples: `Single (1/1)`, `Multiple (2/3)`, `Unlimited`, `Disabled`.
- Compute `activeCount` from `UserDevice` where `revokedAt IS NULL`.
- Compute `lastLoginAt` from auth logs (or last `lastActiveAt`).
- Expose to client as a single object per student, e.g. `{ mode, limit, activeCount, lastActiveAt }`.

### 5.2 Modal server actions

All actions follow standard pattern: `'use server'` → `requireRole('ADMIN')` → `getTenantId()` → `zod` validation → `prisma` → `revalidatePath('/students')`.

Key actions:

- `getUserDevicesForStudent(studentId)`
  - Returns current policy + paged list of devices (`deviceName`, lastActiveAt, approxLocation, revokedAt, createdAt, id).
- `updateDevicePolicy(studentId, mode, deviceLimit)`
  - Validates ranges (e.g., `deviceLimit` between 1 and 10).
  - If new mode is `SINGLE` or `MULTIPLE` with lower limit, may optionally auto‑revoke **oldest** devices beyond limit.
- `revokeDevice(deviceId)`
  - Marks `revokedAt = now()` and invalidates sessions linked to that device.

All queries must ensure:

- Student belongs to current `tenantId`.
- Admin has permission to manage that student (placeholder: `requireRole('ADMIN')`).

---

## 6️⃣ UI & UX Notes (Summary)

- Active Device column design is driven from `STUDENT_MANAGEMENT_IMPLEMENTATION_PLAN.md`.
- Modal shows:
  - Device access mode radios (Single / Multiple / Unlimited).
  - Number of devices input (for Multiple).
  - Table/list of devices (deviceName, last active, approx location, Delete).
- Deleting a device or lowering limit shows a clear warning about forced logout.
- On mobile, modal becomes full‑screen; device rows are stacked cards.

---

## 7️⃣ Testing Checklist

- [ ] Login from same browser repeatedly keeps **one** `UserDevice` record and updates `lastActiveAt`.
- [ ] Logging in from new browsers/devices creates additional `UserDevice` rows.
- [ ] `SINGLE` mode: new login from device B logs out device A (sessions revoked).
- [ ] `MULTIPLE` mode: when limit reached, further new devices cannot log in and see a friendly error message.
- [ ] Admin can view device list for a student and see correct `deviceName` + last active time.
- [ ] Admin can change policy and device limit; data persists and reflects in new logins.
- [ ] Admin can revoke a device; that device cannot make further authenticated requests.
- [ ] All queries are tenant‑scoped and guarded by RBAC.
- [ ] No raw fingerprint/IP data is visible in DevTools or API responses.

---

## 8️⃣ Prisma Schema Sketch (Reference Only)

> This is a reference snippet to guide implementation in `prisma/schema.prisma`. Adjust names/@@map to match the real schema when you implement.

```prisma
enum DeviceAccessMode {
  SINGLE
  MULTIPLE
  UNLIMITED
}

model UserDevice {
  id             String   @id @default(cuid())
  tenantId       String
  userId         String
  deviceIdHash   String
  deviceName     String
  userAgent      String
  ipHash         String?
  approxLocation String?
  firstSeenAt    DateTime @default(now())
  lastActiveAt   DateTime @default(now())
  revokedAt      DateTime?
  createdByUserId String?

  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id])

  @@unique([tenantId, userId, deviceIdHash])
  @@index([tenantId, userId, revokedAt])
  @@map("user_devices")
}
```
