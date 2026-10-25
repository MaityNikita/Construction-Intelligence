import os

os.makedirs("backend", exist_ok=True)

MAIN_PY = r"""
import os, json, base64, httpx
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

app = FastAPI(
    title="Construction Intelligence Platform API",
    description="AI-Powered Multimodal Construction Intelligence Platform",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def get_model(name="gemini-1.5-flash"):
    return genai.GenerativeModel(name)


async def call_text(prompt: str) -> str:
    return get_model().generate_content(prompt).text


async def call_vision(prompt: str, img_bytes: bytes, mime: str = "image/jpeg") -> str:
    part = {"mime_type": mime, "data": base64.b64encode(img_bytes).decode()}
    return get_model().generate_content([prompt, part]).text


def safe_parse(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    if raw.endswith("```"):
        raw = raw[:-3]
    return json.loads(raw.strip())


# ---------- Models ----------

class ProjectPlanRequest(BaseModel):
    project_name: str
    project_type: str
    location: str
    budget: str
    duration: str
    team_size: str
    description: str
    special_requirements: Optional[str] = ""

class ValuationRequest(BaseModel):
    property_type: str
    location: str
    area_sqft: float
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    age_years: int
    amenities: Optional[str] = ""
    condition: str
    nearby_facilities: Optional[str] = ""

class KnowledgeRequest(BaseModel):
    question: str
    category: Optional[str] = "general"

class WeatherAdvisoryRequest(BaseModel):
    city: str
    activity: str
    project_phase: Optional[str] = "general"

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""

class MaterialEstimateRequest(BaseModel):
    project_type: str
    area_sqft: float
    floors: int = 1
    quality_grade: str = "standard"
    location: str = "India"
    special_features: Optional[str] = ""


# ---------- Health ----------

@app.get("/api/health")
async def health():
    return {
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "ai_configured": bool(GEMINI_API_KEY),
        "weather_configured": bool(OPENWEATHER_API_KEY),
    }


# ---------- 1. Safety Analysis ----------

@app.post("/api/safety/analyze")
async def analyze_safety(
    image: UploadFile = File(...),
    site_type: str = Form("construction"),
    additional_context: str = Form(""),
):
    try:
        img = await image.read()
        mime = image.content_type or "image/jpeg"
        prompt = f"""You are an expert construction site safety inspector with 20+ years experience.
Analyze the image and return ONLY valid JSON matching this schema exactly:
{{
  "overall_safety_score": 75,
  "risk_level": "HIGH",
  "summary": "...",
  "hazards_detected": [{{"hazard":"...","severity":"HIGH","location":"...","description":"...","immediate_action":"..."}}],
  "ppe_compliance": {{"helmets":"COMPLIANT","safety_vests":"NON-COMPLIANT","safety_boots":"NOT_VISIBLE","harnesses":"NOT_APPLICABLE","gloves":"NOT_VISIBLE","overall_ppe_score":60}},
  "positive_observations": ["..."],
  "immediate_actions": ["..."],
  "recommendations": [{{"priority":"HIGH","category":"...","recommendation":"...","timeline":"immediate"}}],
  "regulatory_compliance": {{"osha_concerns":["..."],"estimated_fine_risk":"MEDIUM"}},
  "worker_count_estimate": null,
  "environmental_conditions": "..."
}}

Site Type: {site_type}
Context: {additional_context or "None"}
Return only JSON, no markdown."""
        raw = await call_vision(prompt, img, mime)
        data = safe_parse(raw)
        return JSONResponse({"success": True, "data": data})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------- 2. Crack Detection ----------

@app.post("/api/crack/analyze")
async def analyze_crack(
    image: UploadFile = File(...),
    structure_type: str = Form("concrete wall"),
    structure_age: str = Form("unknown"),
    location: str = Form(""),
):
    try:
        img = await image.read()
        mime = image.content_type or "image/jpeg"
        prompt = f"""You are a structural engineering expert specializing in crack analysis.
