# OfficeOps Calendar

A full-screen restaurant office operations board for orientations, truck orders, VIP replacements, interviews, catering, maintenance, and manager tasks.

## Features

- TV-friendly dark week view at `/display`, refreshed every 30 seconds
- Admin month/week calendar at `/admin`
- Type and status filters
- Reusable event editor with specialized Orientation, Truck Order, and VIP Replacement fields
- Supabase authentication, database storage, and Row Level Security
- Automatic GitHub Pages deployment

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the project URL and anon key:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Verify the production build:

   ```bash
   npm run build
   ```

The anon key is designed for browser use when Row Level Security is enabled. Never put a service role key in this app.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**, paste in [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. The SQL creates the `events` table, enables RLS, adds policies for authenticated users, and inserts three optional sample events.
4. In **Authentication > Providers**, enable Email authentication.
5. Create manager accounts from the app's sign-in screen, or create them in **Authentication > Users**.
6. For a TV, sign in once in its browser. The browser session remains available until it is signed out or cleared.

The included MVP policies allow every authenticated user to read, add, update, and delete events. Tighten these policies later if managers need different permission levels.

## GitHub Pages deployment

1. Create a GitHub repository named `officeops-calendar` and push this project to its `main` branch.
2. In the repository, open **Settings > Secrets and variables > Actions**:
   - Add repository variable `VITE_SUPABASE_URL`.
   - Add repository variable `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Open **Settings > Pages** and set **Source** to **GitHub Actions**.
4. Push to `main`. The workflow in `.github/workflows/deploy.yml` installs, builds, and deploys the app.
5. Open `https://YOUR_GITHUB_USERNAME.github.io/officeops-calendar/display`.

The Vite base path is set to `/officeops-calendar/`. If the repository name changes, update `base` in `vite.config.js`.

## TV display

Open the `/display` URL on the TV browser, sign in, and enter full-screen mode. The display defaults to week view, shows the current time, refreshes every 30 seconds, and includes operational summary counts along the bottom.

## Data model

Type-specific values are stored in `events.extra_data` as JSON. Common calendar fields such as date, status, manager, and notes remain top-level columns for easy filtering and reporting.
