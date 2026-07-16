# InternRoute — Trello Board Setup (Bootcamp Template)

> Align the board with [BootcampScrumTemplate](https://github.com/YapayZekaveTeknolojiAkademisi/BootcampScrumTemplate): **Kanban lists** + **blue = User Story**, **red = Task**.

---

## 1. Target list layout (left → right)

Delete or archive old lists: `Sprint 1`, `Sprint 2`, `Sprint 3`, `Doing`, old `To Do` (after moving cards).

Create **exactly these 5 lists**:

| # | List name | Purpose |
|---|-----------|---------|
| 1 | **Rejected** | Deprioritized / dropped items |
| 2 | **Backlog** | All product backlog (stories + future tasks). Not in current sprint. |
| 3 | **To Do** | **Current sprint** selected work (Sprint 2: 6 Jul – 19 Jul 2026) |
| 4 | **In Progress** | Actively being worked on (max 1–2 cards per person) |
| 5 | **Done** | Completed stories & tasks |

Optional: pin a list description on **To Do**: `Sprint 2 — 6 Jul to 19 Jul 2026`

---

## 2. Labels (create in Trello → Labels)

### Required (template colours)

| Label | Colour | Use on |
|-------|--------|--------|
| **User Story** | 🔵 Blue | Every `US-x.x` card |
| **Task** | 🔴 Red | Every technical sub-task card |

### Recommended (sprint & area)

| Label | Colour | Use on |
|-------|--------|--------|
| Sprint 1 | Green | Sprint 1 completed items |
| Sprint 2 | Yellow | Current sprint |
| Sprint 3 | Purple | Final sprint |
| Process | Orange | Meetings, retro, GitHub upload |
| backend | — | API / DB work |
| frontend | — | React UI |
| ai | — | RAG / agents |
| docs | — | README, evidence |

**Rule:** A card is either **blue (story)** OR **red (task)** — not both.

---

## 3. Story → task breakdown

Stories are **blue parent cards**. Tasks are **red child cards** (same list, or link in story description).

### Sprint 1 stories (all → **Done**)

#### 🔵 US-1.1: User registration & login
| 🔴 Task | Status |
|---------|--------|
| Auth API: POST /register, POST /login, GET /me | Done |
| JWT middleware & password hashing | Done |
| Login page (wired to API) | Done |
| Register page (wired to API) | Done |
| Fix auth redirect loop | Done |

#### 🔵 US-1.2: FastAPI project setup
| 🔴 Task | Status |
|---------|--------|
| main.py + API router structure | Done |
| Health endpoint | Done |
| Swagger UI (/docs) | Done |
| Environment config (.env, Pydantic settings) | Done |

#### 🔵 US-1.3: Database models
| 🔴 Task | Status |
|---------|--------|
| User model + SQLite setup | Done |
| Job model (scaffold) | Done |
| CV & Application models (scaffold) | Done |

#### 🔵 US-1.4: Student profile (bonus — pulled into Sprint 1)
| 🔴 Task | Status |
|---------|--------|
| Profile API (GET/PATCH) | Done |
| Profile page UI | Done |

#### 🔵 US-1.5: Project quality (bonus)
| 🔴 Task | Status |
|---------|--------|
| Basic test suite (pytest + Vitest) | Done |
| HOW_TO_START_APP.md | Done |
| Upload Sprint 1 code to GitHub | Done |

#### 🟠 Process (red + Process label) → **Done**
| Card | Status |
|------|--------|
| Sprint 1 Planning meeting | Done |
| Sprint 1 Review meeting | Done |
| Sprint 1 Retrospective | Done |
| Assign Scrum roles (PO, SM) | Done |
| Set up Trello board | Done |

---

### Sprint 2 — current sprint

Move **selected** items to **To Do**. Rest stays in **Backlog**.

#### 🔵 US-2.1: Manual job posting & board → **Done** (completed early)
| 🔴 Task | Status |
|---------|--------|
| Job CRUD API | Done |
| Job board page (frontend) | Done |
| Application status on job form | Done |
| Pipeline page (jobs from API) | Done |

#### 🔵 US-2.2: PDF CV upload → **To Do**
| 🔴 Task | List |
|---------|------|
| PDF upload API + file storage | To Do |
| CV upload page (frontend) | To Do |
| CV locker UI polish | Backlog |

#### 🔵 US-2.3: Job–CV matching / applications → **To Do**
| 🔴 Task | List |
|---------|------|
| Applications API | To Do |
| Applications list UI (which CV for which job) | Backlog |

#### 🔵 US-2.4: Dashboard summary stats → **To Do**
| 🔴 Task | List |
|---------|------|
| Wire live job/CV/AI counts on dashboard | To Do |

#### 🔵 US-2.5: RAG foundation → **Backlog** (start after CV upload)
| 🔴 Task | List |
|---------|------|
| ChromaDB setup & collections | Backlog |
| PDF to text extraction pipeline | Backlog |
| CV embedding & RAG ingestion | Backlog |
| Memory context API endpoint | Backlog |

#### 🟠 Process → **Backlog** or **To Do**
| Card | List |
|------|------|
| Sprint 2 Planning meeting | Done |
| Sprint 2 Review meeting | Backlog |
| Sprint 2 Retrospective | Backlog |
| Upload Sprint 2 docs to GitHub | Backlog |

---

### Sprint 3 — backlog only (until 20 Jul)

All 🔵 stories in **Backlog** with **Sprint 3** label:

- US-3.1: Analyzer Agent + gap report UI  
- US-3.2: Writer Agent + cover letter studio  
- US-3.3: HR Mock Interview Agent + chat UI  
- US-3.4: Deploy, demo video, final delivery  

(Split each into 🔴 tasks when Sprint 3 planning starts.)

---

### Repo / docs (already done) → **Done**

Move as 🔴 **Task** cards with **docs** label:

- Create GitHub repository (public)  
- Project folder structure & README  
- Architecture documentation  
- API design draft  
- Sprint plan draft  
- Trello board created  
- Auth flow end-to-end  

---

### Backlog — process & events

| Card | List |
|------|------|
| Sprint 3 Planning meeting | Backlog |
| Q&A session (6 Jul / 20 Jul) | Backlog |
| Top 10 presentation (14 Aug) | Backlog |
| Submit team info form | Backlog if not done |

---

## 4. Migration steps (30–45 min)

1. **Create labels** (section 2).  
2. **Create 5 new lists** (section 1).  
3. **Move all completed Sprint 1 cards** → **Done**. Add 🔵 or 🔴 label + **Sprint 1**.  
4. **Split flat cards into story + tasks** where missing (e.g. merge “JWT” + “Login page” under US-1.1).  
5. **Sprint 2:** US-2.1 + tasks → **Done** (early). US-2.2, 2.3, 2.4 tasks → **To Do**. RAG → **Backlog**.  
6. **Sprint 3:** all stories → **Backlog** + Sprint 3 label.  
7. **Delete empty old lists** (Sprint 1/2/3 columns).  
8. **Take 3 screenshots** for README: Backlog | To Do + In Progress | Done  
9. Save to `ProjectManagement/Sprint1Documents/backlog1.png` etc.

---

## 5. README text (Backlog düzeni)

Copy into README Sprint 1 section:

> **Backlog organisation:** The product backlog lives in the **Backlog** list. Each sprint, the PO selects stories into **To Do** without exceeding the sprint point cap. No single user story exceeds half of the sprint’s total points.  
> **Blue labels** = User Stories (`US-x.x`). **Red labels** = Tasks (technical sub-work). Stories are broken down into tasks before development starts.  
> **Workflow:** Backlog → To Do → In Progress → Done. Rejected items go to the **Rejected** list.

---

## 6. What NOT to put in Rejected

Keep empty unless you formally drop a feature. Example future use: “LinkedIn auto-scraper” (out of scope).

---

## 7. Daily Scrum

WhatsApp standups — export to `ProjectManagement/Sprint1Documents/DailyScrumMeetingNotesSprint1.md` and link from README.
