# 🎬 SocietyPulse — 2-Minute Demo Script

Welcome to **SocietyPulse**, the production-ready AI complaint triage system replacing chaotic WhatsApp groups for housing societies (~100-500 flats).

---

## ⏱️ Step-by-Step 2-Minute Demo Walkthrough

### 0:00 - 0:25 | 3D Society Hero & Multilingual Resident Landing (`/`)
1. **Open** `http://localhost:3000`.
2. Notice the **3D Housing Society Digital Twin** hero: low-poly towers with softly glowing windows, a moving elevator cabin, and zero-G floating ambient particles.
3. Click the **Language Toggle** in the top right to switch between **English** and **हिंदी** — observe instant bilingual translation.
4. Review the live public statistics strip: **Active Issues**, **Resolved This Month**, and **Average Resolution Time (12h)**.
5. Click the primary CTA: **"Report an Issue"** (or go to `/report`).

---

### 0:25 - 0:55 | Multilingual Complaint Submission & Realtime AI Triage (`/report`)
1. In Step 1 (**What happened?**), click the voice language button to select **हिंदी / Hinglish** or type a realistic Hinglish complaint:
   ```text
   Lift B nahi chal rahi hai, ground floor par atki hai
   ```
2. (Optional) Press & hold the **Microphone** button to test the **Web Speech API** audio waveform.
3. Click **"Next: Location & Info"** (Step 2).
4. Select **Wing B**, Flat **B-404**, Name: **Sunil Rao**, Phone: `98210 33333`.
5. Click **"Next: Review & Submit"** (Step 3).
6. **Observe the AI Triage Card in Action**:
   - **Language Detected:** `Hinglish`
   - **Category:** `Lift / Elevator`
   - **Urgency:** `High`
   - **English Translation:** *"Lift B is not working, stuck on ground floor."*
   - **Duplicate Detection:** Semantically matches existing incident `SP-2026-0002` (*Wing B passenger elevator out of service*).
7. Click **"Submit Complaint"** — watch the confetti burst, and copy your generated Complaint ID (e.g. `SP-2026-0026`).

---

### 0:55 - 1:20 | Resident Live Tracking & Follow-up (`/track`)
1. Click **"Track Status Now"** (or visit `/track?id=SP-2026-0026&flat=B-404`).
2. Observe the **vertical resolution timeline**:
   - Timestamped steps: `Received` → `AI Triaged` → `Assigned`.
   - Realtime **SLA Countdown Timer** (e.g., `4h left`).
3. Add a resident follow-up note: *"Elderly resident has doctor appointment at 4 PM"*.
4. Notice how resident comments post immediately to the official activity log.

---

### 1:20 - 1:45 | Committee Command Center & 5-Minute AI Digest (`/dashboard`)
1. Navigate to `/login` or click **"Committee Login"**.
2. Click the **1-Tap Demo Button**: **"Vikram Malhotra (Admin / President)"**.
3. Land on `/dashboard`:
   - **Today's 5-Minute AI Digest Card**: Displays counts (*3 urgent, 5 new, 2 overdue, 4 duplicates merged*) and one-line action summaries with 1-tap **Assign / Start / Resolve** shortcuts.
   - **3D Society Map**: Towers glow **Red** (Wing B has critical electrical sparks/lift outage) and **Amber** (Wing A water outage). Click **Tower B** to filter complaints instantly.
   - Click **"Switch to 2D View"** to inspect the low-power fallback grid.

---

### 1:45 - 2:00 | Kanban Board & Incident Drawer
1. Switch to the **Kanban Board**:
   - Drag or tap cards across columns: `New` → `Assigned` → `In Progress` → `Resolved`.
2. Click any card to open the **Complaint Detail Drawer**:
   - View original Hinglish text alongside AI translation.
   - Review internal confidential notes (hidden from residents).
   - Change assigned contractor or committee lead.
   - Click **"Send Update to Resident"** to push a notification directly to the resident's tracking timeline.
3. Switch to **Insights & Hotspots**: View Recharts category breakdown and recurring asset alerts (e.g., *"Lift B failed 4 times this month"*).

---

## 🔑 Quick Demo Credentials
- **Admin**: `admin@society.org` / `admin123`
- **Secretary**: `secretary@society.org` / `member123`
- **Treasurer**: `treasurer@society.org` / `member123`
