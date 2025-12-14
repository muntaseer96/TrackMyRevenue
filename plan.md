# TrackMyRevenue - Implementation Plan

## Overview
Build a personal revenue/expense/profit tracking tool for multiple online ventures.

**Tech Stack:** React + Vite + TypeScript | TailwindCSS | Supabase | Netlify

---

## Phase 1: Project Setup & Configuration [DONE]

### 1.1 Initialize Vite Project
```bash
npm create vite@latest . -- --template react-ts
npm install
```

### 1.2 Install Dependencies
```bash
# Core
npm install @supabase/supabase-js react-router-dom

# State & Data Fetching
npm install @tanstack/react-query zustand

# UI Components (Radix UI for accessibility)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast

# Icons
npm install lucide-react

# Utility
npm install clsx tailwind-merge

# Charts
npm install recharts

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# CSV Parsing (for import feature)
npm install papaparse
npm install -D @types/papaparse

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 1.3 Configure TailwindCSS
Update `tailwind.config.js`:
```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5A8C27',
          light: '#B8E6A0',
        },
        danger: '#E31E24',
        warning: '#F39C12',
      },
    },
  },
  plugins: [],
}
```

### 1.4 Create Folder Structure
```
src/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── websites/
│   ├── categories/
│   ├── investments/
│   ├── tools/
│   └── charts/
├── pages/
├── hooks/
├── lib/
├── stores/
├── types/
└── utils/
```

### 1.5 Set Up Supabase Client
Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### 1.6 Create Environment File
Create `.env.local`:
```
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

### Deliverables Phase 1:
- [ ] Vite project initialized with TypeScript
- [ ] All dependencies installed
- [ ] TailwindCSS configured with custom colors
- [ ] Folder structure created
- [ ] Supabase client configured
- [ ] Environment variables set up

---

## Phase 2: Supabase Database Setup [DONE]

### 2.1 Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Note down project URL and anon key

### 2.2 Create Database Tables
Run in Supabase SQL Editor:

```sql
-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Websites/Income Sources
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (Revenue or Expense)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Website-Category Junction Table
CREATE TABLE website_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, category_id)
);

-- Monthly Financial Entries
CREATE TABLE monthly_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, category_id, year, month)
);

-- Investments/Dividends
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  dividend_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tools/Recurring Costs
CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  cost_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  exchange_rate DECIMAL(10,2) NOT NULL DEFAULT 122,
  cost_bdt DECIMAL(15,2) GENERATED ALWAYS AS (cost_usd * exchange_rate) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Create Indexes
```sql
CREATE INDEX idx_websites_user ON websites(user_id);
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_monthly_entries_date ON monthly_entries(year, month);
CREATE INDEX idx_monthly_entries_website ON monthly_entries(website_id);
CREATE INDEX idx_monthly_entries_user ON monthly_entries(user_id);
CREATE INDEX idx_investments_date ON investments(year, month);
CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_tools_date ON tools(year, month);
CREATE INDEX idx_tools_user ON tools(user_id);
```

### 2.4 Enable Row Level Security
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Websites policies
CREATE POLICY "Users can manage own websites" ON websites
  FOR ALL USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Users can manage own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

-- Website Categories policies
CREATE POLICY "Users can manage own website_categories" ON website_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM websites WHERE websites.id = website_categories.website_id
      AND websites.user_id = auth.uid()
    )
  );

-- Monthly Entries policies
CREATE POLICY "Users can manage own entries" ON monthly_entries
  FOR ALL USING (auth.uid() = user_id);

-- Investments policies
CREATE POLICY "Users can manage own investments" ON investments
  FOR ALL USING (auth.uid() = user_id);

-- Tools policies
CREATE POLICY "Users can manage own tools" ON tools
  FOR ALL USING (auth.uid() = user_id);
```

