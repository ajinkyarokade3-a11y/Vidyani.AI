# Vidyani.AI — AI Learning Agent

> **An agentic AI learning companion that turns a learner's goal into a personalized, adaptive learning journey.**

Vidyani.AI is an **AI-powered personal learning agent** designed to help users move from *"I want to learn this"* to a structured, guided, and measurable learning journey.

Instead of simply generating a static roadmap, Vidyani.AI uses multiple specialized AI agents to understand the learner, create a personalized plan, track progress, provide feedback, recommend resources, conduct quizzes and mock interviews, and keep the learner accountable through intelligent nudges.

---

## ✨ What Vidyani.AI Does

A learner starts by providing information such as:

* What they want to learn or which career they want to pursue
* Current skill/knowledge level
* Available study time
* Learning preferences
* Target deadline
* Personal preferences and constraints

Vidyani.AI then builds and manages a personalized learning journey.

### Core capabilities

| Capability                   | Description                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------ |
| 🎯 **Intent Understanding**  | Understands the learner's goal, current level, constraints, and preferences    |
| 🗺️ **Personalized Roadmap** | Generates a structured learning plan based on the learner's goal               |
| 📺 **Resource Curation**     | Recommends relevant learning resources, including YouTube content              |
| 📊 **Progress Tracking**     | Tracks the learner's progress through the journey                              |
| 🧠 **AI Feedback**           | Analyzes progress and provides personalized feedback                           |
| 🔔 **Smart Nudges**          | Encourages the learner when progress slows or action is required               |
| 📝 **AI Quizzes**            | Generates quizzes to reinforce concepts and evaluate understanding             |
| 🎤 **Mock Interviews**       | Provides AI-powered interview practice                                         |
| 👨‍🏫 **AI Mentor**          | Allows learners to interact with an AI mentor for guidance                     |
| 📅 **Scheduling**            | Integrates learning activities with scheduling functionality                   |
| 💾 **Persistent Memory**     | Stores learner information, plans, progress, feedback, and interaction history |

---

# 🧠 Agentic Architecture

Vidyani.AI is not built as a single LLM prompt.

It uses a collection of specialized agents and workflows coordinated by an orchestration layer.

```text
                         ┌──────────────────────┐
                         │       Learner        │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    FastAPI Backend   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Domain Orchestrator │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
      │ Intent Agent  │     │ Planner Agent │     │ Progress Agent│
      └───────────────┘     └───────────────┘     └───────────────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                       ┌────────────┴────────────┐
                       │                         │
                       ▼                         ▼
                ┌───────────────┐        ┌───────────────┐
                │ Feedback Agent│        │  Nudge Agent  │
                └───────────────┘        └───────────────┘
                       │                         │
                       └────────────┬────────────┘
                                    ▼
                         ┌──────────────────────┐
                         │    Domain Workflows  │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          ┌────────────┐     ┌────────────┐     ┌────────────┐
          │ PostgreSQL │     │ YouTube API│     │ Google APIs│
          └────────────┘     └────────────┘     └────────────┘
```

---

# 🤖 AI Agents

### 1. Intent Agent

Converts the learner's natural-language requirements into structured learner intent.

It identifies information such as:

* Learning/career goal
* Current level
* Available time
* Deadline
* Preferences
* Constraints

The result is represented using typed Pydantic schemas.

---

### 2. Planner Agent

Uses the learner's intent to generate a structured learning plan.

The planner considers:

* Learner level
* Target outcome
* Available study time
* Deadline
* Learning preferences

The resulting plan becomes the foundation for the learner's journey.

---

### 3. Progress Agent

Evaluates the learner's current progress against the learning plan.

It helps answer:

> "Where am I right now compared with where I should be?"

---

### 4. Feedback Agent

Generates personalized feedback based on the learner's progress and activity.

The objective is not merely to say *"Good job"* but to identify:

* What is going well
* What is falling behind
* What needs improvement
* What the learner should do next

---

### 5. Nudge Agent

Provides timely interventions when the learner needs an additional push.

Examples include:

* Reminders
* Encouragement
* Recovery suggestions after missed activities
* Recommendations for the next action

---

# 🏗️ Technology Stack

## Backend

* **Python**
* **FastAPI**
* **CrewAI**
* **Google Gemini**
* **Pydantic**
* **SQLAlchemy**
* **PostgreSQL**
* **Uvicorn**

## Frontend

* **React**
* **TypeScript**
* **Vite**
* **Tailwind CSS**
* **shadcn/ui**

## Integrations

* **YouTube Data API**
* **Google APIs**
* **PostgreSQL**

## Development

* Git
* GitHub
* Python virtual environments
* npm
* Vercel
* Railway

---

# 📁 Project Structure

