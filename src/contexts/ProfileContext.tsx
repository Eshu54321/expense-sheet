import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { supabaseService } from '../services/supabaseService';

interface ProfileContextType {
    profiles: Profile[];
    activeProfile: Profile | null;
    setActiveProfileId: (id: string | null) => void;
    isLoading: boolean;
    reloadProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [activeProfileId, setLocalActiveProfileId] = useState<string | null>(localStorage.getItem('expense_active_profile'));
    const [isLoading, setIsLoading] = useState(true);

    const loadProfiles = async () => {
        setIsLoading(true);
        try {
            const data = await supabaseService.getProfiles();
            setProfiles(data);

            // Auto-select if none selected and we have profiles
            if (!activeProfileId && data.length > 0) {
                const defaultProfile = data.find((p: Profile) => p.isDefault) || data[0];
                setActiveProfileId(defaultProfile.id);
            } else if (activeProfileId && data.length > 0) {
                // Verify active profile still exists
                const exists = data.find((p: Profile) => p.id === activeProfileId);
                if (!exists) {
                    const defaultProfile = data.find((p: Profile) => p.isDefault) || data[0];
                    setActiveProfileId(defaultProfile.id);
                }
            }
        } catch (error) {
            console.error('Failed to load profiles:', error);
            // Fallback for UI without DB schema setup yet
            const fallbackProfile: Profile = { id: 'default', name: 'Personal', color: '#10B981', isDefault: true };
            setProfiles([fallbackProfile]);
            if (!activeProfileId) setActiveProfileId(fallbackProfile.id);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProfiles();
    }, []);

    const setActiveProfileId = (id: string | null) => {
        setLocalActiveProfileId(id);
        if (id) {
            localStorage.setItem('expense_active_profile', id);
        } else {
            localStorage.removeItem('expense_active_profile');
        }
    };

    const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

    return (
        <ProfileContext.Provider value={{
            profiles,
            activeProfile,
            setActiveProfileId,
            isLoading,
            reloadProfiles: loadProfiles
        }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
