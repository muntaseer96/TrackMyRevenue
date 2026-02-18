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
│   ├── portfolio/    # PortfolioSummary, AssetList, AssetForm, AssetDetail, TransactionForm, ValuationForm, AssetAllocationChart
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
- `assets` - Portfolio assets (stocks, real estate, FD, gold, crypto, bonds, etc.)
- `asset_transactions` - Buy/sell/dividend/income records per asset
- `asset_valuations` - Monthly market value snapshots per asset
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
5. Portfolio tracking (multi-asset: stocks, real estate, FD, crypto, bonds, etc.)
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

## Session Notes - 2026-02-14 (2)

### What was done:
- Changed transaction form day picker default from today's date to the day of the last transaction added
  - Added `lastTransactionDay` state in `src/pages/Cashflow.tsx` to track the day from the most recently created transaction
  - Passed it as a prop to `TransactionForm` component
  - Updated `src/components/cashflow/TransactionForm.tsx` to use `lastTransactionDay` as default when available, falling back to today's date on first use in a session
  - Value is capped to the number of days in the selected month

### Important context:
- The `lastTransactionDay` state resets on page reload (session-scoped) — first form open still defaults to today's date
- Editing a transaction does not update the last day; only new transaction creation does

## Session Notes - 2026-02-18

### What was done:
- Added `is_allocated` toggle to global expenses so users can control which expenses get allocated across websites
  - Added `is_allocated boolean DEFAULT true` column to `tools` table via Supabase migration
  - Updated TypeScript types (`src/types/index.ts`, `src/types/database.ts`) with the new field
  - Updated `src/hooks/useWebsiteStats.ts` to filter global expenses by `is_allocated` before calculating per-website allocation
  - Updated `src/hooks/useDashboardStats.ts` to only use allocated expenses when splitting costs across websites (total expense calculations still include all expenses)
  - Added "Allocate to websites" checkbox in `src/components/expenses/ExpenseForm.tsx` (only shown for global expenses, defaults to checked)
  - Updated `src/hooks/useExpenses.ts` — `useCreateExpense`, `useCreateYearlyExpense`, `useUpdateExpense`, and `useAutoPopulateExpenses` all pass `is_allocated` through
  - Added Share2 icon indicator next to allocated expenses in `src/components/expenses/ExpensesList.tsx` and yearly section of `MonthlyExpensesEntry.tsx`
  - Updated `src/hooks/useYears.ts` to carry over `is_allocated` when copying yearly expenses to a new year

### Important context:
- Existing expenses all default to `is_allocated = true` (no behavior change for existing data)
- The `is_allocated` check uses `!== false` pattern to handle null/undefined safely (treats null as allocated)
- Non-allocated expenses still count toward overall expense totals — they just aren't split across website detail pages
- The checkbox only appears for global expenses (where `website_id` is null); website-specific expenses don't need it

## Session Notes - 2026-02-18 (2)

### What was done:
- **Full portfolio tracker redesign** — replaced the simple investment/dividend tracker with a multi-asset portfolio system
- **Database migration** (`replace_investments_with_portfolio`):
  - Dropped old `dividends` and `investments` tables
  - Created `assets` (8 asset types: bd_stock, intl_stock, real_estate, fixed_deposit, gold, crypto, bond, other)
  - Created `asset_transactions` (buy, sell, dividend, interest, rental_income, other_income)
  - Created `asset_valuations` (monthly value snapshots with UNIQUE per asset/year/month)
  - All tables have RLS policies and indexes on user_id, asset_id, year, asset_type
- **New hooks** (4 files):
  - `src/hooks/useAssets.ts` — CRUD for assets (NOT year-scoped, assets persist across years)
  - `src/hooks/useAssetTransactions.ts` — CRUD with auto-update of asset cost basis on buy/sell
  - `src/hooks/useAssetValuations.ts` — upsert pattern, also updates parent asset's `current_value`
  - `src/hooks/usePortfolioStats.ts` — computes totals, gain/loss, ROI, allocation by type with USD→BDT conversion
- **New UI components** (`src/components/portfolio/`, 7 files):
  - `PortfolioSummary` — 4 KPI cards (Total Value, Gain/Loss, Income, ROI)
  - `AssetList` — filterable by type, type badges with colors, expand/collapse, 3-dot menu
  - `AssetDetail` — expanded view with transaction history and valuation history
  - `AssetForm` — dynamic modal with conditional fields based on asset_type (useWatch)
  - `TransactionForm` — modal for buy/sell/dividend/income with conditional quantity/price fields
  - `ValuationForm` — simple month+value modal for updating market value
  - `AssetAllocationChart` — Recharts donut chart for portfolio allocation by type
- **Dashboard integration** — replaced `dividends` fetch with `asset_transactions` query (income types) with per-transaction currency handling via join
- **Sidebar** — changed "Investments" to "Portfolio" with Briefcase icon
- **Deleted**: `src/hooks/useInvestments.ts`, `src/components/investments/` directory
- **Updated**: `useFinancialSummary.ts` (uses usePortfolioStats), `useYears.ts` (removed investment copy on new year — assets persist)
- **UX fixes**:
  - Auto-sync `current_value` to `purchase_price` when adding new assets (prevents 0-value / -100% bug)
  - Quantity input accepts any decimal precision (`step="any"`) for fractional shares
  - USD assets display in USD (large) with BDT equivalent (small parentheses) in asset list
  - Intl Stock badge color changed to pink (#ec4899) to distinguish from BD Stock blue (#3b82f6)
  - Buy transactions auto-update asset's `purchase_price` and `quantity`; sell transactions reduce proportionally

### Important context:
- Assets persist across years — no year column, no copy on new year creation
- Transaction tracking is opt-in per asset (`has_transactions` flag)
- Buy/sell transactions auto-update asset cost basis and quantity in `useCreateAssetTransaction`
- Sell cost reduction is proportional (average cost per unit method)
- USD→BDT conversion uses `DEFAULT_EXCHANGE_RATE = 122` from `useExchangeRates.ts`
- Asset type color scheme: BD Stock #3b82f6, Intl Stock #ec4899, Real Estate #f59e0b, FD #10b981, Gold #eab308, Crypto #8b5cf6, Bond #06b6d4, Other #6b7280
- Old `dividends` and `investments` tables are permanently dropped — data was re-entered through the UI
