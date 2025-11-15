# 🔄 Rollback Guide - Audio Security Implementation

**Created:** 2025-01-15  
**Purpose:** Emergency rollback procedures for audio security implementation

---

## 📍 Rollback Points

### **Current Stable Version (Before Security Fixes)**
- **Commit Hash:** `bcd409f`
- **Commit Message:** "feat: Add custom audio player with security documentation"
- **Date:** 2025-01-15
- **Status:** ✅ Stable - Custom audio player working, no security fixes applied
- **Security Level:** 🔴 30% (baseline)

**Features in this version:**
- ✅ Custom HTML5 audio player
- ✅ Playback speed control (0.5x - 2x)
- ✅ Download permission toggle (UI only)
- ✅ Theme-aware buttons
- ✅ Dark mode support
- ❌ No API permission checks
- ❌ No signed URLs
- ❌ No download enforcement

---

## 🚨 Emergency Rollback Procedures

### **Scenario 1: Phase 1 Implementation Breaks Production**

**Symptoms:**
- Audio files not loading
- 403 Forbidden errors
- Permission check failures
- Performance degradation

**Rollback Command:**
```bash
# 1. Identify the problematic commit
git log --oneline -10

# 2. Revert to stable version
git revert <phase1-commit-hash>

# 3. Push to production
git push origin main

# 4. Redeploy application
npm run build
pm2 restart lms
```

**Alternative (Hard Reset - Use with Caution):**
```bash
# ⚠️ WARNING: This will lose all commits after bcd409f
git reset --hard bcd409f
git push origin main --force

# Redeploy
npm run build
pm2 restart lms
```

---

### **Scenario 2: Phase 2 Signed URLs Break Old Audio**

**Symptoms:**
- Old audio players show 401 errors
- Token expiration issues
- Backward compatibility broken

**Rollback Command:**
```bash
# Option 1: Disable signed URLs (keep code, disable feature)
# Set environment variable:
STORAGE_USE_SIGNED_URLS=false

# Restart application
pm2 restart lms
```

**Option 2: Revert Phase 2 commits:**
```bash
git revert <phase2-commit-hash>
git push origin main
npm run build
pm2 restart lms
```

---

### **Scenario 3: Phase 3 Migration Corrupts Database**

**Symptoms:**
- Audio URLs broken after migration
- Database errors
- Content not loading

**Rollback Command:**
```bash
# 1. Stop application
pm2 stop lms

# 2. Restore database backup
# PostgreSQL:
psql -U postgres -d lms_db < backup_before_migration.sql

# SQLite (dev):
cp backup_before_migration.db prisma/dev.db

# 3. Revert migration commit
git revert <migration-commit-hash>
git push origin main

# 4. Rebuild and restart
npm run build
pm2 restart lms
```

---

## 📊 Rollback Decision Matrix

| Issue | Severity | Rollback Type | Downtime |
|-------|----------|---------------|----------|
| **Permission checks too strict** | 🟡 Medium | Feature flag disable | 0 min |
| **API performance degraded** | 🟠 High | Revert commit | 5 min |
| **Signed URLs breaking old audio** | 🔴 Critical | Revert commit | 5 min |
| **Database migration failed** | 🔴 Critical | Database restore + revert | 15 min |
| **Complete system failure** | 🔴 Critical | Hard reset to bcd409f | 10 min |

---

## 🔍 Health Check After Rollback

Run these checks after rollback:

### **1. Audio Playback Test**
```bash
# Open browser console
# Navigate to any page with audio
# Check for errors in Network tab
```

**Expected:**
- ✅ Audio loads and plays
- ✅ No 403/401 errors
- ✅ Download button works (if enabled)

---

### **2. API Health Check**
```bash
curl http://localhost:3000/api/storage/tenants/tenant_1/questions/audio/temp/test.webm
```

**Expected:**
- ✅ Status 200 (or 404 if file doesn't exist)
- ❌ NOT 403 Forbidden
- ❌ NOT 500 Internal Server Error

---

### **3. Database Integrity Check**
```sql
-- Check for orphaned records
SELECT COUNT(*) FROM "UploadedFile" WHERE url IS NULL;

-- Check for broken audio URLs
SELECT COUNT(*) FROM "UploadedFile" 
WHERE category = 'question_audio' 
AND url NOT LIKE '/api/storage/%';
```

**Expected:**
- ✅ 0 orphaned records
- ✅ All URLs valid

---

## 📝 Post-Rollback Actions

### **Immediate (Within 1 hour):**
- [ ] Verify all audio players working
- [ ] Check error logs for new issues
- [ ] Notify team of rollback
- [ ] Document what went wrong

### **Short-term (Within 24 hours):**
- [ ] Root cause analysis
- [ ] Fix identified issues
- [ ] Update implementation plan
- [ ] Test fixes in staging

### **Long-term (Within 1 week):**
- [ ] Re-implement with fixes
- [ ] Enhanced testing procedures
- [ ] Update rollback guide with lessons learned

---

## 🔐 Backup Procedures

### **Before Phase 1 Implementation:**
```bash
# No database changes, just code
# Git commit is sufficient backup
git log --oneline -1
```

### **Before Phase 2 Implementation:**
```bash
# Backup environment variables
cp .env .env.backup.$(date +%Y%m%d)

# Git commit
git log --oneline -1
```

### **Before Phase 3 Migration:**
```bash
# ⚠️ CRITICAL: Database backup required

# PostgreSQL:
pg_dump -U postgres lms_db > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

# SQLite (dev):
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)

# Verify backup
ls -lh backup_before_migration_*
```

---

## 📞 Emergency Contacts

**If rollback fails or issues persist:**

1. **Development Team Lead:** [Contact Info]
2. **DevOps Team:** [Contact Info]
3. **Database Admin:** [Contact Info]

**Escalation Path:**
1. Try automated rollback (this guide)
2. Contact development team
3. Contact DevOps for infrastructure issues
4. Contact DBA for database issues

---

## 🎯 Prevention Checklist

**Before deploying security fixes:**

- [ ] Full test suite passing
- [ ] Staging environment tested
- [ ] Database backup created (Phase 3 only)
- [ ] Rollback plan reviewed
- [ ] Team notified of deployment
- [ ] Monitoring alerts configured
- [ ] Emergency contacts available

---

## 📚 Related Documents

- `docs/AUDIO_SECURITY_IMPLEMENTATION_PLAN.md` - Full implementation plan
- `docs/AUDIO_SECURITY_SUMMARY.md` - Quick reference
- `README.md` - General project documentation

---

**Last Updated:** 2025-01-15  
**Rollback Point Commit:** `bcd409f`  
**Next Review:** After each phase deployment

---

**END OF ROLLBACK GUIDE**

