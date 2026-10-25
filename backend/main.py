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

Path("uploads").mkdir(exist_ok=True)


def get_model(name="gemini-1.5-flash"):
    return genai.GenerativeModel(name)


async def call_text(prompt: str) -> str:
    return get_model().generate_content(prompt).text


async def call_vision(prompt: str, img: bytes, mime: str = "image/jpeg") -> str:
    part = {"mime_type": mime, "data": base64.b64encode(img).decode()}
    return get_model().generate_content([prompt, part]).text


def safe_parse(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


# ─── Pydantic Models ──────────────────────────────────────────────────────────

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


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "ai_configured": bool(GEMINI_API_KEY),
        "weather_configured": bool(OPENWEATHER_API_KEY),
    }


# ─── 1. Safety Analysis ───────────────────────────────────────────────────────

@app.post("/api/safety/analyze")
async def analyze_safety(
    image: UploadFile = File(...),
    site_type: str = Form("construction"),
    additional_context: str = Form(""),
):
    try:
        img = await image.read()
        mime = image.content_type or "image/jpeg"
        schema = (
            '{"overall_safety_score":75,"risk_level":"HIGH","summary":"...",'
            '"hazards_detected":[{"hazard":"...","severity":"HIGH","location":"...","description":"...","immediate_action":"..."}],'
            '"ppe_compliance":{"helmets":"COMPLIANT","safety_vests":"NON-COMPLIANT","safety_boots":"NOT_VISIBLE","harnesses":"NOT_APPLICABLE","gloves":"NOT_VISIBLE","overall_ppe_score":60},'
            '"positive_observations":["..."],"immediate_actions":["..."],'
            '"recommendations":[{"priority":"HIGH","category":"...","recommendation":"...","timeline":"immediate"}],'
            '"regulatory_compliance":{"osha_concerns":["..."],"estimated_fine_risk":"MEDIUM"},'
            '"worker_count_estimate":null,"environmental_conditions":"..."}'
        )
        prompt = (
            "You are an expert construction site safety inspector with 20+ years experience.\n"
            f"Site Type: {site_type}\nContext: {additional_context or 'None'}\n"
            "Analyze the image for ALL safety hazards, PPE compliance, and risks.\n"
            "Return ONLY valid JSON matching this exact structure (fill real values):\n" + schema
        )
        raw = await call_vision(prompt, img, mime)
        return JSONResponse({"success": True, "data": safe_parse(raw)})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ─── 2. Crack Detection ───────────────────────────────────────────────────────

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
        schema = (
            '{"cracks_detected":true,"structural_integrity_score":70,"damage_severity":"MODERATE","immediate_risk":false,'
            '"crack_details":[{"type":"hairline","width_estimate":"<0.1mm","length_estimate":"5cm","orientation":"vertical","location":"...","probable_cause":"...","severity":"LOW"}],'
            '"damage_patterns":[{"pattern":"...","description":"...","urgency":"MONITOR"}],'
            '"root_cause_analysis":{"primary_cause":"...","contributing_factors":["..."],"structural_implications":"..."},'
            '"repair_recommendations":[{"method":"...","materials":"...","urgency":"PLANNED","estimated_cost_range":"Rs.5000-20000","diy_possible":true,"professional_required":false}],'
            '"monitoring_plan":{"frequency":"weekly","indicators_to_watch":["..."],"escalation_triggers":["..."]},'
            '"expert_consultation_required":false,"evacuation_recommended":false,"summary":"..."}'
        )
        prompt = (
            "You are a structural engineering expert specializing in crack analysis.\n"
            f"Structure: {structure_type}, Age: {structure_age}, Location: {location or 'Not specified'}\n"
            "Thoroughly analyze cracks and structural damage in the image.\n"
            "Return ONLY valid JSON:\n" + schema
        )
        raw = await call_vision(prompt, img, mime)
        return JSONResponse({"success": True, "data": safe_parse(raw)})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ─── 3. Real Estate Valuation ─────────────────────────────────────────────────

