import React, { useEffect, useState } from 'react';
import { Search, ArrowUpRight, Clock, Tag, X, Trash2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { ItemRate, PriceHistory } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const ItemRates: React.FC = () => {
    const [rates, setRates] = useState<ItemRate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedItem, setSelectedItem] = useState<ItemRate | null>(null);
    const [history, setHistory] = useState<PriceHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        loadRates();
    }, []);

    const loadRates = async () => {
        try {
            const data = await supabaseService.getItemRates();
            setRates(data);
        } catch (err) {
            console.error("Failed to load rates", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleItemClick = async (item: ItemRate) => {
        setSelectedItem(item);
        setLoadingHistory(true);
        try {
            const data = await supabaseService.getPriceHistory(item.name);
            setHistory(data);
        } catch (err) {
            console.error("Failed to load history", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleDeleteItem = async (e: React.MouseEvent, item: ItemRate) => {
        e.stopPropagation(); // Prevent opening modal
        if (!window.confirm(`Are you sure you want to stop tracking "${item.name}"? This will delete its price history.`)) return;

        try {
            await supabaseService.deleteItemRate(item.name);
            setRates(prev => prev.filter(r => r.id !== item.id));
        } catch (err) {
            console.error("Failed to delete item", err);
            alert("Failed to delete item");
        }
    };

    const filteredRates = rates.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Item Rates</h2>
                    <p className="text-slate-500 text-sm">Tracked prices from your expenses</p>
                </div>
                <div className="relative flex items-center bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 w-full md:w-64 transition-shadow">
                    <div className="pl-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-2 pr-4 py-2 w-full text-sm border-none focus:outline-none focus:ring-0 bg-transparent rounded-r-lg"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : filteredRates.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-slate-600 font-medium">No rates tracked yet</h3>
                    <p className="text-slate-400 text-sm mt-1">
                        Add expenses with items like "Tomato 1kg" to see them here.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRates.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-slate-800 capitalize truncate" title={item.name}>
                                        {item.name}
                                    </h3>
                                    <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-medium border border-green-100 group-hover:bg-green-100 transition-colors">
                                        ₹{item.rate}/{item.unit || 'unit'}
                                    </span>
                                </div>

                                <div className="flex items-center text-xs text-slate-500 mt-4">
                                    <Clock className="w-3 h-3 mr-1" />
                                    <span>Updated {new Date(item.lastUpdated).toLocaleDateString()}</span>
                                </div>

                                <div className="mt-2 text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                                    <span className="flex items-center">
                                        View History <ArrowUpRight className="w-3 h-3 ml-1" />
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteItem(e, item)}
                                        className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                                        title="Stop tracking"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Price History Modal */}
                    {selectedItem && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{selectedItem.name}</h3>
                                        <p className="text-xs text-slate-500">Price History</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    {loadingHistory ? (
                                        <div className="h-[250px] flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        </div>
                                    ) : history.length === 0 ? (
                                        <div className="h-[250px] flex flex-col items-center justify-center text-slate-400">
                                            <Clock className="w-10 h-10 mb-2 opacity-50" />
                                            <p>No history data available yet.</p>
                                        </div>
                                    ) : (
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={history}>
                                                    <defs>
                                                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="date"
                                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                        tickFormatter={(str) => {
                                                            const d = new Date(str);
                                                            return `${d.getDate()}/${d.getMonth() + 1}`;
                                                        }}
                                                    />
                                                    <YAxis
                                                        domain={['auto', 'auto']}
                                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        formatter={(value: number) => [`₹${value}`, 'Rate']}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="rate"
                                                        stroke="#6366f1"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorRate)"
                                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
