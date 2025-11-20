# Daily Goal Tracker

A modern application to track your daily goals, habits, and tasks with photographic evidence. Built with React, Vite, and Supabase.

## Features

- **Dashboard**: Manage your daily tasks.
- **Evidence Tracking**: Upload photos to prove task completion.
- **Calendar**: View your history and consistency.
- **Statistics**: Analyze your performance over time.
- **Social**: Share your progress (optional).

## Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)

## Setup Instructions

### Prerequisites

- Node.js & npm
- A Supabase account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd daily-goal-tracker
npm install
```

### 2. Supabase Setup

1. Create a new project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** and run the migration script located in `supabase/migrations/20251120122807_305d0349-d478-4738-90a0-8060808429a4.sql`.
   - This will create the necessary tables (`profiles`, `tasks`, `task_completions`) and policies.
   - It also sets up the `task-evidence` storage bucket.

### 3. Environment Variables

Create a `.env` file in the root directory (copy from `.env.example` if available, or create new):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these keys in your Supabase Project Settings -> API.

### 4. Run Locally

```bash
npm run dev
```

## Deployment

### Vercel

1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in the Vercel project settings.
4. Deploy!

## License

MIT
