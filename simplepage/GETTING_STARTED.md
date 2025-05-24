# 🎯 Getting Started - Simple Learning Website

Welcome! This guide will get you up and running with the Simple Learning Website in just a few minutes.

## 🚀 Choose Your Setup Method

### Option 1: Automated Setup (Recommended)

**For Linux/macOS:**

```bash
chmod +x setup.sh && ./setup.sh

```

**For Windows:**

```cmd
setup.bat

```

### Option 2: Quick Manual Setup

Follow the [QUICK_START.md](QUICK_START.md) guide.

### Option 3: Detailed Manual Setup

Follow the comprehensive [README.md](README.md) guide.

## 📋 What You'll Need

Before starting, make sure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))

- ✅ **Git** installed ([Download](https://git-scm.com/))

- ✅ **Supabase account** ([Sign up](https://supabase.com/))

## 🎯 5-Minute Setup Checklist

### Step 1: Clone & Install

```bash
git clone <your-repo-url>
cd simplepage
npm install

```

### Step 2: Supabase Setup

1. Create new project at [supabase.com/dashboard](https://supabase.com/dashboard)

2. Get your credentials from Project Settings → API

3. Copy `.env.local.example` to `.env.local`

4. Update `.env.local` with your credentials

### Step 3: Database & Storage

```bash

# Run these commands in order:

npm run test-connection    # Verify connection

npm run setup-buckets     # Create storage buckets

npm run setup-policies    # Configure permissions

```

### Step 4: Database Tables

Copy and run this SQL in your Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

ALTER TABLE solutions ADD CONSTRAINT solutions_paper_id_fkey
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE;

```

### Step 5: Start the App

```bash
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) 🎉

## ✅ Verify Everything Works

1. **Home Page**: Should load without errors

2. **Upload Page**: Try uploading a test file

3. **Browse Page**: Should show uploaded files

4. **Delete**: Try deleting a test file

## 🆘 Having Issues?

| Problem | Quick Fix |
|---------|-----------|
| "Missing credentials" | Update `.env.local` with Supabase keys |
| "Bucket not found" | Run `npm run setup-buckets` |
| "Permission denied" | Run `npm run setup-policies` |
| Other issues | Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |

## 📚 Next Steps

Once everything is working:

1. **Upload Papers**: Go to `/upload-example` and try uploading academic papers

2. **Add Solutions**: Upload solutions linked to specific questions

3. **Organize Content**: Use categories and search to organize your materials

4. **Explore Features**: Try viewing, downloading, and deleting files

## 📖 Documentation

- **[README.md](README.md)** - Complete setup and feature documentation

- **[QUICK_START.md](QUICK_START.md)** - Condensed setup guide

- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

## 🎯 Key Features to Try

- 📄 **Upload Papers** - PDF, DOCX, images supported

- 💡 **Link Solutions** - Associate answers with specific questions

- 🗂️ **Categorize** - Organize by exam, assignment, notes, other

- 🔍 **Search** - Find content quickly

- 📥 **Download** - Get files when you need them

- 🗑️ **Delete** - Remove unwanted content safely

---

## Ready to start learning? Let's go! 🚀📚
