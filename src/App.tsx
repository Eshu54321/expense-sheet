import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Table, Lightbulb, Database, FileBarChart, RefreshCw, Settings as SettingsIcon, X, LogOut, Users, Tag, ChevronDown } from 'lucide-react';
import { SummaryCards } from './components/SummaryCards';
import { ItemRates } from './components/ItemRates';
import { SmartAdd } from './components/SmartAdd';
import { Charts } from './components/Charts';
import { ExpenseTable } from './components/ExpenseTable';
import { Budgets } from './components/Budgets';
import { RecurringExpenses } from './components/RecurringExpenses';
import { Settings } from './components/Settings';
import { Lenders } from './features/Lenders';
import { Assets } from './features/Assets';
import { Auth } from './components/Auth';
import { useAuth } from './hooks/useAuth';
import { supabaseService } from './services/supabaseService';
import { useProfile } from './contexts/ProfileContext';
import { supabase } from './lib/supabase';
import { generateSpendingInsights } from './services/geminiService';

// --- Types ---
import { Expense, RecurringExpense, Budget, Category, Frequency } from './types';

const generateId = () => crypto.randomUUID();

// ... (Keep existing processRecurringExpenses function) ...
const processRecurringExpenses = (expenses: Expense[], recurring: RecurringExpense[]): Expense[] => {
  const newExpenses: Expense[] = [];
  const today = new Date();

  recurring.forEach(rule => {
    if (!rule.active) return;

    let nextDate = new Date(rule.nextDueDate);
    while (nextDate <= today) {
      newExpenses.push({
        id: crypto.randomUUID(),
        date: nextDate.toISOString().split('T')[0],
        description: rule.description,
        amount: rule.amount,
        category: rule.category,
        paymentMethod: 'Auto-deduct',
        profileId: rule.profileId || undefined
      });

      switch (rule.frequency) {
        case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }
    }
    rule.nextDueDate = nextDate.toISOString().split('T')[0];
  });

  return newExpenses;
};

type TabState = 'expenses' | 'recurring' | 'lenders' | 'budgets' | 'assets' | 'analytics' | 'settings';

