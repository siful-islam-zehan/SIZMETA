# ResearchMeta AI — Personal AI Research & Writing Workspace

**ResearchMeta AI (SiZ Edition)** is a personal AI-powered academic research and writing workspace built with a Python-first architecture. It prioritizes factual rigor, source traceability, academic styling, and complete user control.

*Created by **Siful Islam Zehan** (SiZ)*

---

## 1. Architecture Overview

ResearchMeta AI is cleanly divided into an asynchronous **FastAPI Python backend** and a modern **Next.js 14 App Router frontend**:

```
SIZMETA/
├── README.md                          # Project documentation & setup guide
├── .env.example                       # Root environment variable template
├── .gitignore                         # Comprehensive Git ignore rules
├── backend/
│   ├── alembic/                       # Database migrations
│   │   ├── versions/                  # Initial schema revision
│   │   └── env.py
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py                # Dependency injection (get_db, get_current_user)
│   │   │   └── routes/                # Modular REST endpoints
│   │   │       ├── auth.py            # Register, login (JWT, bcrypt)
│   │   │       ├── users.py           # Profile, password management
│   │   │       ├── settings.py        # User settings & preferences
│   │   │       ├── providers.py       # AI provider keys & dynamic model discovery
│   │   │       ├── projects.py        # Research projects CRUD & user isolation
│   │   │       ├── documents.py       # TipTap documents, autosave, versions & assignment generator
│   │   │       ├── export.py          # Multi-format export (PDF, DOCX, MD, TXT)
│   │   │       ├── research.py        # Live arXiv/Crossref retrieval & synthesis engine
│   │   │       ├── rubrics.py         # Academic rubrics & criteria weights
│   │   │       ├── conversations.py   # AI Assistant chat turns, history & memory
│   │   │       └── health.py          # Health check & database connection probe
│   │   ├── core/
│   │   │   ├── config.py              # Pydantic Settings, environment variables
│   │   │   ├── database.py            # SQLAlchemy 2.0 engine & session maker
│   │   │   └── security.py            # Direct bcrypt, HS256 JWT, Fernet key encryption
│   │   ├── models/                    # 13 SQLAlchemy database entities
│   │   ├── schemas/                   # Pydantic v2 validation models
│   │   └── services/
│   │       ├── ai/                    # BaseAIProvider, Gemini, OpenAI, ProviderFactory
│   │       ├── research/              # Academic literature retrieval & synthesis (arXiv + Crossref)
│   │       └── documents/             # Assignment generator & multi-format document exporter
│   ├── tests/                         # Passing pytest integration & unit tests
│   ├── requirements.txt               # Pinned Python dependencies
│   ├── .env.example                   # Backend environment template
│   └── alembic.ini
└── frontend/
    ├── app/                           # Next.js 14 App Router
    │   ├── dashboard/                 # Redesigned Research Hub, live stats & actions
    │   ├── projects/                  # Research project management & metadata
    │   ├── documents/                 # Document listing & creation
    │   │   └── [id]/                  # Live TipTap document workspace
    │   ├── library/                   # Academic sources, DOI, BibTeX citation keys
    │   ├── conversations/             # Fullscreen academic inquiry & copilot
    │   ├── rubrics/                   # Evaluation rubrics & criteria weights
    │   ├── settings/                  # AI provider key management & preferences
    │   ├── login/                     # Scholar authentication (Sign In & Register)
    │   └── globals.css                # Glassmorphic utilities, purple/blue glow variables
    ├── components/
    │   ├── chat/                      # FloatingChatbot assistant widget
    │   ├── research/                  # ResearchHub with Research ON/OFF toggle
    │   ├── documents/                 # AssignmentModal generator wizard
    │   ├── editor/                    # TipTap editor, toolbar, version modal, export dialog
    │   ├── layout/                    # AppShell, responsive sidebar, SiZ branding
    │   └── providers/                 # AuthContext & ThemeProvider (Light/Dark)
    ├── lib/
    │   ├── api.ts                     # Type-safe client for backend REST API
    │   └── utils.ts
    ├── package.json
    └── tailwind.config.ts
```

---

## 2. Core Functional Features

