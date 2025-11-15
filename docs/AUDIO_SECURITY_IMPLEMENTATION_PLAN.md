# 🔒 Audio Storage Security Implementation Plan

**Created:** 2025-01-15  
**Status:** Planning Phase  
**Priority:** High (Security Critical)

---

## 📋 Executive Summary

This document outlines the security implementation plan for audio file storage in the LMS TipTap editor. The plan addresses multiple security gaps identified in the current system and provides a phased rollout strategy with zero downtime.

---

## 🚨 Current Security Gaps

### **Gap 1: URL Visible in HTML Source** 🔴 Critical
- **Issue:** Audio URLs visible in browser DevTools, Network tab, and Console
- **Risk:** Anyone can copy and share permanent URLs
- **Location:** `components/ui/custom-audio-player.tsx` line 125

### **Gap 2: No Permission Checks in API Route** 🔴 Critical
- **Issue:** No role-based access control or file ownership validation
- **Risk:** Cross-student data access, unauthorized downloads
- **Location:** `app/api/storage/[...path]/route.ts`

### **Gap 3: Public Cache Headers for Private Files** 🟡 Medium
- **Issue:** Private audio files cached with public headers
- **Risk:** Browser/CDN caching sensitive content
- **Location:** `app/api/storage/[...path]/route.ts` line 61

### **Gap 4: Predictable File Paths** 🟡 Medium
- **Issue:** Timestamp-based naming allows brute force enumeration
- **Risk:** File path guessing attacks
- **Location:** `lib/storage/storage-service.ts` line 376

### **Gap 5: No Signed URLs for Local Storage** 🔴 High
- **Issue:** Local storage returns permanent URLs (no expiration)
- **Risk:** URLs never expire, can be shared indefinitely
- **Location:** `lib/storage/adapters/local-storage.ts` line 74-78

### **Gap 6: Download Permission Bypass** 🟠 Medium
- **Issue:** `allowDownload=false` only hides UI button, doesn't block API
- **Risk:** Users can bypass restriction via direct URL access
- **Location:** API route has no download permission enforcement

---

## 🎯 Implementation Strategy

### **Phase 1: Quick Wins (Week 1) - Zero Breaking Changes**

**Goal:** Immediate security improvement with no downtime

#### **Task 1.1: Add Permission Checks in API Route**
- **Priority:** 🔴 Critical
- **Effort:** 2-3 hours
- **Breaking Changes:** None
- **Files to Modify:**
  - `app/api/storage/[...path]/route.ts`
  - `lib/auth.ts` (add `getCurrentUser()` helper)
  
**Implementation:**
```typescript
// Add role-based and ownership checks
// - ADMIN/TEACHER: Access all files
// - STUDENT: Only own files
// - Check file ownership from database
```

**Testing:**
- ✅ ADMIN can access all audio files
- ✅ TEACHER can access course audio files
- ✅ STUDENT cannot access other students' files
- ✅ Existing audio players still work

---

#### **Task 1.2: Fix Cache Headers for Private Files**
- **Priority:** 🟡 Medium
- **Effort:** 30 minutes
- **Breaking Changes:** None
- **Files to Modify:**
  - `app/api/storage/[...path]/route.ts`

**Implementation:**
```typescript
// Detect private files by path pattern
// - /questions/audio/ → private
// - /students/documents/ → private
// - /students/photos/ → public
// Set appropriate cache headers
```

**Testing:**
- ✅ Private files: `Cache-Control: private, max-age=3600`
- ✅ Public files: `Cache-Control: public, max-age=31536000`

---

#### **Task 1.3: Add Random Tokens to New File Uploads**
- **Priority:** 🟡 Medium
- **Effort:** 1 hour
- **Breaking Changes:** None (only affects NEW uploads)
- **Files to Modify:**
  - `lib/storage/storage-service.ts`

**Implementation:**
```typescript
// Use content-based hashing (SHA-256)
// Format: {timestamp}_{hash}.webm
// Benefits: Deduplication + unpredictable paths
```

**Testing:**
- ✅ New uploads have random tokens
- ✅ Old files still accessible
- ✅ Same file uploaded twice = same hash (deduplication)

---

### **Phase 2: Advanced Security (Week 2) - Careful Rollout**

**Goal:** Maximum security with backward compatibility

#### **Task 2.1: Implement Signed URLs for Local Storage**
- **Priority:** 🔴 High
- **Effort:** 3-4 hours
- **Breaking Changes:** ⚠️ Yes (with backward compatibility layer)
- **Files to Create:**
  - `app/api/storage/signed/route.ts` (new)
- **Files to Modify:**
  - `lib/storage/adapters/local-storage.ts`
  - `lib/storage/storage-service.ts`

**Implementation:**
```typescript
// JWT-based signed URLs
// Format: /api/storage/signed?token=eyJhbGc...
// Token contains: { key, exp, userId }
// Expiration: 1 hour (configurable)
```

