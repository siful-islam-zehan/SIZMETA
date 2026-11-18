# ResearchMeta AI — Frontend Client

The web frontend for **ResearchMeta AI (SiZ Edition)**, built with Next.js 14 (App Router), TypeScript, Tailwind CSS, TipTap rich-text editor, and Lucide icons.

*Created by **Siful Islam Zehan** (SiZ)*

---

## Tech Stack
- **Framework**: Next.js 14 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom glassmorphism & purple/blue glow tokens
- **Rich Text Editor**: TipTap (StarterKit, Typography, Underline, Link)
- **Icons**: Lucide React
- **API Client**: Modular fetch-based REST client with JWT Bearer authentication

---

## Directory Overview
```
frontend/
├── app/
│   ├── dashboard/           # Main hub: live stats, quick actions, Research Hub
│   ├── documents/           # Document library & [id] TipTap editor workspace
│   ├── projects/            # Academic research projects & isolated folders
│   ├── library/             # Academic literature collection, DOIs, BibTeX keys
│   ├── conversations/       # Multi-turn AI Assistant academic inquiry
│   ├── rubrics/             # Assignment grading rubrics & criteria
│   ├── settings/            # AI provider configuration & user preferences
│   ├── login/               # Scholar sign in & registration
│   └── globals.css          # Glassmorphic utilities, glow effects, theme tokens
├── components/
│   ├── chat/                # FloatingChatbot persistent assistant
│   ├── research/            # ResearchHub arXiv/Crossref query engine
│   ├── documents/           # AssignmentModal paper generator wizard
│   ├── editor/              # TipTap editor, toolbar, versioning, export dialog
│   ├── layout/              # AppShell, responsive sidebar, navigation
│   └── providers/           # AuthProvider & ThemeProvider
└── lib/
    ├── api.ts               # Type-safe API client for FastAPI backend
    └── utils.ts             # Tailwind class merge & date formatting
```

---

## Running the Frontend

```bash
# Install dependencies (if not already installed)
npm install

# Run the local development server on port 3000
npm run dev -- -p 3000

# Create production build
npm run build
```

The frontend connects to the FastAPI backend running at `http://127.0.0.1:8000/api/v1` (customizable via `NEXT_PUBLIC_API_URL`).
