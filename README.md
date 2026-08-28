
  # Studio Narrator

  A text-to-speech app using Google Cloud Chirp 3 HD voices. Originally exported from Figma Make: https://www.figma.com/design/vnWT9PULMRYDVI3GzGtTdp/Text-to-Speech-Website.

  ## Architecture

  - **Frontend** (`src/`) — React + Vite SPA, deployed to Netlify.
  - **Backend** (`src/app/supabase/functions/server/index.tsx`) — a Supabase Edge Function that holds the Google Cloud service-account credentials and calls the Text-to-Speech API server-side, so no Google credentials ever reach the browser.

  ## Local development

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  Copy `.env.example` to `.env.local` if you want to point the frontend at a different Supabase project than the default.

  ## Deployment

  ### Backend (Supabase Edge Function)

  ```bash
  supabase functions deploy make-server-d7dc0ecc --project-ref kknhbddqipxbtffwyfbe
  supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='<service-account-json>' --project-ref kknhbddqipxbtffwyfbe
  supabase secrets set ALLOWED_ORIGINS='https://your-site.netlify.app' --project-ref kknhbddqipxbtffwyfbe
  supabase secrets set CLEANUP_SECRET='<random-string>' --project-ref kknhbddqipxbtffwyfbe
  ```

  Then set up a scheduled job (Supabase Dashboard → Database → Cron Jobs, or `pg_cron`) to periodically `POST` to `/make-server-d7dc0ecc/cleanup` with header `x-cleanup-secret: <same random string>`, to purge generated audio files older than 24h.

  ### Frontend (Netlify)

  This repo includes a `netlify.toml`. Connect the repo in Netlify, or deploy with the CLI:

  ```bash
  netlify deploy --prod
  ```

  Set `VITE_SUPABASE_PROJECT_ID` and `VITE_SUPABASE_ANON_KEY` as Netlify environment variables (see `.env.example`). After the first deploy, update `ALLOWED_ORIGINS` on the backend to match your Netlify domain and redeploy the edge function.
  