**Backward Compatibility:**
```typescript
// Keep old route working: /api/storage/tenants/...
// Add new route: /api/storage/signed?token=...
// Both routes apply permission checks
```

**Testing:**
- ✅ New audio uploads use signed URLs
- ✅ Old audio players still work (backward compat)
- ✅ Tokens expire after 1 hour
- ✅ Expired tokens return 401 error

---

#### **Task 2.2: Implement Blob URLs in Audio Player (Optional)**
- **Priority:** 🟠 Medium
- **Effort:** 2 hours
- **Breaking Changes:** None
- **Files to Modify:**
  - `components/ui/custom-audio-player.tsx`

**Implementation:**
```typescript
// Hybrid approach:
// - Private files: Fetch as blob (hide URL)
// - Public files: Direct stream (memory efficient)
```

**Benefits:**
- ✅ Real URL hidden from DevTools
- ✅ Cannot share blob URLs (session-scoped)
- ✅ Memory efficient (only for private files)

**Testing:**
- ✅ Private audio uses blob URLs
- ✅ Public audio uses direct URLs
- ✅ No memory leaks (blob cleanup on unmount)

---

#### **Task 2.3: Add Download Permission Enforcement in API**
- **Priority:** 🟠 Medium
- **Effort:** 1 hour
- **Breaking Changes:** None
- **Files to Modify:**
  - `app/api/storage/[...path]/route.ts`
  - `app/api/storage/signed/route.ts`

**Implementation:**
```typescript
// Check UploadedFile.allowDownload from database
// Block if download=true query param and allowDownload=false
// Allow streaming for playback (no download param)
```

**Testing:**
- ✅ `allowDownload=false` blocks download requests
- ✅ Audio playback still works (streaming)
- ✅ Download button respects permission

---

### **Phase 3: Migration (Week 3) - Optional**

**Goal:** Migrate old audio URLs to new secure format

#### **Task 3.1: Create Migration Script**
- **Priority:** 🟢 Low (Optional)
- **Effort:** 2-3 hours
- **Files to Create:**
  - `scripts/migrate-audio-urls.ts`

**Implementation:**
```typescript
// Find all TipTap content with old audio URLs
// Update to new signed URL format
// Keep old URLs working (backward compat)
```

**Testing:**
- ✅ Dry run shows affected records
- ✅ Migration updates database
- ✅ Old and new URLs both work

---

#### **Task 3.2: Remove Backward Compatibility Layer (Future)**
- **Priority:** 🟢 Low (6+ months later)
- **Effort:** 1 hour
- **Files to Modify:**
  - `app/api/storage/[...path]/route.ts`

**Implementation:**
```typescript
// After all old URLs migrated
// Remove old route support
// Only signed URLs allowed
```

---

## 📊 Security Improvement Matrix

| Feature | Before | After Phase 1 | After Phase 2 | After Phase 3 |
|---------|--------|---------------|---------------|---------------|
| **Permission Checks** | ❌ None | ✅ Role-based | ✅ Role-based | ✅ Role-based |
| **Cache Headers** | ❌ Public | ✅ Private | ✅ Private | ✅ Private |
| **File Paths** | ⚠️ Predictable | ✅ Random hash | ✅ Random hash | ✅ Random hash |
| **URL Expiration** | ❌ Never | ❌ Never | ✅ 1 hour | ✅ 1 hour |
| **URL Visibility** | ❌ Visible | ❌ Visible | ✅ Hidden (blob) | ✅ Hidden (blob) |
| **Download Control** | ❌ UI only | ❌ UI only | ✅ API enforced | ✅ API enforced |
| **Security Level** | 🔴 30% | 🟡 70% | 🟢 95% | 🟢 95% |

---

## 🧪 Testing Strategy

### **Unit Tests**
```typescript
// tests/storage/permission-checks.test.ts
describe('Storage Permission Checks', () => {
  it('ADMIN can access all files')
  it('TEACHER can access course files')
  it('STUDENT can only access own files')
  it('Blocks cross-tenant access')
})

// tests/storage/signed-urls.test.ts
describe('Signed URLs', () => {
  it('Generates valid JWT token')
  it('Rejects expired tokens')
  it('Validates token signature')
})
```

### **Integration Tests**
```typescript
// tests/api/storage.test.ts
describe('Storage API', () => {
  it('Serves file with valid permissions')
  it('Returns 403 for unauthorized access')
  it('Returns 401 for expired token')
  it('Sets correct cache headers')
})
```

### **Manual Testing Checklist**
- [ ] Upload new audio in TipTap editor
- [ ] Verify audio plays correctly
- [ ] Check DevTools → Network tab (signed URL?)
- [ ] Check DevTools → Elements (blob URL?)
- [ ] Try accessing URL from different user (blocked?)
- [ ] Try accessing URL after 1 hour (expired?)
- [ ] Test download button (respects permission?)
- [ ] Test old audio players (still work?)

