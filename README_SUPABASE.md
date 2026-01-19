# Text2MindMap Supabase Setup Guide

This project now uses Supabase for user authentication and cloud storage. Follow these steps to set it up.

## 1. Create a Supabase Project

1. Go to [database.new](https://database.new) and create a new project.
2. Once created, go to **Project Settings** -> **API**.
3. Copy the `Project URL` and `anon` public key.

## 2. Environment Variables

Create a `.env.local` file in the root directory (if not exists) and add your keys:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Database Setup

1. Go to the **SQL Editor** in your Supabase Dashboard.
2. Open the `supabase-schema.sql` file from this project.
3. Copy the entire content and paste it into the SQL Editor.
4. Click **Run** to create the tables and security policies.

## 4. Authentication Settings

1. Go to **Authentication** -> **URL Configuration**.
2. Add your production URL (e.g., `https://your-app.vercel.app`) to **Site URL** and **Redirect URLs**.
3. (Optional) Go to **Providers** and enable Google/GitHub login if you want to implement them later.

## 5. Deployment to Vercel

1. Push your code to GitHub.
2. Import the project in Vercel.
3. In **Environment Variables**, add the same variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## Features

- **User Auth**: Sign up, Sign in, Sign out.
- **Cloud Storage**: Mind maps are saved to the database.
- **Settings Sync**: API keys and preferences are synced across devices.
- **Offline Support**: If not logged in, data is saved to `localStorage`.
