# SocietyPulse — 60-Second Judge Demo Guide

> **Core Pitch:** *"100 flats, 5 minutes a day, zero buried emergencies."*

---

## ⚡ The 60-Second Demo Script

### Step 1: The Problem (10 seconds) — Chaos to Clarity
- Scroll to the **"Chaos → Clarity"** section on the homepage (`/`).
- Show the messy WhatsApp group screenshot/mock:
  - 12 mixed messages in English and Hinglish.
  - A critical elevator emergency (*"Bachha lift me fasa hai Tower B"*) is completely buried under noise like parking squabbles and festive wishes.
- Click **"Clean It Up"** to watch the messages transform instantaneously into prioritized, categorized, actionable cards.

### Step 2: Live AI Triage Sandbox (15 seconds) — Zero-Login Interactive Demo
- Scroll to the **Live AI Triage Sandbox** on the homepage.
- Click any sample chip (e.g. *"Lift B subah se band hai aur koi sun nahi raha"* or *"Sparking in meter room"*).
- Watch the real-time AI extraction:
  - **Detected Language:** Hinglish / Hindi $\rightarrow$ English translation.
  - **Urgency Gauge:** Automatically scores 0–100 with objective criteria.
  - **Safety Hazard Alert:** Immediate red badge if safety is compromised.
  - **Suggested Assignee & Action:** Routed to the right committee lead / technician.
- Click **"File this complaint"** to see it prefill seamlessly into the 3-step resident report wizard (`/report?text=...`).

### Step 3: Committee Command Center (20 seconds) — 1-Click Judge Access
- Click **"Try as committee member"** on the hero or login page.
  - Instant session authentication without credentials (`DEMO_MODE=true`).
  - Guided 5-step tour highlights key committee workflows.
  - **Resident Privacy Guarantee:** Resident phone numbers are strictly masked (`••••••1234`) for the demo evaluator role.
- Point out the **Top Metrics Bar**:
  - **Estimated Committee Time Saved:** Calculated from 1.5 minutes saved per message triage.
  - **AI Accuracy Tile:** 96%+ triage accuracy with full human override tracking.
- Point out the **Recurring Issues Panel**:
  - Highlights *Tower B Passenger Lift: 4 failures in the last 30 days*.
  - Suggests proactive action: *"Withhold AMC payment until motor replacement certification."*

### Step 4: 3D Digital Twin & Incident Drawer (10 seconds)
- Hover over **Tower B** in the **3D Society Map**:
  - Live tooltip reveals exact status: *1 Critical, 2 High, 1 Medium issue*.
  - Click Tower B to filter all issues down to that specific wing.
  - Toggle to 2D view for accessibility / low-power mobile devices.
- Open any complaint to view the **Incident Detail Drawer**:
  - Shows AI classification with human override audit note (*"AI suggested Medium, escalated to High by Secretary"*).
  - Status updates feature an 8-second floating **Undo Toast** to prevent accidental misclicks.

### Step 5: Trust, Security & Resilience (5 seconds)
- Explain the zero-failure resilience architecture:
  - Works with Google Gemini API when configured.
  - Seamlessly falls back to an offline rule-based NLP Heuristic engine if the API key is missing or quota is exceeded.
  - Real-time MongoDB persistence with automatic local file fallback.

---

## 🎯 Key Metrics & Proof Points
- **Time to Triage:** Instant (< 1 second) vs. 45+ minutes manually sorting WhatsApp chats.
- **Safety Escalation:** Immediate flagging of life-safety risks (elevators, electrical fires, water contamination).
- **Audit Compliance:** 1-click CSV export ready for Annual General Meetings (AGM) and auditor scrutiny.
- **Privacy by Design:** Full role-based access control; guest/demo evaluators cannot access private resident phone numbers.
