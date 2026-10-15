# Testing Guide: Project Management Components

## Prerequisites

Before you can test the project management components, you need to:

### 1. Run the Database Migration

**Option A: Using Supabase Dashboard (Easiest)**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Create a new query
5. Open `supabase/migrations/20251007008_enhance_projects_for_collaboration.sql`
6. Copy all the SQL and paste it into the editor
7. Click **Run**

**Option B: Using Supabase CLI**
```bash
supabase db push
```

See `supabase/RUN_MIGRATION.md` for detailed instructions.

### 2. Start the Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## How to Test the Components

### Step 1: Login

1. Go to http://localhost:3000
2. Click "Login" or go to http://localhost:3000/auth/login
3. Login with your existing account or create a new one

### Step 2: Access the Dashboard

After login, you'll be redirected to http://localhost:3000/dashboard

You should see:
- **Header** with your name and logout button
- **ProjectDashboard** component showing your projects

### What You'll See

#### If you have NO projects yet:

You'll see an **empty state** with:
- A large folder icon
- Message: "No projects yet"
- Description about getting started
- "Create Your First Project" button

**Try clicking the button** - you'll see a toast notification saying "Create project form coming in Task 6!"

#### If you HAVE projects:

You'll see:
- **Search bar** - Type to search projects by name or description
- **Phase filter dropdown** - Filter by design phase
- **View toggle buttons** - Switch between Grid and List views

**Grid View:**
- Cards showing each project with:
  - Project name and description
  - Phase progress tracker (4 phases)
  - Start date and member count
  - Current phase badge
  - Action menu (⋮) with View/Edit/Delete options

**List View:**
- Sortable table with columns:
  - Project Name (click header to sort)
  - Current Phase (click to sort)
  - Progress (completed phases / total)
  - Start Date (click to sort)
  - Last Updated (click to sort)
  - Actions menu

### Step 3: Create Test Data (Optional)

If you want to see projects displayed, you can create some test data via the API:

**Option 1: Using the browser console**

Open DevTools (F12) and run:

```javascript
fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My First HCI Project',
    description: 'Testing the project management system',
    start_date: '2025-10-08',
    current_phase: 'understand_context',
    phase_status: {
      understand_context: 'in_progress',
      specify_requirements: 'not_started',
      produce_design_solutions: 'not_started',
      evaluate_against_requirements: 'not_started'
    }
  })
}).then(r => r.json()).then(console.log)
```

**Option 2: Using Supabase Dashboard**

1. Go to Supabase Dashboard → Table Editor
2. Select `projects` table
3. Click "Insert row"
4. Fill in the fields:
   - `name`: "My Test Project"
   - `description`: "A sample project"
   - `start_date`: "2025-10-08"
   - `current_phase`: "understand_context"
   - `phase_status`:
   ```json
   {
     "understand_context": "in_progress",
     "specify_requirements": "not_started",
     "produce_design_solutions": "not_started",
     "evaluate_against_requirements": "not_started"
   }
   ```
   - `user_id`: (your user ID - get it from the `profiles` table)

## What to Test

### ✅ Layout & Responsiveness
- [ ] Resize browser window - components should adapt to screen size
- [ ] Test on mobile view (< 768px)
- [ ] Test on tablet view (768px - 1024px)
- [ ] Test on desktop view (> 1024px)

### ✅ Search Functionality
- [ ] Type in search box - projects filter in real-time
- [ ] Search by project name
- [ ] Search by description
- [ ] Clear search - all projects return

### ✅ Phase Filtering
- [ ] Select different phases from dropdown
- [ ] Verify only matching projects show
- [ ] Select "All Phases" - all projects return

### ✅ View Modes
- [ ] Click Grid view button - see card layout
- [ ] Click List view button - see table layout
- [ ] Switch between views multiple times

### ✅ Grid View (Cards)
- [ ] Hover over cards - should show shadow effect
- [ ] Click action menu (⋮) - dropdown appears
- [ ] See phase progress visualization
- [ ] See project metadata (date, members)

### ✅ List View (Table)
- [ ] Click column headers - table sorts
- [ ] Click again - sort direction reverses
- [ ] See sort indicator (arrow icon)
- [ ] Scroll horizontally on mobile if needed

### ✅ Phase Tracker
- [ ] See 4 phase indicators in compact mode (on cards)
- [ ] Icons change based on status:
  - ⭕ Circle = Not Started (gray)
  - 🔄 Spinning loader = In Progress (blue)
  - ✅ Check = Completed (green)
  - ❌ X = Blocked (red)

### ✅ Loading States
- [ ] Refresh page - see skeleton loaders
- [ ] Skeleton appears before data loads
- [ ] Content replaces skeletons smoothly

### ✅ Empty States
- [ ] No projects - see empty state message
- [ ] Search with no results - see "No projects match your filters"
- [ ] Different messages for different scenarios

### ✅ Toast Notifications
- [ ] Click "Create Project" - see toast message
- [ ] Click "Edit" in action menu - see toast
- [ ] Click "Delete" - see toast
- [ ] Click "View Details" - see toast

## Known Limitations (Task 6 will add these)

- ❌ Can't create projects yet (form coming in Task 6)
- ❌ Can't edit projects (form coming in Task 6)
- ❌ Can't delete projects (confirmation dialog coming in Task 6)
- ❌ Can't add team members (member selector coming in Task 6)
- ❌ Can't update phase status (update UI coming in Task 6)

## Troubleshooting

### "No projects" but you created some
- Check that `user_id` matches your logged-in user
- Verify RLS policies are set up correctly
- Check browser console for errors

### Components don't load
- Check that migration ran successfully
- Verify all dependencies installed: `npm install`
- Check console for import errors

### Styling looks broken
- Clear browser cache
- Restart dev server
- Check Tailwind CSS is compiling

### API errors
- Check `.env.local` has correct Supabase credentials
- Verify you're logged in (check cookies)
- Look at Network tab in DevTools for API responses

## Next Steps

After testing these components, Task 6 will add:
- ProjectForm component for creating/editing projects
- MemberSelector for team collaboration
- Phase update UI with dialogs
- Delete confirmation modals
- Full CRUD functionality
