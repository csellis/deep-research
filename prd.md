# PRD

Deploy this to Vercel

## Problem

I'd like to deploy this to Vercel. The problem is that it primarily is a cli tool that saves to local markdown files.

## Solution

Convert this project to a SvelteKit application and deploy it to Vercel.

## Features

- [ ] Convert to SvelteKit
  - [ ] Initial SvelteKit setup with TypeScript
  - [ ] Project structure setup
    - [ ] Routes directory
    - [ ] Components directory
    - [ ] API routes
  - [ ] Database integration with Prisma + PostgreSQL
  - [ ] Migration of existing business logic
- [ ] Deploy to Vercel
  - [ ] Configure Vercel project settings
  - [ ] Set up environment variables
  - [ ] Database connection setup
  - [ ] Support for long-running jobs using Edge Runtime
- [ ] Add a new report
  - [ ] Database schema for reports
  - [ ] Report creation form
  - [ ] Report listing page
  - [ ] Show the Markdown report on the web app
  - [ ] Background job processing for report generation

## Implementation Progress

1. ⏳ Setting up SvelteKit project (Current)

   - Creating new SvelteKit project
   - Configuring TypeScript
   - Setting up initial project structure

2. 🔜 Core Feature Migration

   - Convert CLI functionality to web-based
   - Create API routes
   - Implement frontend components

3. 🔜 Database Integration

   - Prisma setup
   - PostgreSQL configuration
   - Data migration plan

4. 🔜 Deployment
   - Vercel configuration
   - Environment setup
   - Testing and validation
