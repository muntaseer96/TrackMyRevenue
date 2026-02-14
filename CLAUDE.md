# TrackMyRevenue - Project Instructions

## Project Overview
Personal revenue/expense/profit tracking tool for multiple online ventures with monthly granularity.

## Tech Stack
- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** TailwindCSS
- **State Management:** Zustand + React Query
- **Backend:** Supabase (Auth, PostgreSQL, Storage)
- **Hosting:** Netlify
- **Charts:** Recharts

## Project Structure
```
src/
├── components/
│   ├── ui/           # Reusable UI (Button, Input, Modal, Table, Card, Select, Tabs)
│   ├── layout/       # Sidebar, Header, Layout wrapper
│   ├── dashboard/    # KPICards, DateRangeFilter, DashboardCharts
│   ├── websites/     # WebsiteList, WebsiteForm, WebsiteDetail, MonthlyDataEntry
│   ├── categories/   # CategoryList, CategoryForm, CategoryAnalytics
│   ├── investments/  # InvestmentList, InvestmentForm
│   ├── tools/        # ToolsList, ToolForm
│   └── charts/       # BarChart, LineChart, PieChart wrappers
├── pages/            # Route pages
├── hooks/            # Custom hooks (useAuth, useWebsites, useCategories, etc.)
├── lib/              # Supabase client, utilities
├── stores/           # Zustand stores
├── types/            # TypeScript type definitions
└── utils/            # Helper functions (formatCurrency, dateUtils, csvParser)
```

## Database Tables (Supabase)
- `profiles` - User profile data
- `websites` - Income sources/sites
- `categories` - Revenue and expense categories
- `website_categories` - Junction table for site-category assignment
- `monthly_entries` - Core financial data per month
- `investments` - Dividend tracking
- `tools` - Recurring tool costs

## Naming Conventions
- **Components:** PascalCase (e.g., `WebsiteList.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useWebsites.ts`)
- **Utils:** camelCase (e.g., `formatCurrency.ts`)
- **Types:** PascalCase with descriptive names (e.g., `Website`, `MonthlyEntry`)

## Color Palette (from mockups)
```
Primary Green:       #5A8C27
Primary Green Light: #B8E6A0
Background:          #F5F5F5
Text Primary:        #333333
Text Secondary:      #666666
Danger/Error:        #E31E24
Warning:             #F39C12
Link Blue:           #0066CC
```

## Currency
- Primary currency: BDT (Bangladeshi Taka)
- Tools tracked in USD with exchange rate conversion to BDT
- Format: `৳ XX,XXX` for BDT, `$XX.XX` for USD

## Key Features
1. Dashboard with KPIs and charts
2. Website/Site management (CRUD)
3. Category management (Revenue/Expense per site)
4. Monthly data entry with auto-calculations
5. Investment/Dividend tracking
6. Tool/Recurring cost tracking
7. CSV import for historical data
8. User profile management

## Reference Files
- **UI Mockups:** `/Frontend Mockup/` (41 design files)
- **Sample Data:** `/2025 CSV Data/` (6 CSV files showing data structure)

## Important Notes
- All financial calculations: Profit = Revenue - Expense
- Profit Margin = (Profit / Revenue) * 100
- Data is tracked at monthly granularity (year + month)
- Each website has its own set of revenue/expense categories
- Categories can be shared across websites via junction table

## Development Commands
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Environment Variables
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Session Notes - 2026-01-26

### What was done:
- Diagnosed and fixed site not loading issue - Supabase project was paused due to 7-day inactivity
- Restored the paused Supabase project from the dashboard
- Added GitHub Actions cron job to prevent future Supabase pauses (`.github/workflows/keep-supabase-alive.yml`)
  - Runs every 5 days to ping Supabase and keep the project active
  - Configured with `SUPABASE_URL` and `SUPABASE_ANON_KEY` secrets in GitHub repo settings
  - Tested manually and confirmed working (200 response)
- Added smart category filtering in transaction form (`src/components/cashflow/TransactionForm.tsx`)
  - Positive amounts automatically show only income categories
  - Negative amounts automatically show only expense categories
  - Label indicates which category type is being shown ("showing income/expense categories")
  - Auto-clears category selection if amount sign changes and category type doesn't match

### Important context:
- Supabase project ID: `svvvquhcmqxznxughuvt` (in organization `cmpvifgowmgqmsgvgfuc`)
- Free-tier Supabase projects pause after 7 days of inactivity - the cron job prevents this
- GitHub repo: `muntaseer96/TrackMyRevenue`
- GitHub Actions secrets configured: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

## Session Notes - 2026-02-14

### What was done:
- Investigated why Supabase paused again despite the keep-alive cron job from Jan 26
- Root cause: GitHub silently skips scheduled workflows on repositories with no recent commit activity
  - The cron job from Jan 26 only ran once (manually triggered) and never ran on schedule
- Fixed the workflow (`.github/workflows/keep-supabase-alive.yml`) with two changes:
  1. Added `permissions: contents: write` to allow the workflow to push commits
  2. Added steps to commit a timestamp file (`.github/last-supabase-ping.txt`) each run
- The commit step keeps the repo "active" so GitHub continues running scheduled workflows
- Tested workflow manually - now passes successfully

### Important context:
- GitHub Actions scheduled workflows require recent repo activity to run reliably
- The workflow now self-maintains activity by committing a timestamp file each run
- Workflow runs every 5 days (`0 0 */5 * *`) - check runs at: https://github.com/muntaseer96/TrackMyRevenue/actions/workflows/keep-supabase-alive.yml