@app.post("/api/valuation/estimate")
async def estimate_valuation(request: ValuationRequest):
    try:
        prompt = (
            "You are a certified real estate appraiser with expertise in Indian property markets.\n"
            f"Property: {request.property_type}, Location: {request.location}, Area: {request.area_sqft} sqft\n"
            f"Bedrooms: {request.bedrooms}, Bathrooms: {request.bathrooms}, Age: {request.age_years} years\n"
            f"Condition: {request.condition}, Amenities: {request.amenities or 'Standard'}\n"
            f"Nearby: {request.nearby_facilities or 'Not specified'}\n"
            "Return ONLY valid JSON with these keys: estimated_value (with primary, low_estimate, high_estimate, currency:INR, per_sqft_value), "
            "market_analysis (market_trend, trend_percentage, demand_level, liquidity, price_driver), "
            "valuation_factors (array of factor, impact, weight, description), "
            "comparable_properties (array of description, estimated_value, key_difference), "
            "investment_analysis (roi_potential, rental_yield_estimate, appreciation_forecast_5yr, recommendation, investment_grade), "
            "value_enhancement (array of improvement, estimated_cost, value_increase, roi), "
            "risk_factors (array), legal_considerations (array), confidence_score, methodology, summary. "
            "Use realistic INR values based on Indian market rates 2024-2025."
        )
        raw = await call_text(prompt)
        return JSONResponse({"success": True, "data": safe_parse(raw)})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ─── 4. Project Planning ──────────────────────────────────────────────────────

@app.post("/api/planning/generate")
async def generate_plan(request: ProjectPlanRequest):
    try:
        prompt = (
            "You are a senior construction project manager with 25+ years experience.\n"
            f"Project: {request.project_name} ({request.project_type})\n"
            f"Location: {request.location}, Budget: {request.budget}, Duration: {request.duration}\n"
            f"Team Size: {request.team_size}, Description: {request.description}\n"
            f"Special Requirements: {request.special_requirements or 'None'}\n"
            "Return ONLY valid JSON with: project_overview (name, type, feasibility_score, complexity_level, risk_assessment), "
            "phases (array with phase_number, phase_name, duration, start_week, end_week, description, key_activities, deliverables, resources_needed, milestones, dependencies, budget_percentage), "
            "budget_breakdown (total, categories array, contingency, cash_flow_schedule), "
            "team_structure (total_size, roles array, key_personnel), "
            "risk_register (array of risk, category, probability, impact, risk_score, mitigation, contingency), "
            "quality_plan (standards, inspection_points, testing_requirements, acceptance_criteria), "
            "procurement_plan (array), sustainability_measures (array), regulatory_requirements (array), "
            "communication_plan, success_metrics (array), critical_path (array), executive_summary. "
            "Be comprehensive with at least 5 project phases and detailed risk register."
        )
        raw = await call_text(prompt)
        return JSONResponse({"success": True, "data": safe_parse(raw)})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ─── 5. Weather Advisory ──────────────────────────────────────────────────────

@app.post("/api/weather/advisory")
async def weather_advisory(request: WeatherAdvisoryRequest):
    try:
        weather_ctx = f"Using AI knowledge for typical weather in {request.city}."
        if OPENWEATHER_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    r = await client.get(
                        "https://api.openweathermap.org/data/2.5/forecast",
                        params={"q": request.city, "appid": OPENWEATHER_API_KEY, "units": "metric", "cnt": 8},
                    )
                    if r.status_code == 200:
                        fcs = r.json().get("list", [])[:5]
                        weather_ctx = f"Live forecast for {request.city}: "
                        weather_ctx += " | ".join(
                            f"{f['dt_txt']}: {f['main']['temp']}C {f['weather'][0]['description']}"
                            for f in fcs
                        )
            except Exception:
                pass

        prompt = (
            "You are a construction site safety officer with expertise in weather-based advisories.\n"
            f"City: {request.city}, Activity: {request.activity}, Phase: {request.project_phase}\n"
            f"Weather data: {weather_ctx}\n"
            "Return ONLY valid JSON with: city, advisory_date, overall_recommendation (PROCEED/PROCEED_WITH_CAUTION/DELAY/HALT), "
            "work_suitability_score (0-100), current_conditions (temperature, conditions, wind_speed, humidity, visibility), "
            "5_day_forecast_summary (array of day, date, conditions, temperature_range, construction_suitability, key_concern), "
            "activity_specific_advice (activity, feasibility, optimal_hours, precautions, equipment_considerations), "
            "safety_alerts (array of alert_type, severity, description, required_action), "
            "material_handling_advice (array), productivity_forecast (expected_efficiency, factors_affecting, schedule_impact), "
            "emergency_protocols (array), summary."
        )
        raw = await call_text(prompt)
        return JSONResponse({"success": True, "data": safe_parse(raw)})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ─── 6. AI Assistant Chat ─────────────────────────────────────────────────────

