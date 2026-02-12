# ConnectionLost - PhysLab Pro ⚛️

**PhysLab Pro** is an AI-powered physics simulation engine developed for the **VIBE Coding Hackathon 2k26**. [cite_start]It addresses **Problem Statement 2** [cite: 8] [cite_start]by bridging the gap between abstract textual word problems and intuitive conceptual visualization[cite: 9, 13].

## 📽️ MVP Showcase (Video & Images)

**View our Demo Videos and Images here:** 👉 https://drive.google.com/drive/folders/1ZkLK-TzE5wnna27H6r4ut80RqhvAxSCq?usp=drive_link
_(Note: Link set to "Anyone with the link can view")_

---

## 📝 Project Description

[cite_start]STEM learners often struggle to visualize abstract concepts like motion and forces from static text[cite: 9, 10]. [cite_start]PhysLab Pro intelligently interprets natural language physics problems, extracts key parameters, and generates dynamic 3D visualizations that can be modified in real-time[cite: 11, 12].

### [cite_start]Core Capabilities[cite: 17]:

- [cite_start]**AI Understanding:** Natural language parsing of complex physics statements[cite: 18].
- [cite_start]**Structured Conversion:** Turning unstructured text into 3D physics data[cite: 19, 20].
- [cite_start]**Interactive Simulations:** Real-time parameter manipulation and visual feedback[cite: 21, 23, 24].
- [cite_start]**Conceptual Clarity:** Representing complex entities as labeled dots/spheres for intuitive learning[cite: 16].

## 💻 Tech Stack

- **Frontend:** React 19, Vite, Three.js (React Three Fiber), Tailwind CSS, Katex (Math Rendering).
- **Backend:** FastAPI (Python), Uvicorn, Groq SDK.
- **LLM:** Llama 3.3 70B (via Groq Cloud).

## 🧪 Experiment Gallery (Example Prompts)

The following prompts are included in our MVP showcase to demonstrate the engine's logical depth:

### 1. Kinematics & Ramps

- "A green wedge is fixed at (0, 0, 0) with rotation (0, 0, 0.5). A red ball starts at (-2, 5, 0)."
- "A blue ball of mass 1 starts at (-5, 10, 0). A red ball of mass 1 starts at (5, 10, 0)."

### 2. Collisions & Newton's Cradle

- "A row of 3 red balls fixed at (0,0,0), (2,0,0), (4,0,0). A blue ball moves towards them from (-5, 0, 0) with velocity (10, 0, 0)."

[Image of Newton's cradle diagram]

- "A red ball of mass 2 is thrown at a blue car fixed at (0, 0, 0). The ball starts at (0, 10, 0)."

### 3. Orbital Mechanics (Space Mode)

- "A yellow sun of mass 1000 fixed at (0, 0, 0). A blue earth of mass 10 starts at (50, 0, 0) with velocity (0, 0, 15)."
- "A yellow sun of mass 2000 is fixed at (0, 0, 0) with radius 2. A red comet starts at (-100, 0, 45) with velocity (40, 0, 0). Space gravity."

[Image of planetary orbit diagram]

### 4. Multi-Body & Chaos

- "A ball starts form (5,0,0) with a velocity of (-15,0,0). Another ball start from (-5,0,0) with a velocity of (15,0,0). And a third ball start from (0,0,5) with a velocity of (0,0,-15)."
- **Binary Star System:** "Two yellow stars, both with mass 20. Star A at (-10, 0, 0) with velocity (0, 0, 5). Star B at (10, 0, 0) with velocity (0, 0, -5)."
- **Chaotic 3-Body:** "Three stars, all with mass 40. Red Star at (0, 10, 0) with velocity (15, 0, 0). Blue Star at (-10, -8, 0) with velocity (-10, 0, -10). Green Star at (10, -8, 0) with velocity (-5, 0, 15)."

## 📦 Dependencies & Setup

- **Dependencies:** `fastapi`, `uvicorn`, `groq`, `python-dotenv`, `react-three-fiber`, `react-latex-next`, `katex`.
- **Important Instructions:** Ensure you have a `.env` file in the `backend/` directory containing your `GROQ_API_KEY`.

### Installation

1. **Backend:** `cd backend` -> `pip install -r requirements.txt` -> `python main.py`
2. **Frontend:** `cd frontend` -> `npm install --legacy-peer-deps` -> `npm run dev`