```text
Vidyani.AI/
│
├── backend/
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── calendar.py
│   │   │   ├── interview.py
│   │   │   ├── learning.py
│   │   │   ├── mentor.py
│   │   │   └── quiz.py
│   │   └── router.py
│   │
│   ├── database/
│   │   ├── crud.py
│   │   ├── database.py
│   │   └── models.py
│   │
│   ├── framework/
│   │   ├── agents/
│   │   │   └── base_agent.py
│   │   ├── base/
│   │   │   ├── api_key_rotation.py
│   │   │   ├── config.py
│   │   │   └── llm.py
│   │   ├── domains/
│   │   │   ├── loader.py
│   │   │   └── registry.py
│   │   └── tools/
│   │       ├── console.py
│   │       └── google_calendar_service.py
│   │
│   ├── domains/
│   │   └── learning/
│   │       ├── agents/
│   │       │   ├── feedback_agent.py
│   │       │   ├── intent_agent.py
│   │       │   ├── nudge_agent.py
│   │       │   ├── planner_agent.py
│   │       │   └── progress_agent.py
│   │       │
│   │       ├── prompts/
│   │       │   ├── feedback.md
│   │       │   ├── intent.md
│   │       │   ├── interview.md
│   │       │   ├── mentor.md
│   │       │   ├── nudge.md
│   │       │   ├── planner.md
│   │       │   ├── progress.md
│   │       │   └── quiz.md
│   │       │
│   │       ├── schemas/
│   │       └── workflows/
│   │
│   ├── schemas/
│   ├── services/
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── domain/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   ├── architecture.md
│   ├── contributing.md
│   └── create-new-domain.md
│
├── .env.example
├── requirements.txt
└── README.md
```

---

# 🔄 Learning Session Flow

A typical learning session follows this flow:

```text
User Input
    │
    ▼
Intent Agent
    │
    ▼
Structured Learner Intent
    │
    ▼
Planner Agent
    │
    ▼
Personalized Learning Plan
    │
    ▼
Progress Tracking
    │
    ├───────────────┐
    ▼               ▼
Feedback Agent   Nudge Agent
    │               │
    └───────┬───────┘
            ▼
     Updated Learner State
            │
            ▼
      Next Best Action
```

This allows Vidyani.AI to operate as an **ongoing learning companion**, rather than a one-time roadmap generator.

---

# ⚙️ Configuration

Vidyani.AI uses environment variables for API keys, database configuration, and domain selection.

Create a `.env` file from the provided example:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then configure the required values.

Example:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/vidyani

GEMINI_API_KEY_1=your_key
GEMINI_API_KEY_2=your_key

YOUTUBE_API_KEY_1=your_key
YOUTUBE_API_KEY_2=your_key

ACTIVE_DOMAIN=learning
```

### Never commit `.env`

API keys and database credentials must remain outside Git.

---

# 🚀 Local Development

## Prerequisites

Make sure you have:

* Python 3.12+
* Node.js
* npm
* PostgreSQL
* Git

---

## 1. Clone the repository

```bash
git clone https://github.com/Ajinkya-Rokade/Vidyani.AI.git
cd Vidyani.AI
```

---

## 2. Create the Python environment

### Windows

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### macOS/Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configure environment variables

```powershell
Copy-Item .env.example .env
```

Fill in the required API keys and database URL.

---

## 5. Start the backend

From the project root:

```bash
python -m backend.main
```

Or using Uvicorn:

```bash
uvicorn backend.main:app --reload
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

---

# 💻 Frontend Setup

Open another terminal:

```powershell
cd frontend
```

Install dependencies:

```bash
npm install
```

Create/configure:

```text
frontend/.env
```

Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

Vite will provide a local URL, normally:

```text
http://localhost:5173
```

---

# 🧪 Verification

### Backend compilation

```bash
python -m compileall backend
```

### Frontend build

```bash
cd frontend
npm run build
```

### Frontend lint

```bash
npm run lint
```

### API documentation

Once the backend is running:

```text
http://127.0.0.1:8000/docs
```

---

# 🌐 Deployment

Vidyani.AI can be deployed as two services.

```text
                   Internet
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
       Vercel                  Railway
       Frontend                Backend
            │                     │
            │ HTTPS               │
            └──────────►──────────┤
                                  │
                                  ▼
                              PostgreSQL
```

### Frontend

Recommended deployment:

**Vercel**

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Set the frontend environment variable:

```env
VITE_API_BASE_URL=https://your-railway-domain
```

### Backend

Recommended deployment:

**Railway**

Start command:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

Configure backend environment variables in Railway rather than committing them to Git.

---

# 🔐 Security

Do not commit:

```text
.env
```

or any file containing:

* Gemini API keys
* YouTube API keys
* Google credentials
* Database passwords
* OAuth secrets

The `.env.example` file should contain **variable names and placeholders only**.

Also note that Vite exposes variables beginning with `VITE_` to browser-side code. Therefore, browser-exposed API keys should never be treated as server-side secrets and should have appropriate API restrictions configured.

---

# 📚 Documentation

Additional documentation:

* `docs/architecture.md` — system architecture and design
* `docs/create-new-domain.md` — creating and registering a new domain
* `docs/contributing.md` — contribution guidelines

---

# 🗺️ Roadmap

Future improvements include:

* [ ] More autonomous multi-agent workflows
* [ ] Improved long-term learner memory
* [ ] Better resource ranking and personalization
* [ ] Adaptive learning-plan regeneration
* [ ] More integrations with external knowledge sources
* [ ] Advanced analytics and learner insights
* [ ] More domain implementations
* [ ] Production-grade authentication and authorization
* [ ] Improved observability and agent tracing
* [ ] Automated evaluation of agent outputs

---

# 🎯 Vision

Most learning platforms answer:

> **"What should I learn?"**

Vidyani.AI aims to answer something more useful:

> **"What should I do next, given who I am, where I am, where I want to go, and how I'm progressing?"**

The goal is to build an AI learning companion that continuously understands the learner's evolving state and adapts the journey accordingly.

---

# 👨‍💻 Author

**Ajinkya Rokade**

Computer Science Engineering — AI & Data Science

GitHub:
https://github.com/Ajinkya-Rokade

---

# 📄 License

This project is currently intended as a personal/hackathon project.

Add an explicit open-source license before distributing the code for external use.
