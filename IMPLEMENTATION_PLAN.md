# Deep Research Implementation Plan

## Current Flow
1. User submits initial query on homepage (`+page.svelte`)
2. Form submission handled in `+page.server.ts`
3. Report is created with 'pending' status
4. User is redirected to report detail page
5. Report detail page shows "Start Interactive Research" or "Quick Start Research" buttons
6. When clicked, it either:
   - Starts research immediately (Quick Start)
   - Shows follow-up questions in `InteractiveResearch.svelte` component

## Issues
- Creating report before getting user feedback
- Optional interactive process
- Disconnected user experience
- Automatic submissions without complete context

## Implementation Plan

### 1. Modify Homepage Form Submission
- Update `+page.server.ts` to NOT create a report immediately
- Instead, generate follow-up questions first
- Return these questions to the form page. Use the APIs listed below to generate the questions
- Keep the user on the homepage until questions are answered

### 2. Create New Homepage States
- Add a multi-step form to `+page.svelte`:
  1. Initial query input (topic + description)
  2. Follow-up questions display and input
  3. Review all inputs before final submission
- Add a progress indicator showing which step user is on
- Maintain state between steps
- Allow navigation between steps

### 3. API Endpoint Updates
- Create new endpoint `/api/research/prepare`:
  - Input: topic + description
  - Output: generated follow-up questions
- Modify existing endpoint `/api/research/start`:
  - Move report creation here
  - Include all user inputs (topic, description, answers)
  - Handle complete research initialization

### 4. Flow Changes
#### Step 1: Initial Input
- User enters topic and description
- Client-side validation
- Submit to /api/research/prepare
- Display loading state

#### Step 2: Follow-up Questions
- Display generated questions
- User must answer all questions
- Show preview of initial query
- Allow going back to modify initial input

#### Step 3: Review
- Show summary of all inputs
- Allow editing any part
- Final submit button creates report and redirects

#### Step 4: Report Creation
- Only create report after all inputs are collected
- Redirect to report page
- Start research process immediately

### 5. Component Updates
- Remove InteractiveResearch.svelte (functionality moved to main form)
- Create new components:
  - ResearchForm.svelte (multi-step form handler)
  - InitialInput.svelte (step 1)
  - FollowUpQuestions.svelte (step 2)
  - ReviewInputs.svelte (step 3)
- Add shared types and interfaces

### 6. Remove Automatic Starts
- Remove "Quick Start" option
- Remove auto-start functionality
- Ensure research only begins after complete user input
- Update UI to reflect new flow