### A. Live Academic Research Engine (arXiv & Crossref)
- **Real Scholarly Retrieval**: Queries live arXiv preprints and Crossref peer-reviewed publication databases.
- **Truthful & Grounded**: Returns verified titles, authors, publication years, venue/journal names, official DOIs, and URLs.
- **Source Credibility Evaluation**: Calculates verification confidence scores (97% for peer-reviewed journal DOIs, 92% for arXiv preprints).
- **Research Mode Toggle**: Explicit **ON/OFF** control. When OFF, external academic queries are strictly prevented.
- **One-Click Actions**: Directly save retrieved sources into your permanent Library or open as a structured manuscript in the TipTap editor.

### B. End-to-End Assignment Generation
- **Requirement Analysis**: Analyzes assignment instructions, target word count, academic level (Undergraduate, Master's, Doctoral), and citation style (APA 7th, MLA 9th, Chicago, Harvard, IEEE).
- **Literature Grounding**: Optionally searches and weaves in relevant arXiv/Crossref academic papers.
- **Rigor & Structure**: Generates clean semantic HTML with formal Introduction, thesis statement, analytical body sections, Conclusion, and References.
- **Direct Workspace Transition**: Immediately loads the generated draft into the live TipTap editor for editing, version snapshots, and export.

### C. Persistent AI Chatbot Assistant
- **Accessible Everywhere**: Floating launcher button on the dashboard/global shell and dedicated fullscreen view at `/conversations`.
- **Conversational Memory**: Maintains multi-turn context from prior messages.
- **Research Mode within Chat**: Grounds chat responses in real academic literature when toggled ON.
- **Multi-Conversation Management**: Start new threads, rename, or delete past conversations stored in PostgreSQL/SQLite.
- **Markdown & Citations**: Renders formatted markdown, code blocks, timestamps, copy response action, and clickable DOI source pills.

### D. Security & Multi-User Data Isolation
- **Encrypted Keys at Rest**: AI API keys (Google Gemini, OpenAI) are encrypted using Fernet symmetric encryption before database storage. Keys never leak into client responses or browser storage.
- **Per-User Isolation**: Every database query is scoped to `user_id`. Scholars cannot view or access another scholar's projects, documents, or keys.
- **Standard Authentication**: Password hashing with `bcrypt` and JWT bearer token authorization (`HS256`).

### E. Premium Glassy & Glowy UI/UX
- **Palette**: Primary Purple `#8055E8`, Deep Purple `#6036C9`, Light Background `#F7F6FC`, Dark Background `#11101A`.
- **Aesthetic**: Modern glassmorphism (`glass-panel`, `glass-card`), subtle translucent surfaces, ambient purple and blue lighting.
- **Creator Signature**: Subtle "Created by Siful Islam Zehan" in the sidebar/footer and "SiZ" edition branding.

---

## 3. Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- (Optional) PostgreSQL and Redis

### Step 1: Environment Setup
Copy the environment template:
```bash
cp .env.example backend/.env
```
*(On Windows PowerShell: `Copy-Item .env.example backend/.env`)*

Review `backend/.env` and configure your settings. Default values run out-of-the-box with SQLite.

### Step 2: Backend Setup
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive API Docs (Swagger): `http://127.0.0.1:8000/docs`
- Health Probe: `http://127.0.0.1:8000/api/v1/health`

### Step 3: Frontend Setup
In a new terminal:
```powershell
cd frontend
npm install
npm run dev -- -p 3000
```
- Web Application: `http://localhost:3000`

### Step 4: First-Time User Registration
Visit `http://localhost:3000/login`, select **Register Account**, and create your scholar credentials. A fresh, empty workspace with full user data isolation will be initialized immediately.

---

## 4. Test Suite Execution

All backend unit and integration tests can be executed with:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest tests -v
```

The test suite covers:
- Authentication, registration, and JWT token issuance
- User isolation across projects and documents
- Live research retrieval (arXiv and Crossref)
- Assignment generation workflow
- Document versioning, autosave, and multi-format export (PDF, DOCX, TXT, Markdown)
- AI provider configuration and Fernet encryption

---

## 5. Creator & License

Created by **Siful Islam Zehan (SiZ)**.
All rights reserved. Designed for academic and research workflows.
