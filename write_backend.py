import os

code = """import os, json, base64, httpx
from pathlib import Path
from typing import Optional
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="Construction Intelligence Platform API", version="2.0.0", docs_url="/api/docs")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

def get_model():
    return genai.GenerativeModel("gemini-1.5-flash")

async def call_text(prompt):
    return get_model().generate_content(prompt).text

async def call_vision(prompt, img_bytes, mime="image/jpeg"):
    part = {"mime_type": mime, "data": base64.b64encode(img_bytes).decode()}
    return get_model().generate_content([prompt, part]).text

def safe_parse(raw):
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\\n")
        lines = lines[1:]  
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw = "\\n".join(lines)
    return json.loads(raw)
"""

os.makedirs("backend", exist_ok=True)
with open("backend/main.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Written successfully")
