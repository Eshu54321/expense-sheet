# Deploy to Vercel

Follow these steps to put your app on the internet.

## 1. Push to GitHub
If you haven't already, push your code to a GitHub repository.
1.  Initialize Git: `git init`
2.  Add files: `git add .`
3.  Commit: `git commit -m "Initial commit"`
4.  Create a new repo on GitHub.
5.  Link and push:
    ```bash
    git remote add origin <your-github-repo-url>
    git branch -M main
    git push -u origin main
    ```

## Option 1: Vercel CLI (Fastest)
Since you have the Vercel CLI installed, you can deploy directly:
1.  Run: `npx vercel`
2.  Follow the prompts (Login -> Yes to deploy -> Default settings).
3.  **Important**: You still need to add Environment Variables in the Vercel Dashboard after the first deploy fails (or configure them via CLI if you know how).

## Option 2: GitHub Integration (Recommended for Automation)
1.  Push to GitHub.
2.  Import in Vercel.


## 3. Configure Environment Variables (CRITICAL)
**Before clicking Deploy**, you must add your API keys.
1.  In the "Configure Project" screen, look for **"Environment Variables"**.
2.  Add the following keys (copy values from your `.env.local` file):

    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   `VITE_GEMINI_API_KEY`

3.  Click **"Add"** for each one.

## 4. Deploy
1.  Click **"Deploy"**.
2.  Wait for the build to finish (about 1 minute).
3.  Once done, you will get a live URL (e.g., `expensesheet.vercel.app`).

**Done!** You can now open this URL on your phone and laptop.
