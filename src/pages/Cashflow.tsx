import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { MonthSelector } from '../components/cashflow/MonthSelector'
import { CashflowSummary } from '../components/cashflow/CashflowSummary'
import { AccountList } from '../components/cashflow/AccountList'
import { AccountForm } from '../components/cashflow/AccountForm'
import { TransactionList } from '../components/cashflow/TransactionList'
import { TransactionForm } from '../components/cashflow/TransactionForm'
import { TransactionFilters } from '../components/cashflow/TransactionFilters'
import { BalanceForm } from '../components/cashflow/BalanceForm'
import { CashflowCategoryManager } from '../components/cashflow/CashflowCategoryManager'
import { BalanceCategoryManager } from '../components/cashflow/BalanceCategoryManager'
import { BalanceCategoryCards } from '../components/cashflow/BalanceCategoryCards'
import {
  usePersonalAccounts,
  usePersonalCategories,
  usePersonalTransactions,
  useCashflowStats,
  useCreatePersonalAccount,
  useUpdatePersonalAccount,
  useDeletePersonalAccount,
  useCreatePersonalTransaction,
  useUpdatePersonalTransaction,
  useDeletePersonalTransaction,
  useUpsertPersonalBalance,
  useBalanceCategories,
} from '../hooks/useCashflow'
import type {
  PersonalAccount,
  PersonalTransactionWithCategory,
  AccountSummary,
} from '../types'

