# PRD

Deploy this to Vercel

## Problem

I'd like to deploy this to Vercel. The problem is that it primarily is a cli tool that saves to local markdown files.

## Solution

Convert this project to a SvelteKit application and deploy it to Vercel.

## Features

- [x] Convert to SvelteKit
  - [x] Initial SvelteKit setup with TypeScript
  - [x] Project structure setup
    - [x] Routes directory
    - [x] Components directory
    - [x] API routes
  - [x] Database integration with Prisma + PostgreSQL
  - [ ] Migration of existing business logic
- [ ] Deploy to Vercel
  - [ ] Configure Vercel project settings
  - [ ] Set up environment variables
  - [ ] Database connection setup
  - [ ] Support for long-running jobs using Edge Runtime
- [ ] Add a new report
  - [x] Database schema for reports
  - [x] Report creation form
  - [x] Report listing page
  - [x] Show the Markdown report on the web app
  - [ ] Background job processing for report generation

## Implementation Progress

1. ✅ Setting up SvelteKit project
   - Created SvelteKit project with TypeScript
   - Set up project structure
   - Added TailwindCSS for styling

2. ⏳ Core Feature Migration (Current)
   - Created database schema and migrations
   - Implemented report creation and viewing
   - Next: Migrate CLI functionality to web-based API

3. 🔜 Database Integration
   - Database schema created
   - Migrations setup ready
   - Next: Set up Vercel Postgres

4. 🔜 Deployment
   - Vercel configuration
   - Environment setup
   - Testing and validation

## Next Steps
1. Set up Vercel project and deploy initial version
2. Migrate the deep-research CLI functionality to web API endpoints
3. Implement background job processing for report generation
4. Add authentication (if needed)
5. Set up proper error handling and logging
