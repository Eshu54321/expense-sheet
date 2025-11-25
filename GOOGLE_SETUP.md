# Google Sheets API Setup Guide

To sync your expenses with Google Sheets, you need to set up a Google Cloud Project and get credentials.

## Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top and select **"New Project"**.
3. Name it `ExpenseSheet` (or anything you like) and click **Create**.
4. Select your new project.

## Step 2: Enable Google Sheets API
1. In the side menu, go to **APIs & Services > Library**.
2. Search for **"Google Sheets API"**.
3. Click on it and click **Enable**.
4. Go back to the Library, search for **"Google Drive API"** (needed for creating files), and **Enable** it too.

## Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (unless you have a Google Workspace organization) and click **Create**.
3. Fill in:
   - **App name**: ExpenseSheet
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **Save and Continue**.
5. **Scopes**: Click **Add or Remove Scopes**.
   - Search for and select:
     - `.../auth/spreadsheets` (See, edit, create, and delete your Google Sheets spreadsheets)
     - `.../auth/drive.file` (See, edit, create, and delete only the specific Google Drive files you use with this app)
   - Click **Update**, then **Save and Continue**.
6. **Test Users**: Click **Add Users** and add your own Google email address. (Crucial for testing!).
7. Click **Save and Continue**.

## Step 4: Create OAuth Credentials
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. **Application type**: Select **Web application**.
4. **Name**: `ExpenseSheet Web Client`.
5. **Authorized JavaScript origins**:
   - Add `http://localhost:5173` (or your local dev URL).
6. **Authorized redirect URIs**:
   - Add `http://localhost:5173`
7. Click **Create**.
8. Copy the **Client ID**. (You don't strictly need the Client Secret for this frontend-only flow, but keep it safe).

## Step 5: Create API Key (Optional but recommended)
1. On the Credentials page, click **Create Credentials** > **API key**.
2. Copy the **API Key**.
3. (Optional) Restrict the key to "Google Sheets API" for security.

## Step 6: Update Your App
Open `.env.local` in your project and add:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your_api_key_here
```

> **Note:** You might need to restart your development server (`npm run dev`) after changing `.env.local`.