@app.post("/api/assistant/chat")
async def chat(request: ChatRequest):
    try:
        prompt = (
            "You are ARIA (AI Resource & Intelligence Assistant), expert in construction management, "
            "civil engineering, Indian IS codes, OSHA standards, BIS specifications.\n"
            f"Previous context: {request.context or 'None'}\n"
            f"User: {request.message}\n"
            "Return ONLY valid JSON with: response (detailed markdown answer), category "
            "(safety/materials/planning/structural/regulatory/cost/general), confidence (0-100), "
            "follow_up_suggestions (array of 3 questions), relevant_standards (array), "
            "quick_facts (array of fact and value objects)."
        )
        raw = await call_text(prompt)
        return JSONResponse({"success": True, "data": safe_parse(raw)})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"response": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ─── 7. Knowledge Base ────────────────────────────────────────────────────────

@app.post("/api/knowledge/query")
async def knowledge(request: KnowledgeRequest):
    try:
        prompt = (
            "You are a comprehensive construction knowledge expert.\n"
            f"Category: {request.category}\nQuestion: {request.question}\n"
            "Return ONLY valid JSON with: answer (comprehensive technical answer), category, "
            "key_points (array of 4+ points), technical_specifications (array of parameter/value/standard objects), "
            "related_topics (array), best_practices (array), common_mistakes (array), "
            "case_studies (array of title/description/lesson), resources (array), confidence (0-100)."
        )
        raw = await call_text(prompt)
        return JSONResponse({"success": True, "data": safe_parse(raw)})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ─── 8. Site Report ───────────────────────────────────────────────────────────

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

        today = datetime.now().strftime("%Y-%m-%d")
        rnum = f"RPT-{datetime.now().strftime('%Y%m%d')}-001"
        prompt = (
            "You are a professional construction site engineer writing a detailed daily site report.\n"
            f"Project: {project_name or 'Construction Project'}, Date: {date or today}\n"
            f"Activities: {activities or 'General construction activities'}\n"
            f"Workers: {workers_present or 'Not specified'}, Weather: {weather_conditions or 'Not specified'}\n"
            f"Issues: {issues_observed or 'None'}, Progress: {progress_percentage or 'N/A'}%\n"
            f"Site image: {'provided - analyze it' if img_bytes else 'not provided'}\n"
            "Return ONLY valid JSON with: report_header (project_name, report_date, report_number, prepared_by, weather, temperature), "
            "executive_summary, work_completed (array of activity/status/completion_percentage/quantity/remarks), "
            "workforce_summary (total_present, skilled, unskilled, supervisory, absenteeism_notes), "
            "material_consumption (array), equipment_utilization (array), "
            "safety_observations (incidents, near_misses, safety_score, observations, corrective_actions), "
            "quality_checks (array), issues_and_problems (array), next_day_plan (array), "
            "image_observations, overall_progress (planned, actual, variance, projected_completion), recommendations (array)."
        )
        if img_bytes:
            raw = await call_vision(prompt, img_bytes, mime)
        else:
            raw = await call_text(prompt)
        return JSONResponse({"success": True, "data": safe_parse(raw)})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


# ─── 9. Material Estimator ────────────────────────────────────────────────────

@app.post("/api/materials/estimate")
async def estimate_materials(request: MaterialEstimateRequest):
    try:
        prompt = (
            "You are a quantity surveyor with expertise in Indian construction material costs (2024-2025 market rates).\n"
            f"Project: {request.project_type}, Area: {request.area_sqft} sqft, Floors: {request.floors}\n"
            f"Quality: {request.quality_grade}, Location: {request.location}\n"
            f"Special Features: {request.special_features or 'Standard'}\n"
            "Return ONLY valid JSON with: project_summary (type, total_area, built_up_area, quality_grade), "
            "material_estimates (array of category with materials array each having material/quantity/unit/unit_rate/total_cost/brand_recommendations/notes, and category_total), "
            "labor_estimate (total_labor_cost, labor_breakdown array), "
            "cost_summary (material_cost, labor_cost, overhead, contingency_10pct, total_project_cost, cost_per_sqft), "
            "cost_optimization_tips (array), market_insights, validity. "
            "Include at minimum: Structural, Masonry, Finishing, Flooring, MEP, External Works categories. "
            "Use realistic 2024-2025 Indian market prices in INR."
        )
        raw = await call_text(prompt)
        return JSONResponse({"success": True, "data": safe_parse(raw)})
    except json.JSONDecodeError:
        return JSONResponse({"success": True, "data": {"raw_analysis": raw, "parse_error": True}})
    except Exception as e:
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
