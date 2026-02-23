# LaCleo.ai - AI-Powered B2B Lead Generation Platform

## Original Problem Statement
Build an AI SaaS landing page + interactive app interface similar to origami.chat, named lacleo.ai. An AI-powered lead generation platform for B2B database & enrichment.

## User Personas
- **Sales Professionals**: Need qualified leads for outreach
- **Marketing Teams**: Require prospect data for campaigns  
- **Business Development**: Looking for growth opportunities

## Core Requirements
- Landing page with hero, features, stats, testimonials
- JWT-based authentication (email/password)
- AI-powered lead generation using Kimi (with mock fallback)
- Lead data enrichment using Clearbit (with mock fallback)
- Lead table with sorting/filtering
- CSV export functionality
- Purple/dark theme design

## Architecture
### Tech Stack
- **Frontend**: React 19, TailwindCSS, shadcn/ui components
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt password hashing

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/leads/generate` - AI lead generation
- `GET /api/leads` - Get user's leads
- `POST /api/enrich` - Company enrichment
- `GET /api/stats` - User statistics
- `GET /api/searches` - Search history

## What's Been Implemented (2026-02-23)
- ✅ Landing page with hero, features, stats, testimonials sections
- ✅ User registration and login with JWT authentication
- ✅ Dashboard with AI lead discovery
- ✅ Lead generation (MOCKED - no Kimi API key)
- ✅ Company enrichment (MOCKED - no Clearbit API key)
- ✅ Lead table with filtering and sorting
- ✅ CSV export functionality
- ✅ Search history tracking
- ✅ User statistics dashboard
- ✅ Purple/dark theme design

## Prioritized Backlog
### P0 (Critical for Production)
- [ ] Configure Kimi API key for real AI lead generation
- [ ] Configure Clearbit API key for real company enrichment

### P1 (High Priority)
- [ ] Razorpay payment integration
- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Rate limiting on API endpoints

### P2 (Medium Priority)
- [ ] Saved searches functionality
- [ ] Lead tags and categorization
- [ ] Bulk lead actions
- [ ] Advanced filtering options
- [ ] Chrome extension for LinkedIn scraping

## Next Tasks
1. Add Kimi API key to enable real AI-powered lead generation
2. Implement Razorpay subscription billing
3. Add email verification on registration
