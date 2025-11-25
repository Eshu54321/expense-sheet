/// <reference types="vite/client" />
import { gapi } from 'gapi-script';
import { GoogleUser, GoogleAuthState } from '../types';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

class GoogleAuthService {
    private authInstance: gapi.auth2.GoogleAuth | null = null;
    private listeners: ((state: GoogleAuthState) => void)[] = [];

    private state: GoogleAuthState = {
        isSignedIn: false,
        user: null,
        isInitialized: false,
        error: null
    };

    constructor() {
        if (!CLIENT_ID) {
            console.warn("Google Client ID not found in environment variables.");
            this.state.error = "Missing Google Client ID";
        }
    }

    async init(): Promise<void> {
        if (this.state.isInitialized) return;
        if (!CLIENT_ID) return;

        try {
            await new Promise<void>((resolve, reject) => {
                gapi.load('client:auth2', async () => {
                    try {
                        await gapi.client.init({
                            apiKey: API_KEY,
                            clientId: CLIENT_ID,
                            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"], // Simplified for debugging
                            scope: SCOPES,
                        });

                        this.authInstance = gapi.auth2.getAuthInstance();

                        // Listen for sign-in state changes
                        this.authInstance.isSignedIn.listen(this.handleAuthChange);

                        // Handle initial state
                        this.handleAuthChange(this.authInstance.isSignedIn.get());

                        this.state.isInitialized = true;
                        this.notifyListeners();
                        resolve();
                    } catch (error: any) {
                        console.error("Error initializing Google API client", error);
                        this.state.error = error.details || error.message || "Failed to initialize Google API";
                        this.notifyListeners();
                        reject(error);
                    }
                });
            });
        } catch (error) {
            console.error("GAPI Load Error", error);
        }
    }

    private handleAuthChange = (isSignedIn: boolean) => {
        if (isSignedIn && this.authInstance) {
            const user = this.authInstance.currentUser.get();
            const profile = user.getBasicProfile();

            this.state.isSignedIn = true;
            this.state.user = {
                id: profile.getId(),
                name: profile.getName(),
                email: profile.getEmail(),
                imageUrl: profile.getImageUrl(),
            };
        } else {
            this.state.isSignedIn = false;
            this.state.user = null;
        }
        this.notifyListeners();
    };

    async signIn(): Promise<void> {
        if (!this.authInstance) await this.init();
        try {
            await this.authInstance?.signIn();
        } catch (error) {
            console.error("Sign in error", error);
            throw error;
        }
    }

    async signOut(): Promise<void> {
        if (!this.authInstance) return;
        try {
            await this.authInstance.signOut();
        } catch (error) {
            console.error("Sign out error", error);
        }
    }

    getState(): GoogleAuthState {
        return { ...this.state };
    }

    subscribe(listener: (state: GoogleAuthState) => void): () => void {
        this.listeners.push(listener);
        listener(this.getState()); // Initial call

        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        const currentState = this.getState();
        this.listeners.forEach(listener => listener(currentState));
    }

    getToken(): string | null {
        return this.authInstance?.currentUser.get().getAuthResponse().access_token || null;
    }
}

export const googleAuthService = new GoogleAuthService();
