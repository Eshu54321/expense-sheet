import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Table, Lightbulb, Database, FileBarChart, RefreshCw, Settings as SettingsIcon, X } from 'lucide-react';
import { ExpenseTable } from './components/ExpenseTable';
import { SummaryCards } from './components/SummaryCards';
import { Charts } from './components/Charts';
import { SmartAdd } from './components/SmartAdd';
import { Reports } from './components/Reports';
import { RecurringExpenses } from './components/RecurringExpenses';
import { Settings } from './components/Settings';
import { generateSpendingInsights } from './services/geminiService';
import { dbService } from './services/db';
import { Expense, RecurringExpense } from './src/types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sheet' | 'reports' | 'recurring' | 'settings'>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [insight, setInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [dbStatus, setDbStatus] = useState<'Initializing' | 'Syncing' | 'Synced' | 'Error'>('Initializing');
  
  // Undo State
  const [lastAddedIds, setLastAddedIds] = useState<string[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimer, setUndoTimer] = useState<any>(null);

  // Initialize DB and Load Data
  useEffect(() => {
    const initData = async () => {
      try {
        await dbService.init();
        const loadedExpenses = await dbService.getAllExpenses();
        const loadedRecurring = await dbService.getAllRecurring();
        
        setExpenses(loadedExpenses);
        setRecurringExpenses(loadedRecurring);
        setDbStatus('Synced');
      } catch (error) {
        console.error("Failed to initialize database", error);
        setDbStatus('Error');
      }
    };
    initData();
  }, []);

  // Process Recurring Expenses Logic (Runs once data is loaded)
  useEffect(() => {
    if (recurringExpenses.length === 0 || dbStatus !== 'Synced') return;

    const processRecurring = async () => {
        const today = new Date();
        today.setHours(0,0,0,0);
        
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
                    await dbService.addExpenses(newTransactionBatch);
                    setExpenses(prev => [...newTransactionBatch, ...prev]);
                }
                
                // Save updated rules
                // We optimize by only saving changed rules in a real app, 
                // but for now we iterate to ensure sync.
                for (const rule of updatedRules) {
                    await dbService.updateRecurring(rule);
                }
                setRecurringExpenses(updatedRules);
                setDbStatus('Synced');
            } catch (error) {
                console.error("Error processing recurring expenses", error);
                setDbStatus('Error');
            }
        }
    };
    
    // Simple debounce/check to ensure we don't run this immediately on mount before data is ready
    // (Handled by the dbStatus check above)
    processRecurring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbStatus]); // Only run when DB becomes synced or potentially if we add a new recurring rule manually

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
        await dbService.addExpenses(newExpensesWithIds);
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
            await dbService.deleteExpense(id);
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
        await dbService.updateExpense(updatedExpense);
        setDbStatus('Synced');
    } catch (err) {
        console.error("Update failed", err);
        setDbStatus('Error');
        // Revert could go here
    }
  };

  const handleDeleteExpense = async (id: string) => {
    // Optimistic Update
    const previous = expenses;
    setExpenses(prev => prev.filter(e => e.id !== id));
    setDbStatus('Syncing');

    try {
        await dbService.deleteExpense(id);
        setDbStatus('Synced');
    } catch (err) {
        console.error("Delete failed", err);
        setDbStatus('Error');
        setExpenses(previous);
    }
  };

  // --- Recurring Handlers ---

  const handleAddRecurring = async (data: Omit<RecurringExpense, 'id'>) => {
      const newRule: RecurringExpense = { ...data, id: generateId() };
      setDbStatus('Syncing');
      try {
          await dbService.addRecurring(newRule);
          setRecurringExpenses(prev => [...prev, newRule]);
          setDbStatus('Synced');
      } catch (err) {
          setDbStatus('Error');
      }
  };
  
  const handleDeleteRecurring = async (id: string) => {
      setDbStatus('Syncing');
      try {
          await dbService.deleteRecurring(id);
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
          await dbService.updateRecurring(updatedRule);
          setDbStatus('Synced');
      } catch (err) {
          setDbStatus('Error');
      }
  };

  // --- Settings / Restore Handlers ---

  const handleRestoreData = async (newExpenses: Expense[], newRecurring: RecurringExpense[]) => {
      setDbStatus('Syncing');
      try {
          await dbService.clearAllData();
          await dbService.addExpenses(newExpenses);
          // Manually add recurring one by one or expand bulk helper (using loop for now)
          for (const rule of newRecurring) {
              await dbService.addRecurring(rule);
          }
          
          setExpenses(newExpenses);
          setRecurringExpenses(newRecurring);
          setDbStatus('Synced');
      } catch (err) {
          console.error("Restore failed", err);
          setDbStatus('Error');
      }
  };

  const handleResetData = async () => {
      setDbStatus('Syncing');
      try {
        await dbService.clearAllData();
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
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('sheet')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'sheet' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Table className="w-5 h-5" />
            <span className="font-medium">Transactions Sheet</span>
          </button>

          <button 
            onClick={() => setActiveTab('recurring')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'recurring' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <RefreshCw className="w-5 h-5" />
            <span className="font-medium">Recurring</span>
          </button>

          <button 
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'reports' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileBarChart className="w-5 h-5" />
            <span className="font-medium">Reports</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-green-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-4 space-y-4">
           {/* Database Status Indicator */}
           <div className="flex items-center space-x-2 text-xs text-slate-400 px-2">
              <Database className="w-3 h-3" />
              <span>Database: 
                <span className={`ml-1 ${
                    dbStatus === 'Synced' ? 'text-green-400' : 
                    dbStatus === 'Error' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                    {dbStatus}
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8 custom-scrollbar pb-24 md:pb-8">
        
        {/* Mobile Header */}
        <header className="flex justify-between items-center mb-6 md:mb-8">
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                    {activeTab === 'dashboard' ? 'Overview' : 
                     activeTab === 'reports' ? 'Monthly Reports' : 
                     activeTab === 'recurring' ? 'Recurring Rules' : 
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
                 JD
               </div>
            </div>
        </header>

        <div className="max-w-6xl mx-auto space-y-6">
            
            {(activeTab !== 'reports' && activeTab !== 'recurring' && activeTab !== 'settings') && <SmartAdd onAdd={handleAddExpenses} />}
            
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

            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <SummaryCards expenses={expenses} />
                    <Charts expenses={expenses} />
                    {/* Recent Transactions Preview */}
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
                            <button onClick={() => setActiveTab('sheet')} className="text-sm text-green-600 hover:text-green-700 font-medium">View Sheet</button>
                        </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-3 font-semibold whitespace-nowrap px-2">Date</th>
                                        <th className="pb-3 font-semibold whitespace-nowrap px-2">Description</th>
                                        <th className="pb-3 font-semibold text-right whitespace-nowrap px-2">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {expenses.slice(0, 5).map(e => (
                                        <tr key={e.id}>
                                            <td className="py-3 px-2 whitespace-nowrap">{e.date}</td>
                                            <td className="py-3 px-2 min-w-[150px]">{e.description}</td>
                                            <td className={`py-3 px-2 text-right font-medium whitespace-nowrap ${e.amount < 0 ? 'text-green-600' : ''}`}>
                                                ₹{Math.abs(e.amount).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'sheet' && (
                <ExpenseTable 
                  expenses={expenses} 
                  onDelete={handleDeleteExpense} 
                  onUpdate={handleUpdateExpense}
                />
            )}

            {activeTab === 'recurring' && (
                <RecurringExpenses 
                  recurringExpenses={recurringExpenses}
                  onAdd={handleAddRecurring}
                  onDelete={handleDeleteRecurring}
                  onToggleActive={handleToggleRecurring}
                />
            )}

            {activeTab === 'reports' && (
                <Reports expenses={expenses} />
            )}

            {activeTab === 'settings' && (
                <Settings 
                  expenses={expenses}
                  recurringExpenses={recurringExpenses}
                  onRestore={handleRestoreData}
                  onReset={handleResetData}
                />
            )}

        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-6 py-3 pb-6 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'dashboard' ? 'text-green-600' : 'text-slate-400'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-medium">Overview</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('sheet')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'sheet' ? 'text-green-600' : 'text-slate-400'}`}
          >
            <Table className="w-6 h-6" />
            <span className="text-[10px] font-medium">Sheet</span>
          </button>

          <button 
            onClick={() => setActiveTab('recurring')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'recurring' ? 'text-green-600' : 'text-slate-400'}`}
          >
            <RefreshCw className="w-6 h-6" />
            <span className="text-[10px] font-medium">Rules</span>
          </button>

          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center space-y-1 ${activeTab === 'reports' ? 'text-green-600' : 'text-slate-400'}`}
          >
            <FileBarChart className="w-6 h-6" />
            <span className="text-[10px] font-medium">Reports</span>
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
