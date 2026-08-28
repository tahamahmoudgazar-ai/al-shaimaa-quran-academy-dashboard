# Al Shaimaa Academy System

Independent academy management system starter.

## Stack
- Next.js App Router
- React
- Supabase / PostgreSQL (prepared)
- Responsive CSS
- Lucide icons

## Current prototype
- Login screen
- Admin dashboard
- Teacher dashboard
- Student dashboard
- Students, Teachers, Courses, Schedule, Attendance, Payments, Reports, Settings
- Responsive sidebar/header
- Mock data
- Supabase environment placeholders

## Run locally
```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Supabase
Create `.env.local` from `.env.example` and add:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Authentication and database queries are intentionally left as the next implementation phase.
