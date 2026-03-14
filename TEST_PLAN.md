# Application Test Plan - Pinnacle SSA

## Test Environment
- **URL**: http://localhost:3000
- **Date**: 2025-12-18
- **Server Status**: Running (Process ID: 2060)

## Test Scenarios

### 1. Homepage Load Test
- [ ] Navigate to http://localhost:3000
- [ ] Verify homepage loads without errors
- [ ] Check navigation menu is visible
- [ ] Verify all navigation links work
- [ ] Check console for errors

### 2. Musician Signup Flow
- [ ] Navigate to `/musicians/signup`
- [ ] Fill in signup form:
  - Full Name
  - Email (unique)
  - Password
  - Role (e.g., Vocalist, Engineer)
  - Bio
  - Hourly Rate
  - Session Rate
  - Select at least one skill
- [ ] Submit form
- [ ] Verify redirect to dashboard
- [ ] Check profile is created in database

### 3. Musician Login Flow
- [ ] Navigate to `/musicians/signin`
- [ ] Enter credentials from signup
- [ ] Submit login
- [ ] Verify redirect to `/musician/dashboard`
- [ ] Check dashboard loads correctly
- [ ] Verify profile data displays

### 4. Admin Approval Flow
- [ ] Navigate to `/admin`
- [ ] Login with admin credentials
- [ ] Navigate to Musicians tab
- [ ] Find newly created musician
- [ ] Verify musician shows as "Pending"
- [ ] Click "Approve" button
- [ ] Verify status changes to "Verified"
- [ ] Verify musician can now access full features

### 5. Collaboration Request Flow
- [ ] As approved musician, navigate to dashboard
- [ ] Go to "Collab Zone" tab
- [ ] Click "Request Collaboration"
- [ ] Search for another musician
- [ ] Send collaboration request
- [ ] Verify request appears in receiver's dashboard

### 6. Collaboration Project Creation
- [ ] As approved musician, go to Collab Zone
- [ ] Click "Create New Project"
- [ ] Fill in project details:
  - Project Name
  - Description
  - Genre (optional)
  - Deadline (optional)
- [ ] Submit project
- [ ] Verify project appears in project list
- [ ] Verify color coding (newest = gold, teal, coral, sky)

### 7. Chat Functionality
- [ ] Select a collaboration project
- [ ] Navigate to Live Chat section
- [ ] Send a test message
- [ ] Verify message appears in chat
- [ ] Test link detection (send a URL)
- [ ] Verify link is clickable
- [ ] Test real-time updates

### 8. File Upload
- [ ] Select a project
- [ ] Go to Files tab
- [ ] Upload an audio file
- [ ] Verify file appears in list
- [ ] Test audio playback (if audio file)
- [ ] Verify file metadata displays

### 9. Add Collaborator
- [ ] As project owner, go to Team tab
- [ ] Test search functionality:
  - Search by name
  - Search by email
- [ ] Select a musician from search results
- [ ] Verify collaborator is added
- [ ] Test direct email input method
- [ ] Verify collaborator appears in team list

### 10. Admin Dashboard Statistics
- [ ] Login as admin
- [ ] Verify Overview tab displays:
  - Logged In Musicians (live count)
  - Active Projects
  - Files Shared
  - Total Revenue
  - Total Messages
  - Total Comments
- [ ] Verify "Active Now" section shows logged-in users
- [ ] Check Projects tab shows all projects
- [ ] Check Files tab shows all files

### 11. Project Deletion (Owner Only)
- [ ] As project owner, select a project
- [ ] Click "Delete Project" button
- [ ] Confirm deletion
- [ ] Verify project is removed
- [ ] Verify files are deleted from storage
- [ ] Test that non-owners cannot delete

### 12. Overview Cards Clickability
- [ ] Navigate to musician dashboard
- [ ] Click "Total Earnings" card
- [ ] Verify navigates to Bookings tab
- [ ] Click "Active Bookings" card
- [ ] Verify navigates to Bookings tab
- [ ] Click "Active Projects" card
- [ ] Verify navigates to Projects tab
- [ ] Click "Collab Requests" card
- [ ] Verify navigates to Collab Zone tab
- [ ] Click "Profile Views" card
- [ ] Verify navigates to Settings tab

## Expected Results

### Color Coding for Projects
- Newest project: Gold background with 4px left border
- 2nd newest: Teal background with 4px left border
- 3rd newest: Coral background with 4px left border
- 4th newest: Sky background with 4px left border
- 5th-8th: Muted versions with 2px left border
- 9th+: Cycles through muted colors

### Online Status Tracking
- Musicians active within last 10 minutes show in "Active Now"
- Heartbeat updates every 2 minutes
- Real-time updates via Supabase subscriptions

## Known Issues to Check
- [ ] RLS policies allow project creation for verified musicians
- [ ] Chat messages update in real-time
- [ ] File uploads work for audio files
- [ ] Links in chat are clickable
- [ ] Search dropdown closes on outside click

## Browser Console Checks
- No RLS policy errors
- No authentication errors
- No CORS errors
- No 404 errors for assets
- Supabase connection successful





