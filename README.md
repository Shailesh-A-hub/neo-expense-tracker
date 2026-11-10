# Neo Expense Tracker

Mobile-first personal finance app using Next.js 15, Supabase Auth and PostgreSQL.

## Included
- Email/password sign-up and sign-in
- Session refresh with Next.js proxy
- Protected dashboard using verified Supabase claims
- Income and expense entry
- Monthly INR summary and recent transactions
- Responsive layout and installable web manifest

## Setup
1. Apply the Neo Finance database migration in the Supabase project.
2. Copy `.env.example` to `.env.local` and add the Supabase project URL and publishable key.
3. Run `npm install` then `npm run dev`.

## Vercel
Import this repository into Vercel and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the project environment variables.

Never expose a Supabase service-role key in browser code or commit secrets.

## Roadmap
- v1.0: responsive interface and authentication
- v1.1: expenses, income and budgets
- v1.2: gold, silver and other asset portfolio
- v1.3: live rates and profit/loss
- v2.0: analytics, reports, backups and advanced features