Analyze the image and return ONLY valid JSON:
{{
  "cracks_detected": true,
  "structural_integrity_score": 70,
  "damage_severity": "MODERATE",
  "immediate_risk": false,
  "crack_details": [{{"type":"hairline","width_estimate":"<0.1mm","length_estimate":"5cm","orientation":"vertical","location":"...","probable_cause":"...","severity":"LOW"}}],
  "damage_patterns": [{{"pattern":"...","description":"...","urgency":"MONITOR"}}],
  "root_cause_analysis": {{"primary_cause":"...","contributing_factors":["..."],"structural_implications":"..."}},
  "repair_recommendations": [{{"method":"...","materials":"...","urgency":"PLANNED","estimated_cost_range":"₹5000-₹20000","diy_possible":true,"professional_required":false}}],
  "monitoring_plan": {{"frequency":"weekly","indicators_to_watch":["..."],"escalation_triggers":["..."]}},
  "expert_consultation_required": false,
  "evacuation_recommended": false,
  "summary": "..."
}}

Structure: {structure_type}, Age: {structure_age}, Location: {location or "Not specified"}
Return only JSON, no markdown."""
        raw = await call_vision(prompt, img, mime)
        data = safe_parse(raw)
        return JSONResponse({"success": True, "data": data})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------- 3. Real Estate Valuation ----------

@app.post("/api/valuation/estimate")
async def estimate_valuation(request: ValuationRequest):
    try:
        prompt = f"""You are a certified real estate appraiser expert in Indian markets.
Return ONLY valid JSON for this property valuation:
{{
  "estimated_value": {{"primary": 5000000,"low_estimate": 4500000,"high_estimate": 5500000,"currency":"INR","per_sqft_value":5000}},
  "market_analysis": {{"market_trend":"RISING","trend_percentage":8,"demand_level":"HIGH","liquidity":"MEDIUM","price_driver":"..."}},
  "valuation_factors": [{{"factor":"...","impact":"POSITIVE","weight":"HIGH","description":"..."}}],
  "comparable_properties": [{{"description":"...","estimated_value":4800000,"key_difference":"..."}}],
  "investment_analysis": {{"roi_potential":"GOOD","rental_yield_estimate":"3-4% annually","appreciation_forecast_5yr":"20-30%","recommendation":"BUY","investment_grade":"B"}},
  "value_enhancement": [{{"improvement":"...","estimated_cost":"₹200000","value_increase":"₹400000","roi":"100%"}}],
  "risk_factors": ["...","..."],
  "legal_considerations": ["..."],
  "confidence_score": 78,
  "methodology": "...",
  "summary": "..."
}}

Property: {request.property_type}, Location: {request.location}, Area: {request.area_sqft} sqft
Bedrooms: {request.bedrooms}, Bathrooms: {request.bathrooms}, Age: {request.age_years} yrs
Condition: {request.condition}, Amenities: {request.amenities or "Standard"}
Return only JSON, no markdown."""
        raw = await call_text(prompt)
        data = safe_parse(raw)
        return JSONResponse({"success": True, "data": data})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------- 4. Project Planning ----------

@app.post("/api/planning/generate")
async def generate_plan(request: ProjectPlanRequest):
    try:
        prompt = f"""You are a senior construction project manager with 25+ years experience.
