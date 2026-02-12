import os
import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

# --- FIX: FORCE LOADING .ENV FROM SCRIPT DIRECTORY ---
# 1. Get the absolute path of the folder containing this script (main.py)
script_dir = Path(__file__).parent.absolute()

# 2. Build the full path to the .env file
env_path = script_dir / ".env"

# 3. Load it explicitly
print(f"--> Attempting to load .env from: {env_path}")
load_dotenv(env_path)

# 4. Debug: Check if key exists (Do not print the full key!)
API_KEY = os.getenv("GROQ_API_KEY")
if API_KEY:
    print(f"--> SUCCESS: API Key found (starts with {API_KEY[:5]}...)")
else:
    print(f"--> ERROR: .env file loaded, but GROQ_API_KEY was None.")
    print(f"    Double check your .env file format!")

# --- CONFIGURATION ---
if not API_KEY:
    raise ValueError("GROQ_API_KEY not found. See debug logs above.")

client = Groq(api_key=API_KEY)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserInput(BaseModel):
    text: str

SYSTEM_PROMPT = """
You are a Physics Engine Parser. Your goal is to convert natural language into a structured 3D physics scene.
Output valid JSON only.

JSON Structure:
{
  "scenario_type": "string",
  "gravity_mode": "EARTH" | "SPACE" | "CUSTOM",
  "objects": [
    {
      "label": "string",
      "shape": "sphere" | "box" | "wedge" | "car",
      "color": "string",
      "mass": float,
      "pos": [x, y, z],
      "vel": [vx, vy, vz],
      "args": [dim1, dim2, dim3], 
      "rotation": [x, y, z],
      "fixed": boolean
    }
  ],
  "analysis": {
    "student_mode": "string",
    "researcher_mode": "string",
    "math_steps": ["string"] 
  }
}

RULES:
1. **Researcher Mode:** Format as: "**Concept:** [Name]\\n\\n**Formula:** $[LaTeX Formula]$\\n\\n**Explanation:** [Detailed explanation]." 
   Use single dollar signs $ for LaTeX (e.g., $F = ma$).
2. **Abstract Representation:** Complex entities like 'cars' or 'planets' should be represented as labeled spheres or basic shapes for conceptual clarity.
3. **Gravity Detection:** If the prompt mentions "Star", "Orbit", "Sun", "Planet", or "Space", set gravity_mode to "SPACE".
4. **Newton's Cradle:** Ensure all balls in a collision/cradle scenario have 'fixed': false.
"""

@app.post("/parse")
async def parse_problem(input: UserInput):
    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": input.text}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"Error during AI parsing: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)