function App() {
  const { user, loading: authLoading } = useAuth();

  // Data State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [insight, setInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [dbStatus, setDbStatus] = useState<'Initializing' | 'Syncing' | 'Synced' | 'Error'>('Initializing');
  const { activeProfile, profiles, setActiveProfileId } = useProfile();

  // Selected Tab State
  const [activeTab, setActiveTab] = useState<TabState>('expenses');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter expenses by active profile
  const filteredExpenses = useMemo(() => {
    if (!activeProfile) return expenses;
    return expenses.filter(e => !e.profileId || e.profileId === activeProfile.id || e.profileId === 'shared');
  }, [expenses, activeProfile]);

  const filteredBudgets = useMemo(() => {
    if (!activeProfile) return budgets;
    return budgets.filter(b => !b.profileId || b.profileId === activeProfile.id || b.profileId === 'shared');
  }, [budgets, activeProfile]);

  const filteredRecurring = useMemo(() => {
    if (!activeProfile) return recurringExpenses;
    return recurringExpenses.filter(r => !r.profileId || r.profileId === activeProfile.id || r.profileId === 'shared');
  }, [recurringExpenses, activeProfile]);

  // Use the filtered versions for standard operations unless it's settings
  const displayExpenses = activeProfile ? filteredExpenses : expenses;
  const displayBudgets = activeProfile ? filteredBudgets : budgets;
  const displayRecurring = activeProfile ? filteredRecurring : recurringExpenses;

  // --- Data Loading ---
  const loadData = async () => {
    try {
      setDbStatus('Syncing');
      const loadedExpenses = await supabaseService.getExpenses();
      const loadedRecurring = await supabaseService.getRecurringExpenses();
      const loadedBudgets = await supabaseService.getBudgets();

      setExpenses(loadedExpenses);
      setRecurringExpenses(loadedRecurring);
      setBudgets(loadedBudgets);
      setDbStatus('Synced');
    } catch (error) {
      console.error("Failed to load data", error);
      setDbStatus('Error');
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Undo State
  const [lastAddedIds, setLastAddedIds] = useState<string[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimer, setUndoTimer] = useState<any>(null);



  // Process Recurring Expenses Logic (Runs once data is loaded)
  useEffect(() => {
    if (recurringExpenses.length === 0 || dbStatus !== 'Synced' || !user) return;

    const processRecurring = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let hasChanges = false;
      const newTransactionBatch: Expense[] = [];
      const updatedRules: RecurringExpense[] = [];

      // Check each rule
      for (const rule of recurringExpenses) {
        if (!rule.active) {
          updatedRules.push(rule);
          continue;
        }

        let nextDate = new Date(rule.nextDueDate);
        let ruleModified = false;
        let ruleCopy = { ...rule };

        // Process all missed occurrences up to today
        let iterations = 0;
        while (nextDate <= today && iterations < 365) {
          const transactionDate = nextDate.toISOString().split('T')[0];

          newTransactionBatch.push({
            id: generateId(),
            date: transactionDate,
            description: rule.description,
            category: rule.category,
            amount: rule.amount,
            paymentMethod: 'Recurring'
          });

          if (rule.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
          else if (rule.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
          else if (rule.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
          else if (rule.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

          ruleCopy.nextDueDate = nextDate.toISOString().split('T')[0];
          ruleModified = true;
          hasChanges = true;
          iterations++;
        }
        updatedRules.push(ruleModified ? ruleCopy : rule);
      }

      if (hasChanges) {
        setDbStatus('Syncing');
        try {
          // Save generated expenses
          if (newTransactionBatch.length > 0) {
            await supabaseService.addExpenses(newTransactionBatch);
            setExpenses(prev => [...newTransactionBatch, ...prev]);
          }

          // Save updated rules
          for (const rule of updatedRules) {
            await supabaseService.updateRecurringExpense(rule);
          }
          setRecurringExpenses(updatedRules);
          setDbStatus('Synced');
        } catch (error) {
          console.error("Error processing recurring expenses", error);
          setDbStatus('Error');
        }
      }
    };

    processRecurring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbStatus, user]);

  // --- CRUD Handlers ---

  const handleAddExpenses = async (newExpensesData: Omit<Expense, 'id'>[]) => {
    setDbStatus('Syncing');
    const newIds: string[] = [];
    const newExpensesWithIds = newExpensesData.map(e => {
      const id = generateId();
      newIds.push(id);
      return { ...e, id };
    });

    try {
      await supabaseService.addExpenses(newExpensesWithIds);
      setExpenses(prev => [...newExpensesWithIds, ...prev]);
      setDbStatus('Synced');

      // Setup Undo
      setLastAddedIds(newIds);
      setShowUndo(true);
      if (undoTimer) clearTimeout(undoTimer);
      const timer = setTimeout(() => setShowUndo(false), 6000);
      setUndoTimer(timer);
    } catch (err) {
      console.error("Add failed", err);
      setDbStatus('Error');
    }
  };

  const handleUndoLastAdd = async () => {
    setDbStatus('Syncing');
    try {
      // Delete from DB
      for (const id of lastAddedIds) {
        await supabaseService.deleteExpense(id);
      }
      // Update State
      setExpenses(prev => prev.filter(e => !lastAddedIds.includes(e.id)));
      setDbStatus('Synced');
    } catch (err) {
      console.error("Undo failed", err);
      setDbStatus('Error');
    }
    setShowUndo(false);
    setLastAddedIds([]);
    if (undoTimer) clearTimeout(undoTimer);
  };

  const handleUpdateExpense = async (updatedExpense: Expense) => {
    // Optimistic Update
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    setDbStatus('Syncing');

    try {
      await supabaseService.updateExpense(updatedExpense);
      setDbStatus('Synced');
    } catch (err) {
      console.error("Update failed", err);
      setDbStatus('Error');
      // Revert could go here
    }
  };

  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      const newExpense: Expense = {
        ...expense,
        id: crypto.randomUUID(),
        profileId: activeProfile?.id
      };

      await supabaseService.addExpense(newExpense);
      setExpenses(prev => [...prev, newExpense]);
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to save expense to cloud. Please try again.');
    }
  };

  const handleAddRecurring = async (expense: Omit<RecurringExpense, 'id'>) => {
    try {
      const newRecurring: RecurringExpense = {
        ...expense,
        id: crypto.randomUUID(),
        profileId: activeProfile?.id
      };

      await supabaseService.addRecurringExpense(newRecurring);
      setRecurringExpenses(prev => [...prev, newRecurring]);
    } catch (error) {
      console.error('Failed to add recurring expense:', error);
      alert('Failed to save recurring expense to cloud. Please try again.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    // Optimistic Update
    const previous = expenses;
    setExpenses(prev => prev.filter(e => e.id !== id));
    setDbStatus('Syncing');

    try {
      await supabaseService.deleteExpense(id);
      setDbStatus('Synced');
    } catch (err) {
      console.error("Delete failed", err);
      setDbStatus('Error');
      setExpenses(previous);
    }
  };

  // --- Recurring Handlers ---

  const handleDeleteRecurring = async (id: string) => {
    setDbStatus('Syncing');
    try {
      await supabaseService.deleteRecurringExpense(id);
      setRecurringExpenses(prev => prev.filter(r => r.id !== id));
      setDbStatus('Synced');
    } catch (err) {
      setDbStatus('Error');
    }
  };

  const handleToggleRecurring = async (id: string) => {
    const rule = recurringExpenses.find(r => r.id === id);
    if (!rule) return;
    const updatedRule = { ...rule, active: !rule.active };

    setRecurringExpenses(prev => prev.map(r => r.id === id ? updatedRule : r));
    setDbStatus('Syncing');
    try {
      await supabaseService.updateRecurringExpense(updatedRule);
      setDbStatus('Synced');
    } catch (err) {
      setDbStatus('Error');
    }
  };

  // --- Budget Handlers ---

  const handleSaveBudget = async (budget: Budget) => {
    setDbStatus('Syncing');
    try {
      await supabaseService.upsertBudget(budget);
      // Refresh budgets to get the latest state (or optimistic update)
      const updatedBudgets = await supabaseService.getBudgets();
      setBudgets(updatedBudgets);
      setDbStatus('Synced');
    } catch (err) {
      console.error("Budget save failed", err);
      setDbStatus('Error');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    setDbStatus('Syncing');
    try {
      await supabaseService.deleteBudget(id);
      setBudgets(prev => prev.filter(b => b.id !== id));
      setDbStatus('Synced');
    } catch (err) {
      console.error("Budget delete failed", err);
      setDbStatus('Error');
    }
  };

  // --- Settings / Restore Handlers ---

  const handleRestoreData = async (newExpenses: Expense[], newRecurring: RecurringExpense[]) => {
    setDbStatus('Syncing');
    try {
      // Note: Clear all not implemented in Supabase service to prevent accidental mass deletion
      // For now, we just append restored data
      await supabaseService.addExpenses(newExpenses);

      for (const rule of newRecurring) {
        await supabaseService.addRecurringExpense(rule);
      }

      // Refresh data
      const loadedExpenses = await supabaseService.getExpenses();
      const loadedRecurring = await supabaseService.getRecurringExpenses();
      setExpenses(loadedExpenses);
      setRecurringExpenses(loadedRecurring);

      setDbStatus('Synced');
    } catch (err) {
      console.error("Restore failed", err);
      setDbStatus('Error');
    }
  };

  const handleResetData = async () => {
    if (!window.confirm("This will delete ALL data from the cloud. Are you sure?")) return;

    setDbStatus('Syncing');
    try {
      // Manual delete all (inefficient but safe for now)
      for (const e of expenses) await supabaseService.deleteExpense(e.id);
      for (const r of recurringExpenses) await supabaseService.deleteRecurringExpense(r.id);

      setExpenses([]);
      setRecurringExpenses([]);
      setDbStatus('Synced');
    } catch (err) {
      setDbStatus('Error');
    }
  };

  const handleGenerateInsight = async () => {
    setIsLoadingInsight(true);
    const text = await generateSpendingInsights(expenses);
    setInsight(text);
    setIsLoadingInsight(false);
  };

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans relative">

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col flex-shrink-0 h-screen sticky top-0">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-700/50">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Table className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ExpenseSheet</h1>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {/* ... existing nav buttons ... */}
          <button
            onClick={() => setActiveTab('expenses')}
            className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - lg transition - colors ${activeTab === 'expenses' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} `}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Expenses</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - lg transition - colors ${activeTab === 'assets' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} `}
          >
            <Table className="w-5 h-5" />
            <span className="font-medium">Assets</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - lg transition - colors ${activeTab === 'analytics' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} `}
          >
            <FileBarChart className="w-5 h-5" />
            <span className="font-medium">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('recurring')}
            className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - lg transition - colors ${activeTab === 'recurring' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} `}
          >
            <RefreshCw className="w-5 h-5" />
            <span className="font-medium">Recurring</span>
          </button>

          <button
            onClick={() => setActiveTab('lenders')}
            className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - lg transition - colors ${activeTab === 'lenders' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} `}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Lenders</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - lg transition - colors ${activeTab === 'settings' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} `}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-4 space-y-4">
          {/* Database Status Indicator */}
          <div className="flex items-center space-x-2 text-xs text-slate-400 px-2">
            <Database className="w-3 h-3" />
            <span>Storage:
              <span className="ml-1 text-blue-400">
                Supabase Cloud
              </span>
            </span>
          </div>

          <div className="bg-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center">
              <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
              AI Insight
            </h4>
            <div className="min-h-[60px] text-xs text-slate-400 leading-relaxed mb-3">
              {insight || "Click below to analyze your spending patterns..."}
            </div>
            <button
              onClick={handleGenerateInsight}
              disabled={isLoadingInsight}
              className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium text-white transition-colors"
            >
              {isLoadingInsight ? 'Analyzing...' : 'Generate Analysis'}
            </button>
          </div>

          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center space-x-2 text-xs text-slate-500 hover:text-white transition-colors px-2"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8 custom-scrollbar pb-24 md:pb-8">

        {/* Mobile Header */}
        <header className="flex justify-between items-center mb-6 md:mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">
              {activeTab === 'expenses' ? 'Overview' :
                activeTab === 'recurring' ? 'Recurring Rules' :
                  activeTab === 'lenders' ? 'Lenders & Loans' :
                    activeTab === 'budgets' ? 'Budgeting' :
                      activeTab === 'analytics' ? 'Analytics' :
                        activeTab === 'assets' ? 'Tracked Assets' :
                          activeTab === 'settings' ? 'Settings' : 'Expenses'}
            </h2>
            <p className="text-slate-500 text-xs md:text-sm">Personal Finance Sheet • INR (₹)</p>
          </div>
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Mobile only AI trigger */}
            <button
              onClick={handleGenerateInsight}
              className="md:hidden p-2 bg-slate-100 rounded-full text-slate-600"
              aria-label="Get AI Insights"
            >
              <Lightbulb className="w-5 h-5 text-yellow-500" />
            </button>

            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs border border-green-200">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto space-y-6">

          {(activeTab !== 'recurring' && activeTab !== 'lenders' && activeTab !== 'settings') && <SmartAdd onAdd={handleAddExpenses} />}

          {/* Mobile Insight Card */}
          {insight && (
            <div className="md:hidden bg-slate-800 rounded-xl p-4 mb-4 text-white">
              <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
                AI Insight
              </h4>
              <p className="text-xs text-slate-300">{insight}</p>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <SummaryCards expenses={displayExpenses} budgets={displayBudgets} />
              <Charts expenses={displayExpenses} />

              {/* Full Interactive Expense Table */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">All Transactions</h3>
                </div>
                <ExpenseTable
                  expenses={displayExpenses}
                  onDelete={handleDeleteExpense}
                  onUpdate={handleUpdateExpense}
                />
              </div>
            </div>
          )}

          {activeTab === 'recurring' && (
            <RecurringExpenses
              recurringExpenses={recurringExpenses}
              onAdd={handleAddRecurring}
              onDelete={handleDeleteRecurring}
              onToggleActive={handleToggleRecurring}
            />
          )}

          {activeTab === 'lenders' && (
            <Lenders />
          )}

          {activeTab === 'budgets' && (
            <Budgets />
          )}

          {activeTab === 'assets' && (
            <Assets />
          )}

          {activeTab === 'analytics' && (
            <ItemRates />
          )}

          {activeTab === 'settings' && (
            <Settings
              expenses={expenses}
              recurringExpenses={recurringExpenses}
              budgets={budgets}
              onRestore={handleRestoreData}
              onReset={handleResetData}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
            />
          )}

        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-6 py-3 pb-6 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'expenses' ? 'text-green-600' : 'text-slate-400'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-medium">Expenses</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'assets' ? 'text-green-600' : 'text-slate-400'}`}
          >
            <Table className="w-6 h-6" />
            <span className="text-[10px] font-medium">Assets</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'analytics' ? 'text-green-600' : 'text-slate-400'}`}
          >
            <Tag className="w-6 h-6" />
            <span className="text-[10px] font-medium">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('recurring')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'recurring' ? 'text-green-600' : 'text-slate-400'}`}
          >
            <RefreshCw className="w-6 h-6" />
            <span className="text-[10px] font-medium">Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('lenders')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'lenders' ? 'text-green-600' : 'text-slate-400'}`}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-medium">Lenders</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'settings' ? 'text-green-600' : 'text-slate-400'}`}
          >
            <SettingsIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>

      {/* Undo Toast */}
      {showUndo && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-2 fade-in border border-slate-700">
          <span className="text-sm font-medium">
            Added {lastAddedIds.length} transaction{lastAddedIds.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleUndoLastAdd}
            className="text-sm font-bold text-green-400 hover:text-green-300 transition-colors"
          >
            Undo
          </button>
          <button
            onClick={() => setShowUndo(false)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};

export default App;