export function Cashflow() {
  // Current month/year state
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)

  // Tab state
  const [activeTab, setActiveTab] = useState('all')

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('all')

  // Modal states
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<PersonalAccount | null>(null)
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<PersonalTransactionWithCategory | null>(null)
  const [balanceAccount, setBalanceAccount] = useState<AccountSummary | null>(null)
  const [balanceCategoryAccount, setBalanceCategoryAccount] = useState<PersonalAccount | null>(null)
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<PersonalAccount | null>(null)
  const [deleteConfirmTransaction, setDeleteConfirmTransaction] = useState<PersonalTransactionWithCategory | null>(null)

  // Data queries
  const { data: accounts = [], isLoading: accountsLoading } = usePersonalAccounts()
  const { data: categories = [] } = usePersonalCategories()
  const { data: balanceCategories = [] } = useBalanceCategories()
  const { data: transactions = [], isLoading: transactionsLoading } = usePersonalTransactions(
    year,
    month,
    activeTab !== 'all' && activeTab !== 'categories' ? activeTab : undefined
  )
  const {
    accounts: accountStats,
    totalBalance,
    totalIncome,
    totalExpense,
    netChange,
    isLoading: statsLoading,
  } = useCashflowStats(year, month)

  // Mutations
  const createAccountMutation = useCreatePersonalAccount()
  const updateAccountMutation = useUpdatePersonalAccount()
  const deleteAccountMutation = useDeletePersonalAccount()
  const createTransactionMutation = useCreatePersonalTransaction()
  const updateTransactionMutation = useUpdatePersonalTransaction()
  const deleteTransactionMutation = useDeletePersonalTransaction()
  const upsertBalanceMutation = useUpsertPersonalBalance()

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.note?.toLowerCase().includes(query) ||
          t.category?.name.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (filterCategoryId !== 'all') {
      result = result.filter((t) => t.category_id === filterCategoryId)
    }

    return result
  }, [transactions, searchQuery, filterCategoryId])

  // Handlers
  const handleAddAccount = () => {
    setEditingAccount(null)
    setIsAccountFormOpen(true)
  }

  const handleEditAccount = (account: AccountSummary) => {
    setEditingAccount(account)
    setIsAccountFormOpen(true)
  }

  const handleDeleteAccount = async () => {
    if (!deleteConfirmAccount) return
    try {
      await deleteAccountMutation.mutateAsync(deleteConfirmAccount.id)
      setDeleteConfirmAccount(null)
      if (activeTab === deleteConfirmAccount.id) {
        setActiveTab('all')
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  const handleAccountSubmit = async (data: { name: string; color?: string }) => {
    try {
      if (editingAccount) {
        await updateAccountMutation.mutateAsync({ id: editingAccount.id, data })
      } else {
        await createAccountMutation.mutateAsync(data)
      }
      setIsAccountFormOpen(false)
      setEditingAccount(null)
    } catch (error) {
      console.error('Failed to save account:', error)
    }
  }

  const handleSetBalance = (account: AccountSummary) => {
    setBalanceAccount(account)
  }

  const handleManageBalanceCategories = (account: AccountSummary) => {
    setBalanceCategoryAccount(account)
  }

  const handleBalanceSubmit = async (data: { beginning_balance: number }) => {
    if (!balanceAccount) return
    try {
      await upsertBalanceMutation.mutateAsync({
        account_id: balanceAccount.id,
        year,
        month,
        beginning_balance: data.beginning_balance,
      })
      setBalanceAccount(null)
    } catch (error) {
      console.error('Failed to save balance:', error)
    }
  }

  const handleAddTransaction = () => {
    setEditingTransaction(null)
    setIsTransactionFormOpen(true)
  }

  const handleEditTransaction = (transaction: PersonalTransactionWithCategory) => {
    setEditingTransaction(transaction)
    setIsTransactionFormOpen(true)
  }

  const handleDeleteTransaction = async () => {
    if (!deleteConfirmTransaction) return
    try {
      await deleteTransactionMutation.mutateAsync(deleteConfirmTransaction.id)
      setDeleteConfirmTransaction(null)
    } catch (error) {
      console.error('Failed to delete transaction:', error)
    }
  }

  const handleTransactionSubmit = async (data: {
    account_id: string
    category_id?: string
    balance_category_id?: string
    day: number
    amount: number
    note?: string
  }) => {
    try {
      if (editingTransaction) {
        await updateTransactionMutation.mutateAsync({
          id: editingTransaction.id,
          data,
        })
      } else {
        await createTransactionMutation.mutateAsync({ data, year, month })
      }
      setIsTransactionFormOpen(false)
      setEditingTransaction(null)
    } catch (error) {
      console.error('Failed to save transaction:', error)
    }
  }

  const handleSelectAccount = (accountId: string) => {
    setActiveTab(accountId)
  }

  // Get current account summary for single account view
  const currentAccountStats = activeTab !== 'all' && activeTab !== 'categories'
    ? accountStats.find(a => a.id === activeTab)
    : null

  return (
    <div>
      <Header
        title="Cashflow"
        action={
          <div className="flex items-center gap-3">
            <MonthSelector
              year={year}
              month={month}
              onYearChange={setYear}
              onMonthChange={setMonth}
            />
            <Button onClick={handleAddAccount}>
              <Plus className="w-4 h-4 mr-1" />
              Add Account
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <CashflowSummary
          totalBalance={currentAccountStats?.ending_balance ?? totalBalance}
          totalIncome={currentAccountStats?.total_income ?? totalIncome}
          totalExpense={currentAccountStats?.total_expense ?? totalExpense}
          netChange={currentAccountStats?.net_change ?? netChange}
          isLoading={statsLoading}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All Accounts</TabsTrigger>
            {accounts.map((account) => (
              <TabsTrigger key={account.id} value={account.id}>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: account.color }}
                  />
                  {account.name}
                </div>
              </TabsTrigger>
            ))}
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* All Accounts Tab */}
          <TabsContent value="all" className="space-y-6">
            {/* Account Cards */}
            <AccountList
              accounts={accountStats}
              onEdit={handleEditAccount}
              onDelete={(account) => setDeleteConfirmAccount(account)}
              onSetBalance={handleSetBalance}
              onManageBalanceCategories={handleManageBalanceCategories}
              onSelectAccount={handleSelectAccount}
              isLoading={accountsLoading || statsLoading}
            />

            {/* Transactions */}
            {accounts.length > 0 && (
              <>
                <TransactionFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedCategoryId={filterCategoryId}
                  onCategoryChange={setFilterCategoryId}
                  categories={categories}
                  onAddTransaction={handleAddTransaction}
                />

                <TransactionList
                  transactions={filteredTransactions}
                  accounts={accounts}
                  onEdit={handleEditTransaction}
                  onDelete={(t) => setDeleteConfirmTransaction(t)}
                  isLoading={transactionsLoading}
                  showAccountColumn={true}
                />
              </>
            )}
          </TabsContent>

          {/* Individual Account Tabs */}
          {accounts.map((account) => (
            <TabsContent key={account.id} value={account.id} className="space-y-6">
              {/* Balance Category Cards */}
              <BalanceCategoryCards accountId={account.id} />

              <TransactionFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategoryId={filterCategoryId}
                onCategoryChange={setFilterCategoryId}
                categories={categories}
                onAddTransaction={handleAddTransaction}
              />

              <TransactionList
                transactions={filteredTransactions}
                accounts={accounts}
                onEdit={handleEditTransaction}
                onDelete={(t) => setDeleteConfirmTransaction(t)}
                isLoading={transactionsLoading}
                showAccountColumn={false}
              />
            </TabsContent>
          ))}

          {/* Categories Tab */}
          <TabsContent value="categories">
            <CashflowCategoryManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Account Form Modal */}
      <AccountForm
        isOpen={isAccountFormOpen}
        onClose={() => {
          setIsAccountFormOpen(false)
          setEditingAccount(null)
        }}
        onSubmit={handleAccountSubmit}
        account={editingAccount}
        isLoading={createAccountMutation.isPending || updateAccountMutation.isPending}
      />

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={isTransactionFormOpen}
        onClose={() => {
          setIsTransactionFormOpen(false)
          setEditingTransaction(null)
        }}
        onSubmit={handleTransactionSubmit}
        transaction={editingTransaction}
        accounts={accounts}
        categories={categories}
        balanceCategories={balanceCategories}
        defaultAccountId={activeTab !== 'all' && activeTab !== 'categories' ? activeTab : undefined}
        currentMonth={month}
        isLoading={createTransactionMutation.isPending || updateTransactionMutation.isPending}
      />

      {/* Balance Form Modal */}
      <BalanceForm
        isOpen={!!balanceAccount}
        onClose={() => setBalanceAccount(null)}
        onSubmit={handleBalanceSubmit}
        account={balanceAccount}
        year={year}
        month={month}
        isLoading={upsertBalanceMutation.isPending}
      />

      {/* Balance Category Manager Modal */}
      {balanceCategoryAccount && (
        <BalanceCategoryManager
          isOpen={!!balanceCategoryAccount}
          onClose={() => setBalanceCategoryAccount(null)}
          account={balanceCategoryAccount}
        />
      )}

      {/* Delete Account Confirmation */}
      {deleteConfirmAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirmAccount(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Account</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteConfirmAccount.name}</strong>?
              All transactions and balances for this account will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirmAccount(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                loading={deleteAccountMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation */}
      {deleteConfirmTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirmTransaction(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Transaction</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this transaction?
              {deleteConfirmTransaction.note && (
                <span className="block mt-1 text-sm">
                  Note: "{deleteConfirmTransaction.note}"
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirmTransaction(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteTransaction}
                loading={deleteTransactionMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
