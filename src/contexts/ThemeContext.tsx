import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'green' | 'indigo' | 'rose' | 'amber' | 'cyan';

interface ThemeContextType {
    mode: ThemeMode;
    accent: AccentColor;
    setMode: (mode: ThemeMode) => void;
    setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>(() => {
        const savedMode = localStorage.getItem('theme-mode');
        return (savedMode as ThemeMode) || 'system';
    });

    const [accent, setAccent] = useState<AccentColor>(() => {
        const savedAccent = localStorage.getItem('theme-accent');
        return (savedAccent as AccentColor) || 'green';
    });

    useEffect(() => {
        localStorage.setItem('theme-mode', mode);

        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (mode === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(mode);
        }
    }, [mode]);

    useEffect(() => {
        localStorage.setItem('theme-accent', accent);
        // We will handle accent classes in individual components or tailwind config by watching this provider.
        // For Tailwind v4 without arbitrary values, we can conditionally apply specific color classes.
        window.document.documentElement.setAttribute('data-theme-accent', accent);
    }, [accent]);

    return (
        <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
