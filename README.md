Here is the **professional, clean GitHub-formatted README.md** with **no emojis**, **no fancy characters**, and perfect Markdown formatting.

---

# Smart Task Planner

A lightweight AI-powered planner that converts user goals into actionable tasks with timelines, dependencies, and a clean frontend interface.

---

## Table of Contents

* [Project Overview](#project-overview)
* [How It Works](#how-it-works)
* [Project Structure](#project-structure)
* [Getting Started](#getting-started)
* [API Endpoints and Examples](#api-endpoints-and-examples)
* [Project Screenshots](#project-screenshots)
* [Troubleshooting](#troubleshooting)
* [Contributing](#contributing)
* [License](#license)

---

## Project Overview

### Purpose

Smart Task Planner transforms a high-level goal (for example: "Launch a mobile app in 8 weeks") into a detailed, structured task plan with:

* Project phases
* Task breakdown
* Estimated durations
* Start and end dates
* Task dependencies
* Priority levels
* Critical path estimation

### Tech Stack

* Backend: Flask (Python)
* Frontend: HTML, CSS, JavaScript
* Storage: In-memory dictionary (demo only)

### Key Features

* Automatic domain detection (software, event, marketing, general)
* Task generation based on goal and timeline
* Duration estimation and scheduling
* Dependency generation
* Simple critical path prediction
* Single-page frontend interface

---

## How It Works

### High-Level Flow

1. The user enters a project goal and a timeline in weeks.
2. The frontend sends this data to `POST /api/plan`.
3. The backend processes the input using the `SmartTaskPlanner` class:

   * Detects the domain of the goal
   * Selects phases
   * Generates tasks within each phase
   * Assigns start and end dates
   * Creates dependencies
   * Estimates the critical path
4. The generated plan is stored in memory and returned as a JSON response.

### Main Backend Functions

* `detect_domain(goal_text)` — Determines the type of project.
* `break_down_goal(goal_text, timeline_weeks)` — Creates the complete plan structure.
* `generate_dependencies(task_index, total_tasks)` — Generates realistic task dependencies.
* `calculate_critical_path(tasks)` — Estimates the longest dependency chain.

---

## Project Structure

```
Smart-Task-Planner/
│
├── backend/
│   ├── app.py                 # Flask API and planning logic
│   └── requirements.txt       # Python dependencies
│
├── frontend/
│   ├── index.html             # Main user interface
│   ├── style.css              # Styles
│   └── script.js              # Frontend logic and API calls
│
├── Images/                    # Screenshots used in README
│   ├── screenshot_homepage.png
│   ├── screenshot_goal.png
│   ├── screenshot_loading.png
│   ├── screenshot_plan.png
│   └── screenshot_timeline.png
│
└── README.md
```

---

## Getting Started

### Step 1: Create and Activate a Virtual Environment

```
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r backend/requirements.txt
```

### Step 2: Run the Backend Server

```
$env:PORT = '5000'
python backend/app.py
```

The server runs at:
[http://localhost:5000](http://localhost:5000)

### Step 3: Start the Frontend

**Option A: Open directly**

```
start ./frontend/index.html
```

**Option B: Serve with a local HTTP server**

```
cd frontend
python -m http.server 8000
```

---

## API Endpoints and Examples

### Endpoints

| Method | Endpoint          | Description              |
| ------ | ----------------- | ------------------------ |
| GET    | `/`               | API info                 |
| POST   | `/api/plan`       | Generate a task plan     |
| GET    | `/api/plans`      | List all saved plans     |
| GET    | `/api/plans/<id>` | Retrieve a specific plan |
| GET    | `/api/sample`     | Sample generated plan    |
| GET    | `/health`         | Health check             |

### Example: cURL (Linux / macOS)

```
curl -X POST http://localhost:5000/api/plan \
  -H "Content-Type: application/json" \
  -d '{"goal": "Launch a mobile app", "timeline": 8}'
```

### Example: PowerShell

```
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/plan -ContentType 'application/json' -Body (@{goal='Launch a mobile app'; timeline=8} | ConvertTo-Json)
```

---

## Project Screenshots

### Homepage

![Homepage](Images/screenshot_homepage.png)

### Goal Input

![Goal Input](Images/screenshot_goal.png)

### Generating Task

![Generating Plan](Images/screenshot_loading.png)

### Plan Summary and Timeline

![Plan Summary](Images/screenshot_plan.png)

### Export Options

![Timeline](Images/screenshot_timeline.png)

---

## Troubleshooting

* Backend not starting
  Ensure all Python dependencies are installed and Python version is 3.8+.

* Frontend cannot talk to backend
  Check the browser console for CORS or port issues. Ensure backend is running on the expected port.

* Virtual environment activation blocked in PowerShell
  Run:

  ```
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```
