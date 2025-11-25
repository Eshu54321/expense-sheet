import React, { useEffect, useState } from 'react';
import { googleAuthService } from '../services/googleAuthService';
import { GoogleAuthState } from '../types';
import { LogOut, Loader2 } from 'lucide-react';

export const GoogleAuthButton: React.FC = () => {
    const [authState, setAuthState] = useState<GoogleAuthState>(googleAuthService.getState());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = googleAuthService.subscribe(setAuthState);
        return () => unsubscribe();
    }, []);

    const handleSignIn = async () => {
        setIsLoading(true);
        try {
            await googleAuthService.signIn();
        } catch (error) {
            console.error("Sign in failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        setIsLoading(true);
        try {
            await googleAuthService.signOut();
        } catch (error) {
            console.error("Sign out failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!authState.isInitialized) {
        return (
            <div className="w-full py-2 px-3 bg-slate-800 rounded-lg flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
        );
    }

    if (authState.isSignedIn && authState.user) {
        return (
            <div className="w-full bg-slate-800 rounded-xl p-3 flex items-center justify-between group">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <img
                        src={authState.user.imageUrl}
                        alt={authState.user.name}
                        className="w-8 h-8 rounded-full border border-slate-600"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{authState.user.name}</p>
                        <p className="text-[10px] text-green-400 truncate">● Synced to Drive</p>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Sign Out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-900 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium text-sm"
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
            )}
            <span>Sign in with Google</span>
        </button>
    );
};