Create a comprehensive project plan and return ONLY valid JSON:
{{
  "project_overview": {{"name":"{request.project_name}","type":"{request.project_type}","feasibility_score":82,"complexity_level":"MEDIUM","risk_assessment":"MEDIUM"}},
  "phases": [
    {{"phase_number":1,"phase_name":"Pre-Construction","duration":"4 weeks","start_week":1,"end_week":4,"description":"...","key_activities":["...","..."],"deliverables":["..."],"resources_needed":{{"workforce":"...","equipment":["..."],"materials":["..."]}},"milestones":["..."],"dependencies":[],"budget_percentage":10}},
    {{"phase_number":2,"phase_name":"Foundation","duration":"6 weeks","start_week":5,"end_week":10,"description":"...","key_activities":["..."],"deliverables":["..."],"resources_needed":{{"workforce":"...","equipment":["..."],"materials":["..."]}},"milestones":["..."],"dependencies":["Phase 1"],"budget_percentage":25}},
    {{"phase_number":3,"phase_name":"Superstructure","duration":"12 weeks","start_week":11,"end_week":22,"description":"...","key_activities":["..."],"deliverables":["..."],"resources_needed":{{"workforce":"...","equipment":["..."],"materials":["..."]}},"milestones":["..."],"dependencies":["Phase 2"],"budget_percentage":40}},
    {{"phase_number":4,"phase_name":"Finishing","duration":"8 weeks","start_week":23,"end_week":30,"description":"...","key_activities":["..."],"deliverables":["..."],"resources_needed":{{"workforce":"...","equipment":["..."],"materials":["..."]}},"milestones":["..."],"dependencies":["Phase 3"],"budget_percentage":25}}
  ],
  "budget_breakdown": {{"total":"{request.budget}","categories":[{{"category":"Civil Works","amount":"...","percentage":45,"subcategories":["Foundation","Structure"]}},{{"category":"Finishing","amount":"...","percentage":25,"subcategories":["Interiors","Painting"]}},{{"category":"MEP","amount":"...","percentage":20,"subcategories":["Electrical","Plumbing"]}}],"contingency":"10%","cash_flow_schedule":"..."}},
  "team_structure": {{"total_size":{request.team_size},"roles":[{{"role":"Project Manager","count":1,"responsibilities":["..."],"phase_involvement":"All phases"}},{{"role":"Site Engineer","count":2,"responsibilities":["..."],"phase_involvement":"Phase 2-4"}}],"key_personnel":["Project Manager","Safety Officer"]}},
  "risk_register": [{{"risk":"Material price escalation","category":"cost","probability":"MEDIUM","impact":"HIGH","risk_score":6,"mitigation":"...","contingency":"..."}}],
  "quality_plan": {{"standards":["IS 456","IS 875"],"inspection_points":["..."],"testing_requirements":["Cube test","Slump test"],"acceptance_criteria":["..."]}},
  "procurement_plan": [{{"item":"Cement","type":"material","lead_time":"1 week","estimated_cost":"...","procurement_method":"rate contract"}}],
  "sustainability_measures": ["...","..."],
  "regulatory_requirements": ["Building permit","Environmental clearance"],
  "communication_plan": {{"stakeholder_meetings":"Weekly","progress_reports":"Fortnightly","escalation_matrix":"..."}},
  "success_metrics": ["On-time delivery","Within budget","Quality compliance"],
  "critical_path": ["Site clearance","Foundation","Structural frame","Roof slab"],
  "executive_summary": "..."
}}

Project: {request.project_name}, Type: {request.project_type}, Location: {request.location}
Budget: {request.budget}, Duration: {request.duration}, Team: {request.team_size}
Description: {request.description}
Return only JSON, no markdown."""
        raw = await call_text(prompt)
        data = safe_parse(raw)
        return JSONResponse({"success": True, "data": data})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------- 5. Weather Advisory ----------

@app.post("/api/weather/advisory")
async def weather_advisory(request: WeatherAdvisoryRequest):
    try:
        weather_ctx = f"Using AI knowledge for typical weather patterns in {request.city}."
        if OPENWEATHER_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    r = await client.get(
                        "https://api.openweathermap.org/data/2.5/forecast",
                        params={"q": request.city, "appid": OPENWEATHER_API_KEY, "units": "metric", "cnt": 8},
                    )
                    if r.status_code == 200:
                        forecasts = r.json().get("list", [])[:5]
                        weather_ctx = f"Live data for {request.city}:\n"
                        for f in forecasts:
                            weather_ctx += f"- {f['dt_txt']}: {f['main']['temp']}C, {f['weather'][0]['description']}\n"
            except Exception:
                pass

        prompt = f"""You are a senior construction site manager expert in weather advisory.
