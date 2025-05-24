# 🔧 Troubleshooting Guide

Common issues and their solutions for the Simple Learning Website.

## 🚨 Setup Issues

### ❌ "Missing Supabase credentials" Error

**Problem**: Environment variables not configured properly.

**Solution**:

1. Ensure `.env.local` file exists in the project root

2. Check that all required variables are set:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Get credentials from Supabase Dashboard → Project Settings → API

4. Restart the development server after updating

### ❌ "Bucket not found" Error

**Problem**: Storage buckets don't exist in Supabase.

**Solution**:

```bash

# Create buckets automatically

npm run setup-buckets

# Or create manually in Supabase Dashboard → Storage

```

Required buckets:

- `papers` - for academic papers

- `solutions` - for solution files

### ❌ "Permission denied" Errors

**Problem**: Storage policies not configured.

**Solution**:

```bash

# Set up policies automatically

npm run setup-policies

# Or configure manually in Supabase Dashboard → Storage → Policies

```

Required policies for each bucket:

- SELECT (read access)

- INSERT (upload access)

- DELETE (delete access)

### ❌ Node.js Version Issues

**Problem**: Using Node.js version < 18.

**Solution**:

1. Install Node.js 18.x or later from [nodejs.org](https://nodejs.org/)

2. Verify version: `node --version`

3. Consider using [nvm](https://github.com/nvm-sh/nvm) for version management

## 🔗 Connection Issues

### ❌ "Failed to fetch" Errors

**Problem**: Network or CORS issues.

**Solution**:

1. Check internet connection

2. Verify Supabase project is active

3. Check browser console for detailed errors

4. Try running: `npm run test-connection`

### ❌ Database Connection Failed

**Problem**: Database not accessible or tables missing.

**Solution**:

1. Check Supabase project status

2. Verify database tables exist:

   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

3. Run database setup if tables missing:

   ```bash
   # Use the SQL from README.md or QUICK_START.md

   ```

## 📁 File Upload Issues

### ❌ Files Not Uploading

**Problem**: Various upload-related issues.

**Solutions**:

1. **Check file size**: Default limit is 50MB

2. **Verify file type**: Ensure supported format (PDF, DOCX, JPG, PNG, etc.)

3. **Check service role key**: Must be correct in `.env.local`

4. **Browser console**: Look for detailed error messages

5. **Storage policies**: Ensure INSERT policy exists

### ❌ "File already exists" Error

**Problem**: Filename collision in storage.

**Solution**:

- Files are automatically timestamped to prevent collisions

- If error persists, check storage bucket manually

- Clear any test files that might be causing conflicts

### ❌ Upload Hangs or Times Out

**Problem**: Large files or slow connection.

**Solutions**:

1. Check file size (reduce if too large)

2. Check internet connection stability

3. Try uploading smaller test file first

4. Check browser network tab for failed requests

## 🗂️ Browse Page Issues

### ❌ No Files Showing

**Problem**: Files uploaded but not displaying.

**Solutions**:

1. **Refresh the page** or click refresh button

2. **Check storage buckets** in Supabase dashboard

3. **Verify database records**:

   ```sql
   SELECT * FROM papers;
   SELECT * FROM solutions;
   ```

4. **Check browser console** for JavaScript errors

### ❌ Download Not Working

**Problem**: Files can't be downloaded.

**Solutions**:

1. **Check file exists** in storage bucket

2. **Verify storage policies** allow SELECT operations

3. **Check browser popup blocker** (may block downloads)

4. **Try right-click → Save As** on view link

### ❌ Delete Not Working

**Problem**: Delete button doesn't work.

**Solutions**:

1. **Check storage policies** allow DELETE operations

2. **Verify service role key** in `.env.local`

3. **Check browser console** for error messages

4. **Ensure confirmation dialog** appears and is confirmed

## 🎨 UI/Display Issues

### ❌ Styling Looks Broken

**Problem**: CSS not loading properly.

**Solutions**:

1. **Clear browser cache** (Ctrl+F5 or Cmd+Shift+R)

2. **Check for JavaScript errors** in console

3. **Verify Tailwind CSS** is working

4. **Restart development server**

### ❌ Dark Mode Issues

**Problem**: Dark mode not working correctly.

**Solutions**:

1. **Check system theme** settings

2. **Clear browser cache**

3. **Verify CSS variables** are defined

4. **Check for conflicting styles**

## 🔍 Debugging Steps

### 1. Check Browser Console

```javascript
// Open browser dev tools (F12)
// Look for errors in Console tab
// Check Network tab for failed requests

```

### 2. Verify Environment

```bash

# Test Supabase connection

npm run test-connection

# Check bucket status

npm run check-buckets

# List available scripts

npm run

```

### 3. Check Supabase Dashboard

1. **Project Status**: Ensure project is active

2. **Storage**: Verify buckets and files exist

3. **Database**: Check tables and data

4. **API**: Verify keys are correct

### 4. Test with Minimal Example

```bash

# Try uploading a small test file

# Check if basic functionality works

# Isolate the specific issue

```

## 📞 Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide

2. ✅ Read the full README.md

3. ✅ Check browser console for errors

4. ✅ Verify Supabase project setup

5. ✅ Try the automated setup scripts

### When Reporting Issues

Include:

- Error messages (exact text)

- Browser console output

- Steps to reproduce

- Environment details (OS, Node.js version, browser)

- Supabase project status

### Useful Commands for Debugging

```bash

# Check versions

node --version
npm --version

# Test connection

npm run test-connection

# Check buckets

npm run check-buckets

# View logs

npm run dev  # Check terminal output

```

---

## Still having issues? Check the README.md for more detailed setup instructions! 📚