---

## 🚀 Deployment Plan

### **Pre-Deployment**
1. ✅ Create feature branch: `feature/audio-security`
2. ✅ Document current state (this file)
3. ✅ Commit and push to GitHub (rollback point)

### **Phase 1 Deployment (Week 1)**
1. Implement Quick Wins (Tasks 1.1-1.3)
2. Run unit tests
3. Run integration tests
4. Manual testing on staging
5. Deploy to production (zero downtime)
6. Monitor error logs for 24 hours

### **Phase 2 Deployment (Week 2)**
1. Implement Advanced features (Tasks 2.1-2.3)
2. Test backward compatibility
3. Run full test suite
4. Deploy to staging
5. Test old + new audio players
6. Deploy to production (gradual rollout)
7. Monitor error logs for 48 hours

### **Phase 3 Deployment (Week 3+)**
1. Run migration script (dry run)
2. Backup database
3. Run migration (production)
4. Verify all audio players work
5. Monitor for 1 week
6. (Optional) Remove backward compat layer after 6 months

---

## 🔄 Rollback Plan

### **If Phase 1 Fails:**
```bash
git revert <commit-hash>
git push origin main
# Redeploy previous version
```
**Impact:** None (backward compatible)

### **If Phase 2 Fails:**
```bash
# Keep backward compatibility layer active
# Disable signed URL generation
# Fall back to old URL format
```
**Impact:** Minimal (old URLs still work)

### **If Phase 3 Migration Fails:**
```bash
# Restore database backup
# Keep backward compatibility layer
# Investigate migration errors
```
**Impact:** None (old URLs still work)

---

## 📝 Environment Variables

### **New Variables Required:**

```env
# JWT Secret for Signed URLs (Phase 2)
STORAGE_SECRET=your-random-secret-key-min-32-chars

# Signed URL Expiration (seconds)
STORAGE_URL_EXPIRATION=3600  # 1 hour (default)

# Enable Blob URLs (optional)
STORAGE_USE_BLOB_URLS=true  # false for public files only
```

### **Generate Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔍 Monitoring & Alerts

### **Metrics to Track:**
- Storage API response time (should be <100ms)
- Permission check failures (403 errors)
- Expired token errors (401 errors)
- Blob URL memory usage
- Cache hit/miss ratio

### **Alerts to Set:**
- 🚨 Storage API error rate > 1%
- 🚨 Permission check failures > 10/min
- ⚠️ Average response time > 200ms
- ⚠️ Memory usage increase > 20%

---

## 📚 Documentation Updates

### **Files to Update:**
- [ ] `README.md` - Add security features section
- [ ] `docs/STORAGE_ARCHITECTURE.md` - Update with signed URLs
- [ ] `docs/API_ROUTES.md` - Document new `/api/storage/signed` route
- [ ] `.env.example` - Add new environment variables
- [ ] `lms-rule.md` - Update storage security standards

---

## 👥 Team Communication

### **Stakeholders to Notify:**
- [ ] Development team (implementation details)
- [ ] QA team (testing checklist)
- [ ] DevOps team (deployment plan)
- [ ] Product team (security improvements)

### **Communication Timeline:**
- **Week 0:** Share this plan, gather feedback
- **Week 1:** Daily standup updates (Phase 1)
- **Week 2:** Daily standup updates (Phase 2)
- **Week 3:** Weekly update (Phase 3 optional)

---

## ✅ Success Criteria

### **Phase 1 Success:**
- ✅ All permission checks working
- ✅ Private cache headers applied
- ✅ New uploads have random tokens
- ✅ Zero production errors
- ✅ No performance degradation

### **Phase 2 Success:**
- ✅ Signed URLs working for new uploads
- ✅ Old audio players still functional
- ✅ Blob URLs hide real URLs
- ✅ Download permission enforced
- ✅ Token expiration working

### **Phase 3 Success:**
- ✅ All old URLs migrated
- ✅ 100% signed URL adoption
- ✅ Backward compat layer removed (optional)

---

## 🎯 Final Security Posture

**Target:** 🟢 95% Secure

**Achieved Through:**
1. ✅ Role-based access control
2. ✅ File ownership validation
3. ✅ Private cache headers
4. ✅ Unpredictable file paths
5. ✅ Time-limited signed URLs
6. ✅ Hidden URLs (blob)
7. ✅ Download permission enforcement

**Remaining 5% Risk:**
- Browser extensions can still capture audio
- Screen recording can capture playback
- Determined users can use browser DevTools

**Mitigation:** These are acceptable risks for an LMS platform. For higher security, consider DRM solutions (future enhancement).

---

## 📞 Support & Questions

**Document Owner:** Development Team
**Last Updated:** 2025-01-15
**Next Review:** After Phase 2 completion

For questions or concerns, contact the development team.

---

**END OF DOCUMENT**