Return ONLY valid JSON:
{{
  "city": "{request.city}",
  "advisory_date": "{datetime.now().strftime('%Y-%m-%d')}",
  "overall_recommendation": "PROCEED_WITH_CAUTION",
  "work_suitability_score": 72,
  "current_conditions": {{"temperature":"28-32C","conditions":"Partly cloudy","wind_speed":"15 km/h","humidity":"65%","visibility":"GOOD"}},
  "5_day_forecast_summary": [
    {{"day":"Today","date":"{datetime.now().strftime('%Y-%m-%d')}","conditions":"...","temperature_range":"25-33C","construction_suitability":"GOOD","key_concern":"..."}},
    {{"day":"Tomorrow","date":"...","conditions":"...","temperature_range":"24-31C","construction_suitability":"FAIR","key_concern":"..."}},
    {{"day":"Day 3","date":"...","conditions":"...","temperature_range":"22-29C","construction_suitability":"GOOD","key_concern":"None"}},
    {{"day":"Day 4","date":"...","conditions":"...","temperature_range":"21-28C","construction_suitability":"EXCELLENT","key_concern":"None"}},
    {{"day":"Day 5","date":"...","conditions":"...","temperature_range":"23-30C","construction_suitability":"GOOD","key_concern":"..."}}
  ],
  "activity_specific_advice": {{"activity":"{request.activity}","feasibility":"FEASIBLE","optimal_hours":"6 AM - 11 AM, 4 PM - 7 PM","precautions":["...","..."],"equipment_considerations":["..."]}},
  "safety_alerts": [{{"alert_type":"heat","severity":"MEDIUM","description":"...","required_action":"..."}}],
  "material_handling_advice": [{{"material":"Concrete","weather_impact":"...","recommendation":"..."}}],
  "productivity_forecast": {{"expected_efficiency":"75%","factors_affecting":["Heat","Humidity"],"schedule_impact":"Minor delays possible"}},
  "emergency_protocols": ["...","..."],
  "summary": "..."
}}

City: {request.city}, Activity: {request.activity}, Phase: {request.project_phase}
{weather_ctx}
Return only JSON, no markdown."""
        raw = await call_text(prompt)
        data = safe_parse(raw)
        return JSONResponse({"success": True, "data": data})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------- 6. AI Assistant Chat ----------

@app.post("/api/assistant/chat")
async def chat(request: ChatRequest):
    try:
        prompt = f"""You are ARIA (AI Resource & Intelligence Assistant), expert in construction management, civil engineering, and building practices with knowledge of Indian IS codes, OSHA standards, BIS specifications, and international best practices.

Context: {request.context or "None"}
User: {request.message}

Return ONLY valid JSON:
{{
  "response": "## Answer\\n\\nDetailed markdown response here...",
  "category": "general",
  "confidence": 90,
  "follow_up_suggestions": ["...","...","..."],
  "relevant_standards": ["IS 456:2000","..."],
  "quick_facts": [{{"fact":"...","value":"..."}}]
}}
Return only JSON, no markdown wrapper."""
        raw = await call_text(prompt)
        data = safe_parse(raw)
        return JSONResponse({"success": True, "data": data})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"response": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------- 7. Knowledge Base ----------

@app.post("/api/knowledge/query")
async def knowledge(request: KnowledgeRequest):
    try:
        prompt = f"""You are a construction knowledge base expert covering civil engineering, architecture, and project management.
Category: {request.category}
Question: {request.question}

Return ONLY valid JSON:
{{
  "answer": "Comprehensive technical answer...",
  "category": "{request.category}",
  "key_points": ["...","...","...","..."],
  "technical_specifications": [{{"parameter":"...","value":"...","standard":"IS 456:2000"}}],
  "related_topics": ["...","..."],
  "best_practices": ["...","...","..."],
  "common_mistakes": ["...","..."],
  "case_studies": [{{"title":"...","description":"...","lesson":"..."}}],
  "resources": ["...","..."],
  "confidence": 88
}}
Return only JSON, no markdown."""
        raw = await call_text(prompt)
        data = safe_parse(raw)
        return JSONResponse({"success": True, "data": data})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------- 8. Site Report ----------

@app.post("/api/report/generate")
async def site_report(
    image: Optional[UploadFile] = File(None),
    project_name: str = Form(""),
    date: str = Form(""),
    activities: str = Form(""),
    workers_present: str = Form(""),
    weather_conditions: str = Form(""),
    issues_observed: str = Form(""),
    progress_percentage: str = Form(""),
):
    try:
        img_bytes = None
        mime = "image/jpeg"
        if image:
            img_bytes = await image.read()
            mime = image.content_type or "image/jpeg"

        prompt = f"""You are a professional construction site engineer generating a daily site report.
Project: {project_name or "Construction Project"}
Date: {date or datetime.now().strftime("%Y-%m-%d")}
Activities: {activities or "General construction activities"}
Workers: {workers_present or "Not specified"}
Weather: {weather_conditions or "Not specified"}
Issues: {issues_observed or "None"}
Progress: {progress_percentage or "N/A"}%
Image: {"Provided - analyze for observations" if img_bytes else "Not provided"}

