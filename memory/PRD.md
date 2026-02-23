# LaCleo.ai - AI-Powered GTM Workflows Platform

## Original Problem Statement
Build an AI SaaS platform similar to origami.chat - a conversational AI interface for B2B lead generation, prospect discovery, and data enrichment.

## User Personas
- **Sales Teams**: Need to find ideal customers and build prospect lists
- **Business Development**: Looking for companies showing buying signals
- **Marketing Teams**: Need enriched data for targeted campaigns
- **Growth Teams**: Want to find lookalike companies to existing customers

## Core Requirements (Based on origami.chat)
1. **Conversational AI Interface** - Chat-style search with natural language prompts
2. **Multiple Search Modes** - Find People, Find Companies, Scrape Websites, Enrich Data
3. **Template Use Cases** - Pre-built searches by industry (Healthcare, Fintech, E-commerce, etc.)
4. **Personalization** - Enter website URL for personalized recommendations
5. **Fit Score System** - Lead scoring with visual color-coded badges
6. **Spreadsheet Results** - Interactive data table with sortable columns
7. **Follow-up Questions** - Continue conversations with refinement queries
8. **Import CSV** - Upload existing data for enrichment
9. **Find Lookalikes** - Discover similar companies
10. **Export CSV** - Download leads for CRM import

## Architecture
### Tech Stack
- **Frontend**: React 19, TailwindCSS, shadcn/ui, Inter font
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt

### Key API Endpoints
- `POST /api/search` - AI-powered search with multiple modes
- `GET /api/templates/categories` - Template categories by industry
- `GET /api/templates` - Search templates
- `POST /api/templates/{id}/run` - Execute template search
- `POST /api/personalize` - Website analysis for recommendations
- `POST /api/lookalikes` - Find similar companies
- `POST /api/enrich` - Company data enrichment
- `POST /api/import/csv` - CSV import

## What's Been Implemented (2026-02-23)
### Landing Page (origami.chat style)
- ✅ Clean white design with Product Hunt badge
- ✅ "Stop building lead lists manually" headline
- ✅ Search box with 4 modes
- ✅ Quick actions (Personalize, Import CSV, Find Lookalikes)
- ✅ Live demo table with YC W26 Founders
- ✅ Trusted by section
- ✅ Template use cases by industry
- ✅ FAQ section
- ✅ CTA section

### Dashboard (Chat Interface)
- ✅ Sidebar with recent searches
- ✅ Template categories and cards
- ✅ AI search with natural language
- ✅ Results table with fit scores
- ✅ Company enrichment modal
- ✅ Export CSV functionality
- ✅ Follow-up suggestions

### Backend
- ✅ Mock data generation for leads (MOCKED - no Kimi API)
- ✅ Mock company enrichment (MOCKED - no Clearbit API)
- ✅ Template system
- ✅ Search history tracking
- ✅ JWT authentication

## Prioritized Backlog
### P0 (Critical for Production)
- [ ] Connect Kimi AI API for real lead generation
- [ ] Connect Clearbit API for real enrichment
- [ ] Real company/people data sources

### P1 (High Priority)
- [ ] Razorpay subscription billing
- [ ] Credit system implementation
- [ ] Email verification
- [ ] CSV import parsing

### P2 (Medium Priority)
- [ ] Chrome extension
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Email sequencing
- [ ] Team collaboration features

## Next Tasks
1. Add Kimi API key to enable real AI-powered search
2. Connect to real B2B data providers (Apollo, LinkedIn, etc.)
3. Implement Razorpay for subscription billing
4. Add credit tracking system
