# 🚀 Quick Start Guide

Get the Simple Learning Website up and running in 5 minutes!

## 🎯 One-Command Setup

### For Linux/macOS:

```bash
chmod +x setup.sh && ./setup.sh

```

### For Windows:

```cmd
setup.bat

```

## 📋 Manual Setup (if automated setup fails)

### 1. Prerequisites Check

```bash
node --version  # Should be 18.x or later

npm --version   # Should be available

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Configure Environment

```bash

# Copy environment template

cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials

# Get these from: https://supabase.com/dashboard → Project Settings → API

```

### 4. Set Up Supabase

#### Create Database Tables:

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create papers table
CREATE TABLE IF NOT EXISTS papers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    paper_type TEXT DEFAULT 'other',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID,
    status TEXT DEFAULT 'completed'
);

-- Create solutions table
CREATE TABLE IF NOT EXISTS solutions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    paper_id UUID NOT NULL,
    question_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID,
    content TEXT DEFAULT ''
);

-- Add foreign key constraint
ALTER TABLE solutions ADD CONSTRAINT solutions_paper_id_fkey 
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE;

```

#### Create Storage Buckets:

```bash
npm run setup-buckets

```

#### Set Up Storage Policies:

```bash
npm run setup-policies

```

### 5. Start Development Server

```bash
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✅ Verification

### Test the Setup:

```bash
npm run test-connection  # Test Supabase connection

npm run check-buckets    # Verify storage buckets

```

### Expected Results:

- ✅ Supabase connection successful

- ✅ Papers bucket exists and accessible

- ✅ Solutions bucket exists and accessible

- ✅ Database tables created

- ✅ Storage policies configured

## 🎯 First Steps

1. **Upload a Paper**:

   - Go to `/upload-example`
   - Select "Paper" type
   - Enter title and select file
   - Choose category (exam/assignment/notes/other)

2. **Upload a Solution**:

   - Select "Solution" type
   - Choose the paper from dropdown
   - Enter question ID (e.g., "Question 1a")
   - Select solution file

3. **Browse Content**:

   - Go to `/browse`
   - Search, filter, view, download, or delete files

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Missing Supabase credentials" | Update `.env.local` with correct values |
| "Bucket not found" | Run `npm run setup-buckets` |
| "Permission denied" | Run `npm run setup-policies` |
| "Connection failed" | Check Supabase project is active |

## 📞 Need Help?

1. Check the full [README.md](README.md) for detailed instructions

2. Verify your Supabase project settings

3. Check browser console for error messages

4. Ensure all environment variables are set correctly

---

**Ready to learn! 📚✨**