Return ONLY valid JSON:
{{
  "report_header": {{"project_name":"{project_name or "Project"}","report_date":"{date or datetime.now().strftime('%Y-%m-%d')}","report_number":"RPT-{datetime.now().strftime('%Y%m%d')}-001","prepared_by":"AI Construction Intelligence System","weather":"{weather_conditions or "Not specified"}","temperature":"..."}},
  "executive_summary": "...",
  "work_completed": [{{"activity":"...","status":"IN_PROGRESS","completion_percentage":60,"quantity":"...","remarks":"..."}}],
  "workforce_summary": {{"total_present":{workers_present or "null"},"skilled":null,"unskilled":null,"supervisory":null,"absenteeism_notes":"..."}},
  "material_consumption": [{{"material":"Concrete M25","quantity_used":"15","unit":"m3","stock_level":"adequate"}}],
  "equipment_utilization": [{{"equipment":"Concrete Mixer","status":"OPERATIONAL","hours_worked":8,"remarks":"..."}}],
  "safety_observations": {{"incidents":0,"near_misses":0,"safety_score":85,"observations":["..."],"corrective_actions":["..."]}},
  "quality_checks": [{{"item":"Concrete slump test","result":"PASS","remarks":"..."}}],
  "issues_and_problems": [{{"issue":"...","severity":"LOW","action_taken":"...","responsible":"Site Engineer","target_resolution":"..."}}],
  "next_day_plan": ["...","...","..."],
  "image_observations": "{'Analyzing site image for observations' if img_bytes else 'No image provided'}",
  "overall_progress": {{"planned":"{progress_percentage or "N/A"}%","actual":"{progress_percentage or "N/A"}%","variance":"On track","projected_completion":"..."}},
  "recommendations": ["...","..."]
}}
Return only JSON, no markdown."""
        if img_bytes:
            raw = await call_vision(prompt, img_bytes, mime)
        else:
            raw = await call_text(prompt)
        data = safe_parse(raw)
        return JSONResponse({"success": True, "data": data})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------- 9. Material Cost Estimator ----------

@app.post("/api/materials/estimate")
async def estimate_materials(request: MaterialEstimateRequest):
    try:
        prompt = f"""You are a quantity surveyor with expertise in Indian construction material costs (2024-2025 market rates).
Project: {request.project_type}, Area: {request.area_sqft} sqft, Floors: {request.floors}
Quality: {request.quality_grade}, Location: {request.location}
Features: {request.special_features or "Standard"}

Return ONLY valid JSON:
{{
  "project_summary": {{"type":"{request.project_type}","total_area":{request.area_sqft},"built_up_area":{request.area_sqft * 1.1},"quality_grade":"{request.quality_grade}"}},
  "material_estimates": [
    {{"category":"Structural","materials":[{{"material":"Cement OPC 53","quantity":50,"unit":"bags","unit_rate":380,"total_cost":19000,"brand_recommendations":["Ultratech","ACC"],"notes":"..."}}],"category_total":150000}},
    {{"category":"Finishing","materials":[{{"material":"Wall Putty","quantity":200,"unit":"kg","unit_rate":35,"total_cost":7000,"brand_recommendations":["Birla White","JK"],"notes":"..."}}],"category_total":80000}},
    {{"category":"MEP","materials":[{{"material":"Electrical Wiring","quantity":500,"unit":"meters","unit_rate":25,"total_cost":12500,"brand_recommendations":["Havells","Polycab"],"notes":"..."}}],"category_total":60000}}
  ],
  "labor_estimate": {{"total_labor_cost":200000,"labor_breakdown":[{{"trade":"Mason","quantity":5,"unit":"person","rate":800,"total":120000}}]}},
  "cost_summary": {{"material_cost":290000,"labor_cost":200000,"overhead":49000,"contingency_10pct":53900,"total_project_cost":592900,"cost_per_sqft":1186}},
  "cost_optimization_tips": ["...","...","..."],
  "market_insights": "...",
  "validity": "Estimates valid for 30 days from generation date"
}}
Return only JSON, no markdown."""
        raw = await call_text(prompt)
        data = safe_parse(raw)
        return JSONResponse({"success": True, "data": data})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
"""

with open("backend/main.py", "w", encoding="utf-8") as f:
    f.write(MAIN_PY.strip())
print("backend/main.py written successfully")
