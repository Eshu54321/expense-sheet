# Google Sheets Integration Walkthrough

We have successfully integrated Google Sheets as the primary data storage for ExpenseSheet. This allows your data to be backed up to your Google Drive and accessible from anywhere.

## Changes Implemented

1.  **Google Authentication**: Added `GoogleAuthButton` and `googleAuthService` to handle Sign-In with Google.
2.  **Google Sheets API**: Created `googleSheetsService` to read/write data directly to a "ExpenseSheet Data" spreadsheet in your Drive.
3.  **Hybrid Storage**: Updated `dbService` to use Google Sheets when signed in, and fallback to IndexedDB when offline or signed out.
4.  **Data Migration**: Added logic to sync your existing local data to Google Sheets upon first login.
5.  **Settings UI**: Added a new section in Settings to manage the connection and force sync.

## Setup Instructions (Critical)

Before the integration will work, you **MUST** configure your Google Cloud Project credentials.

1.  Open `GOOGLE_SETUP.md` in your project root.
2.  Follow the step-by-step guide to:
    *   Create a Google Cloud Project.
    *   Enable **Google Sheets API** and **Google Drive API**.
    *   Create an **OAuth 2.0 Client ID**.
    *   Get your **Client ID** and **API Key**.
3.  Create a `.env.local` file in your project root (if it doesn't exist) and add your credentials:
    ```env
    VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
    VITE_GOOGLE_API_KEY=your_api_key_here
    VITE_GEMINI_API_KEY=your_existing_gemini_key
    ```
4.  Restart your development server:
    ```bash
    npm run dev
    ```

## Verification Steps

### 1. Sign In
1.  Open the app.
2.  Click the **Sign in with Google** button in the sidebar or Settings.
3.  Complete the Google OAuth flow.
4.  **Verify**: You should see your profile picture and name in the sidebar. The "Storage" status should change to "Google Sheets".

### 2. Data Sync (First Time)
1.  After signing in, the app will automatically attempt to sync your existing local data to Google Sheets.
2.  **Verify**: Go to your Google Drive (drive.google.com). You should see a new spreadsheet named **"ExpenseSheet Data"**.
3.  Open the spreadsheet. You should see two tabs: "Expenses" and "Recurring", populated with your data.

### 3. Add Expense
1.  Add a new expense via the Dashboard or "Smart Add".
2.  **Verify**: The expense should appear in the app immediately.
3.  **Verify**: Check the Google Sheet. The new row should be added almost instantly.

### 4. Offline Mode (Optional)
1.  Disconnect your internet.
2.  Add an expense.
3.  **Verify**: The app should still work (saving to local cache).
4.  Reconnect internet.
5.  **Verify**: The data should eventually sync (or you can click "Force Sync" in Settings).

## Troubleshooting

*   **"ScriptError" or "Popup Closed"**: Ensure you added `http://localhost:5173` (or your port) to the **Authorized JavaScript origins** in Google Cloud Console.
*   **"403 Forbidden"**: Ensure you enabled the Google Sheets API and Google Drive API in the Cloud Console.
*   **Typescript Errors**: If you see errors about `gapi`, try restarting the VS Code server or running `npm install` again.
