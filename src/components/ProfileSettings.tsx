import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { Users, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

export const ProfileSettings: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('#4F46E5');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        setIsLoading(true);
        try {
            const data = await supabaseService.getProfiles();
            // If no profiles exist, maybe create a default one locally for the UI state
            if (data.length === 0) {
                setProfiles([{ id: 'default', name: 'Personal', color: '#10B981', isDefault: true }]);
            } else {
                setProfiles(data);
            }
        } catch (error) {
            console.error('Failed to load profiles:', error);
            // Fallback for local demo
            setProfiles([{ id: 'default', name: 'Personal', color: '#10B981', isDefault: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async (id: string | null) => {
        if (!editName.trim()) return;

        try {
            const profileData: Partial<Profile> = {
                name: editName,
                color: editColor
            };

            if (id && id !== 'new') {
                await supabaseService.updateProfile(id, profileData);
            } else {
                // Create new
                const newProfile = {
                    id: crypto.randomUUID(),
                    name: editName,
                    color: editColor,
                    isDefault: false
                };
                await supabaseService.createProfile(newProfile);
            }

            await loadProfiles();
            setIsEditing(null);
            setIsAdding(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile. Note: In this demo, changes might not persist if the database table is not set up.');

            // Local optimistic update for UI demo purposes
            if (id === 'new') {
                const newProfile = {
                    id: crypto.randomUUID(),
                    name: editName,
                    color: editColor,
                    isDefault: false
                };
                setProfiles([...profiles, newProfile]);
            } else if (id) {
                setProfiles(profiles.map(p => p.id === id ? { ...p, name: editName, color: editColor } : p));
            }
            setIsEditing(null);
            setIsAdding(false);
        }
    };

    const handleDeleteProfile = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this profile? This will not delete the expenses, but they will lose their association.')) return;

        try {
            await supabaseService.deleteProfile(id);
            await loadProfiles();
        } catch (error) {
            console.error('Error deleting profile:', error);
            // Local optimistic update for UI demo purposes
            setProfiles(profiles.filter(p => p.id !== id));
        }
    };

    const startEdit = (profile: Profile) => {
        setIsEditing(profile.id);
        setEditName(profile.name);
        setEditColor(profile.color || '#4F46E5');
    };

    const startAdd = () => {
        setIsAdding(true);
        setIsEditing('new');
        setEditName('');
        setEditColor('#4F46E5');
    };

    const colorOptions = [
        '#EF4444', // red
        '#F97316', // orange
        '#F59E0B', // amber
        '#10B981', // emerald
        '#06B6D4', // cyan
        '#3B82F6', // blue
        '#6366F1', // indigo
        '#8B5CF6', // purple
        '#EC4899', // pink
    ];

    if (isLoading) {
        return <div className="p-4 text-center text-slate-500 animate-pulse">Loading profiles...</div>;
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mt-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                        <Users className="w-5 h-5 mr-2 text-indigo-500" />
                        User Profiles
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage users to split tracking</p>
                </div>
                {!isAdding && !isEditing && (
                    <button
                        onClick={startAdd}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Profile</span>
                    </button>
                )}
            </div>

            <div className="p-6 space-y-4">
                {profiles.map(profile => (
                    <div key={profile.id} className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">

                        {isEditing === profile.id ? (
                            <div className="w-full space-y-3">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Profile Name"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    autoFocus
                                />
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Profile Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {colorOptions.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setEditColor(color)}
                                                className={`w-6 h-6 rounded-full ${editColor === color ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-slate-300 transform scale-110' : ''}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex space-x-2 pt-2">
                                    <button onClick={() => handleSaveProfile(profile.id)} className="flex-1 bg-indigo-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center">
                                        <Check className="w-4 h-4 mr-1" /> Save
                                    </button>
                                    <button onClick={() => { setIsEditing(null); setIsAdding(false); }} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center">
                                        <X className="w-4 h-4 mr-1" /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: profile.color || '#4F46E5' }}
                                    >
                                        {profile.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-800 dark:text-white flex items-center">
                                            {profile.name}
                                            {profile.isDefault && <span className="ml-2 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wide">Default</span>}
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => startEdit(profile)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                        aria-label="Edit Profile"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {!profile.isDefault && (
                                        <button
                                            onClick={() => handleDeleteProfile(profile.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            aria-label="Delete Profile"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {isAdding && isEditing === 'new' && (
                    <div className="flex items-center justify-between p-4 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/10">
                        <div className="w-full space-y-3">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="New Profile Name"
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                autoFocus
                            />
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Profile Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {colorOptions.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setEditColor(color)}
                                            className={`w-6 h-6 rounded-full ${editColor === color ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-slate-300 transform scale-110' : ''}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex space-x-2 pt-2">
                                <button onClick={() => handleSaveProfile('new')} className="flex-1 bg-indigo-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center">
                                    <Check className="w-4 h-4 mr-1" /> Create
                                </button>
                                <button onClick={() => { setIsEditing(null); setIsAdding(false); }} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center">
                                    <X className="w-4 h-4 mr-1" /> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