### 2.5 Create Profile Trigger
```sql
-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2.6 Create TypeScript Types
Create `src/types/database.ts` with generated types from Supabase.

### Deliverables Phase 2:
- [ ] Supabase project created
- [ ] All 7 tables created
- [ ] Indexes created for performance
- [ ] RLS policies enabled and configured
- [ ] Profile auto-creation trigger set up
- [ ] TypeScript types generated

---

## Phase 3: Authentication System [DONE]

### 3.1 Create Auth Store
Create `src/stores/authStore.ts`:
```typescript
import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  // ... implementation
}))
```

### 3.2 Create Auth Hook
Create `src/hooks/useAuth.ts` for auth utilities.

### 3.3 Create Login Page
Create `src/pages/Login.tsx`:
- Email input
- Password input
- Sign In button
- Sign Up link
- Error handling

### 3.4 Create Protected Route Component
Create `src/components/auth/ProtectedRoute.tsx`:
- Check auth state
- Redirect to login if not authenticated
- Show loading state

### 3.5 Set Up React Router
Create `src/App.tsx` with routes:
```typescript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/websites" element={<Websites />} />
    <Route path="/websites/:id" element={<WebsiteDetail />} />
    <Route path="/categories" element={<Categories />} />
    <Route path="/investments" element={<Investments />} />
    <Route path="/tools" element={<Tools />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/import" element={<Import />} />
  </Route>
</Routes>
```

### Deliverables Phase 3:
- [ ] Auth store with Zustand
- [ ] Login page with form
- [ ] Sign up functionality
- [ ] Protected route component
- [ ] React Router configured
- [ ] Auth state persistence

---

## Phase 4: Layout & UI Components [DONE]

### 4.1 Create Base UI Components
In `src/components/ui/`:

**Button.tsx**
- Variants: primary, secondary, danger, ghost
- Sizes: sm, md, lg
- Loading state

**Input.tsx**
- Text, number, email types
- Error state
- Label support

**Modal.tsx** (using Radix Dialog)
- Title, description, content
- Close button
- Overlay

**Table.tsx**
- Header, Body, Row, Cell
- Sortable columns
- Loading state

**Card.tsx**
- Title, content, footer
- Variants for KPI cards

**Select.tsx** (using Radix Select)
- Options list
- Placeholder
- Search/filter

**Tabs.tsx** (using Radix Tabs)
- Tab list
- Tab content panels

### 4.2 Create Layout Components
In `src/components/layout/`:

**Sidebar.tsx**
- Logo
- Navigation links:
  - Dashboard
  - My Websites
  - Categories
  - Investments
  - Tools
  - Profile
- Logout button
- Active state highlighting

**Header.tsx**
- Page title
- Breadcrumbs (optional)
- User avatar

**Layout.tsx**
- Combines Sidebar + Header + main content area
- Responsive design

### 4.3 Create Utility Functions
**src/utils/formatCurrency.ts**
```typescript
export function formatBDT(amount: number): string {
  return `৳ ${amount.toLocaleString('en-BD')}`
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`
}
```

**src/utils/dateUtils.ts**
```typescript
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function getMonthName(month: number): string {
  return MONTHS[month - 1]
}
```

### Deliverables Phase 4:
- [ ] Button component with variants
- [ ] Input component with validation
- [ ] Modal component
- [ ] Table component
- [ ] Card component
- [ ] Select component
- [ ] Tabs component
- [ ] Sidebar with navigation
- [ ] Header component
- [ ] Layout wrapper
- [ ] Currency formatting utilities
- [ ] Date utilities

---

## Phase 5: Websites Management [DONE]

### 5.1 Create Website Types
In `src/types/index.ts`:
```typescript
export interface Website {
  id: string
  user_id: string
  name: string
  url: string | null
  created_at: string
  updated_at: string
}
```

### 5.2 Create Website Hooks
**src/hooks/useWebsites.ts**
```typescript
// useWebsites - fetch all websites
// useWebsite - fetch single website
// useCreateWebsite - create new website
// useUpdateWebsite - update website
// useDeleteWebsite - delete website
```

### 5.3 Create Website Components
**WebsiteList.tsx**
- Table displaying all websites
- Columns: Name, URL, Created Date, Actions
- Search filter
- Pagination
- Add New button

**WebsiteForm.tsx**
- Modal form for create/edit
- Fields: Name, URL
- Validation with Zod
- Submit handler

**DeleteConfirmation.tsx**
- Warning message
- Confirm/Cancel buttons

### 5.4 Create Websites Page
**src/pages/Websites.tsx**
- Page title
- WebsiteList component
- WebsiteForm modal
- Toast notifications for success/error

### Deliverables Phase 5:
- [ ] Website TypeScript types
- [ ] useWebsites hook with React Query
- [ ] useCreateWebsite mutation
- [ ] useUpdateWebsite mutation
- [ ] useDeleteWebsite mutation
- [ ] WebsiteList component
- [ ] WebsiteForm component
- [ ] Delete confirmation dialog
- [ ] Websites page

---

## Phase 6: Categories Management [DONE]

### 6.1 Create Category Types
```typescript
export interface Category {
  id: string
  user_id: string
  name: string
  type: 'revenue' | 'expense'
  created_at: string
}

export interface WebsiteCategory {
  id: string
  website_id: string
  category_id: string
}
```

### 6.2 Create Category Hooks
**src/hooks/useCategories.ts**
- useCategories - fetch all categories
- useCategoriesByType - fetch by revenue/expense
- useCreateCategory
- useDeleteCategory
- useAssignCategory - assign to website
- useUnassignCategory

### 6.3 Create Category Components
**CategoryList.tsx**
- Tabs: Revenue | Expense
- Table with categories
- Search filter
- Add New button

**CategoryForm.tsx**
- Modal for create
- Fields: Name, Type (select)

### 6.4 Create Categories Page
**src/pages/Categories.tsx**
- Tab navigation
- CategoryList component
- CategoryForm modal

### Deliverables Phase 6:
- [ ] Category TypeScript types
- [ ] Category hooks with React Query
- [ ] CategoryList with tabs
- [ ] CategoryForm component
- [ ] Categories page
- [ ] Category assignment to websites

---

## Phase 7: Monthly Data Entry [DONE]

### 7.1 Create Entry Types
```typescript
export interface MonthlyEntry {
  id: string
  user_id: string
  website_id: string
  category_id: string
  year: number
  month: number
  amount: number
  created_at: string
  updated_at: string
}
```

### 7.2 Create Entry Hooks
**src/hooks/useMonthlyData.ts**
- useMonthlyEntries(websiteId, year, month)
- useCreateEntry
- useUpdateEntry
- useDeleteEntry
- useBulkUpdateEntries

### 7.3 Create Website Detail Components
**MonthSelector.tsx**
- Year dropdown
- Month dropdown
- Previous/Next navigation arrows

**MonthlyDataEntry.tsx**
- Category list with input fields
- Grouped by revenue/expense
- Auto-calculate totals
- Save button

**EntryTable.tsx**
- Display all entries for month
- Edit/Delete actions

**ProfitSummary.tsx**
- Total Revenue
- Total Expense
- Profit
- Profit Margin %

### 7.4 Create Website Detail Page
**src/pages/WebsiteDetail.tsx**
- Website name header
- MonthSelector
- Category assignment section
- MonthlyDataEntry
- ProfitSummary card

### Deliverables Phase 7:
- [ ] MonthlyEntry types
- [ ] Monthly data hooks
- [ ] MonthSelector component
- [ ] MonthlyDataEntry form
- [ ] Entry table with edit/delete
- [ ] Profit summary card
- [ ] Website detail page

---

## Phase 8: Dashboard & Analytics [DONE]

### 8.1 Create Dashboard Hooks
**src/hooks/useDashboard.ts**
- useDashboardStats(year, startMonth?, endMonth?)
  - Total revenue across all sites
  - Total expenses
  - Total profit
  - Profit margin
  - Top revenue category
  - Top expense category
- useMonthlyTrends(year)
- useRevenueByWebsite(year, month?)
- useCategoryBreakdown(year, month?, type)

### 8.2 Create Dashboard Components
**KPICards.tsx**
- 4-6 cards in a grid
- Total Revenue
- Total Expense
- Total Profit
- Profit Margin
- Top Categories

**DateRangeFilter.tsx**
- Quick filters: This Year, This Month
- Custom year selection
- Custom range (from month to month)

**RevenueExpenseChart.tsx**
- Bar chart using Recharts
- Monthly comparison
- Revenue vs Expense

**WebsiteRevenueChart.tsx**
- Pie or Bar chart
- Revenue breakdown by website

**CategoryChart.tsx**
- Bar chart
- Top categories by amount

### 8.3 Create Chart Components
**src/components/charts/**
- BarChart.tsx - wrapper around Recharts
- LineChart.tsx
- PieChart.tsx
- Common styling and responsiveness

### 8.4 Create Dashboard Page
**src/pages/Dashboard.tsx**
- DateRangeFilter at top
- KPICards grid
- Charts section:
  - Revenue/Expense trends
  - Revenue by website
  - Category breakdown

### Deliverables Phase 8:
- [ ] Dashboard stats hooks
- [ ] KPICards component
- [ ] DateRangeFilter component
- [ ] RevenueExpenseChart
- [ ] WebsiteRevenueChart
- [ ] CategoryChart
- [ ] Recharts wrapper components
- [ ] Dashboard page

---

## Phase 9: Investments Tracking [DONE]

### 9.1 Create Investment Types
```typescript
export interface Investment {
  id: string
  user_id: string
  company_name: string
  year: number
  month: number
  dividend_amount: number
  created_at: string
}
```

### 9.2 Create Investment Hooks
**src/hooks/useInvestments.ts**
- useInvestments(year?)
- useInvestmentsByMonth(year, month)
- useCreateInvestment
- useUpdateInvestment
- useDeleteInvestment

### 9.3 Create Investment Components
**InvestmentList.tsx**
- Monthly grouped view
- Company name, amount columns
- Edit/Delete actions

**InvestmentForm.tsx**
- Modal form
- Fields: Company Name, Month, Year, Amount

**InvestmentSummary.tsx**
- Monthly total
- Yearly total

### 9.4 Create Investments Page
**src/pages/Investments.tsx**
- Year selector
- InvestmentList
- Add button with form
- Summary card

### Deliverables Phase 9:
- [ ] Investment types
- [ ] Investment hooks
- [ ] InvestmentList component
- [ ] InvestmentForm component
- [ ] InvestmentSummary
- [ ] Investments page

---

## Phase 10: Tools/Recurring Costs [DONE]

### 10.1 Create Tool Types
```typescript
export interface Tool {
  id: string
  user_id: string
  name: string
  year: number
  month: number
  cost_usd: number
  exchange_rate: number
  cost_bdt: number // computed
  created_at: string
}
```

### 10.2 Create Tool Hooks
**src/hooks/useTools.ts**
- useTools(year?)
- useToolsByMonth(year, month)
- useCreateTool
- useUpdateTool
- useDeleteTool

### 10.3 Create Tool Components
**ToolsList.tsx**
- Monthly grouped view
- Columns: Name, USD Cost, Exchange Rate, BDT Cost
- Edit/Delete actions

**ToolForm.tsx**
- Modal form
- Fields: Name, Month, Year, Cost USD, Exchange Rate
- Auto-calculate BDT preview

**ToolsSummary.tsx**
- Monthly total (USD and BDT)
- Yearly total

### 10.4 Create Tools Page
**src/pages/Tools.tsx**
- Year/Month selector
- ToolsList
- Add button with form
- Summary card

### Deliverables Phase 10:
- [ ] Tool types
- [ ] Tool hooks
- [ ] ToolsList component
- [ ] ToolForm component
- [ ] ToolsSummary
- [ ] Tools page

---

## Phase 11: User Profile [DONE]

### 11.1 Create Profile Hooks
**src/hooks/useProfile.ts**
- useProfile - fetch current user profile
- useUpdateProfile
- useUpdateEmail (with verification)
- useUpdatePassword
- useUploadAvatar

### 11.2 Create Profile Components
**ProfileForm.tsx**
- Display name field
- Email field (with change button)
- Phone field (with change button)
- Avatar upload

**ChangePasswordForm.tsx**
- Current password
- New password
- Confirm password

**LogoutConfirmation.tsx**
- Confirmation dialog
- Logout action

### 11.3 Create Profile Page
**src/pages/Profile.tsx**
- ProfileForm
- Change password section
- Logout button

### Deliverables Phase 11:
- [ ] Profile hooks
- [ ] ProfileForm component
- [ ] ChangePasswordForm
- [ ] LogoutConfirmation
- [ ] Profile page
- [ ] Avatar upload to Supabase Storage

---

## Phase 12: CSV Import

### 12.1 Create CSV Parser Utilities
**src/utils/csvParser.ts**
```typescript
// Parse different CSV formats:
// - Website monthly data (horizontal months)
// - Investments (company, month, amount)
// - Tools (name, month, cost)

export function parseWebsiteCSV(csv: string): ParsedWebsiteData
export function parseInvestmentsCSV(csv: string): ParsedInvestmentData
export function parseToolsCSV(csv: string): ParsedToolData
```

### 12.2 Create Import Components
**ImportTypePicker.tsx**
- Select import type:
  - Website Data
  - Investments
  - Tools

**FileUpload.tsx**
- Drag and drop
- File selection
- File type validation

**ImportPreview.tsx**
- Table showing parsed data
- Error highlighting
- Column mapping (if needed)

**ImportConfirmation.tsx**
- Summary of what will be imported
- Confirm/Cancel

### 12.3 Create Import Page
**src/pages/Import.tsx**
- Step wizard:
  1. Select type
  2. Upload file
  3. Preview & validate
  4. Confirm import
- Progress indicator
- Success/error summary

### Deliverables Phase 12:
- [ ] CSV parsing utilities for each format
- [ ] ImportTypePicker component
- [ ] FileUpload component
- [ ] ImportPreview component
- [ ] ImportConfirmation component
- [ ] Import page with step wizard
- [ ] Error handling and validation

---

## Phase 13: Polish & Deployment

### 13.1 Error Handling
- Global error boundary
- Toast notifications for errors
- Form validation messages

### 13.2 Loading States
- Skeleton loaders for tables
- Spinner for buttons
- Page loading indicators

### 13.3 Responsive Design
- Mobile-friendly sidebar (collapsible)
- Responsive tables
- Touch-friendly inputs

### 13.4 Testing
- Test authentication flow
- Test CRUD operations
- Test data calculations
- Test CSV import

### 13.5 Netlify Deployment
1. Connect GitHub repository
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Set environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Deploy

### 13.6 Final Checks
- [ ] All pages accessible
- [ ] Auth working correctly
- [ ] Data persisting to Supabase
- [ ] Charts rendering
- [ ] CSV import working
- [ ] Mobile responsive

### Deliverables Phase 13:
- [ ] Error boundary
- [ ] Toast notification system
- [ ] Loading skeletons
- [ ] Responsive design
- [ ] Netlify deployment
- [ ] Production environment variables
- [ ] Final testing complete

---

## Summary

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 1 | Project Setup | Vite, dependencies, folder structure |
| 2 | Database | Supabase tables, RLS, triggers |
| 3 | Authentication | Login, signup, protected routes |
| 4 | UI Components | Buttons, inputs, modals, layout |
| 5 | Websites | CRUD for income sources |
| 6 | Categories | Revenue/expense category management |
| 7 | Monthly Data | Data entry with calculations |
| 8 | Dashboard | KPIs, charts, analytics |
| 9 | Investments | Dividend tracking |
| 10 | Tools | Recurring cost tracking |
| 11 | Profile | User settings, avatar |
| 12 | CSV Import | Historical data migration |
| 13 | Deployment | Polish, testing, Netlify |

---

## Reference

**UI Mockups:** `Frontend Mockup/` folder
**Sample Data:** `2025 CSV Data/` folder
**Project Instructions:** `CLAUDE.md`
