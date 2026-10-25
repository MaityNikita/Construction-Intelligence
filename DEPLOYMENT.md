# Deployment Guide

## Backend on Render

Use the existing Dockerfile in [backend/Dockerfile](backend/Dockerfile) so Render builds the app with Python 3.12.

### Render settings
- Service type: Web Service
- Runtime: Docker
- Dockerfile Path: `backend/Dockerfile`
- Root Directory: `backend`
- Auto Deploy: enabled

### Environment variables
Set these in the Render dashboard:

```env
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

If you want to allow local testing too, you can set:

```env
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5173,http://localhost:3000
```

### Health check
Render will use the FastAPI app health endpoint:

```text
https://your-render-url.onrender.com/api/health
```

---

## Frontend on Vercel

### Project settings
- Framework: Vite
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

### Environment variable
Set this in Vercel:

```env
VITE_API_BASE_URL=https://your-render-url.onrender.com/api
```

The frontend client in [frontend/src/api.js](frontend/src/api.js) reads this value automatically.

---

## Final deployment flow

1. Push the repo to GitHub.
2. Create Render web service from the backend folder.
3. Set backend env vars.
4. Deploy backend and copy the URL.
5. Create Vercel project from the frontend folder.
6. Set `VITE_API_BASE_URL` to the Render URL.
7. Redeploy frontend.

---

## Local verification
The app was verified locally with:
- backend health endpoint returning `operational`
- frontend `npm run build` passing successfully
