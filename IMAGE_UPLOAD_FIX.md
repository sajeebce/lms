# 🔧 Image Upload Fix - Debugging Guide

**Issue:** Image upload fails with "Failed to upload" error  
**Date:** 2025-11-10  
**Status:** 🔍 Investigating

---

## 🔍 Current Setup Analysis

### ✅ What's Working
1. ✅ Database migrations up to date (20 migrations)
2. ✅ Sharp package installed (v0.34.5)
3. ✅ Storage directory exists (`./storage/tenants/tenant_1/`)
4. ✅ Dev server running (http://localhost:3000)
5. ✅ Git config set correctly

### 📁 File Upload Flow
```
User clicks "Image" button
  ↓
ImagePropertiesDialog opens
  ↓
FilePickerModal opens (4 tabs)
  ↓
User uploads file
  ↓
POST /api/files/upload
  ↓
StorageService.uploadQuestionImage()
  ↓
LocalStorageAdapter.upload()
  ↓
File saved to ./storage/tenants/{tenantId}/questions/images/{questionId}/{timestamp}.{ext}
  ↓
Returns URL: /api/storage/tenants/{tenantId}/questions/images/{questionId}/{timestamp}.{ext}
```

---

## 🐛 Possible Issues

### 1. Missing Tenant ID
**Symptom:** Upload fails because `getTenantId()` returns null  
**Fix:** Check if user is logged in and tenant exists

### 2. File Permission Issues
**Symptom:** Cannot write to `./storage` directory  
**Fix:** Check directory permissions

### 3. Missing Dependencies
**Symptom:** Sharp or other image processing fails  
**Fix:** Reinstall dependencies

### 4. Database Connection
**Symptom:** Cannot save file metadata to database  
**Fix:** Check Prisma connection

---

## 🔧 Debugging Steps

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try uploading an image
4. Look for error messages

### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Try uploading
3. Find the `/api/files/upload` request
4. Check:
   - Request payload (FormData)
   - Response status code
   - Response body (error message)

### Step 3: Check Server Logs
Look at the terminal running `npm run dev` for error messages.

---

## 🛠️ Quick Fixes

### Fix 1: Ensure Storage Directory Exists
```bash
# Create storage directory if missing
mkdir -p storage/tenants/tenant_1/questions/images/temp
```

### Fix 2: Check Tenant Settings
The app needs a tenant in the database. Check if seeded:
```bash
npx prisma studio
# Open Tenant table
# Verify tenant_1 exists
```

### Fix 3: Test Upload API Directly
```bash
# Test with curl (PowerShell)
$file = Get-Item "path/to/test-image.jpg"
$form = @{
    file = $file
    category = "question_image"
    entityType = "question"
    entityId = "test123"
    isPublic = "false"
}
Invoke-RestMethod -Uri "http://localhost:3000/api/files/upload" -Method POST -Form $form
```

---

## 📝 Next Steps

1. **Check browser console** for exact error message
2. **Check network tab** for API response
3. **Check server logs** in terminal
4. **Report findings** so I can provide targeted fix

---

## 🎯 Expected Behavior

When upload works correctly:
1. User selects image
2. Progress indicator shows
3. Image optimized (if needed)
4. Success toast: "File uploaded successfully! Optimized: X% smaller"
5. Image appears in editor
6. File saved to `./storage/tenants/tenant_1/questions/images/temp/{timestamp}.webp`

---

## 📚 Related Files

- `app/api/files/upload/route.ts` - Upload API endpoint
- `lib/storage/storage-service.ts` - Storage service
- `lib/storage/adapters/local-storage.ts` - Local file storage
- `components/ui/file-picker-modal.tsx` - Upload UI
- `components/ui/image-properties-dialog.tsx` - Image dialog

---

**Status:** Waiting for browser console error message to provide exact fix

