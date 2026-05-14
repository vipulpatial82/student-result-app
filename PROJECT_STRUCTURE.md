# Project Structure - Student Result App

```
student-result-app/
│
├── frontend/                          (React.js Application)
│   ├── src/
│   │   ├── App.js                     (Main component)
│   │   ├── App.test.js                (Component tests)
│   │   ├── App.css                    (Styling)
│   │   ├── index.js                   (React entry point)
│   │   ├── index.css                  (Global styles)
│   │   ├── reportWebVitals.js         (Performance metrics)
│   │   └── setupTests.js              (Test configuration)
│   ├── public/
│   │   ├── index.html                 (Main HTML file)
│   │   ├── manifest.json              (PWA manifest)
│   │   └── robots.txt                 (SEO robots file)
│   ├── build/                         (Production build output)
│   │   ├── index.html
│   │   ├── asset-manifest.json
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   └── static/
│   │       ├── css/
│   │       │   └── main.903ffaf9.css
│   │       └── js/
│   │           ├── main.6bcf022f.js
│   │           ├── 453.20359781.chunk.js
│   │           └── main.6bcf022f.js.LICENSE.txt
│   ├── package.json                   (Frontend dependencies)
│   ├── README.md                       (Frontend documentation)
│   └── Dockerfile                     (Frontend container)
│
├── backend/                           (Node.js + Express API)
│   ├── index.js                       (Main server file with APIs)
│   ├── package.json                   (Backend dependencies)
│   ├── .env                           (API keys & secrets - GITIGNORED)
│   │   ├── GEMINI_API_KEY            (Google Generative AI)
│   │   └── GROK_API_KEY              (Grok AI fallback)
│   ├── node_modules/                 (Dependencies - GITIGNORED)
│   └── Dockerfile                     (Backend container)
│
├── .github/
│   └── workflows/
│       └── ci.yml                     (GitHub Actions pipeline)
│
├── docker-compose.yml                 (Multi-container orchestration)
├── Jenkinsfile                        (Jenkins CI/CD pipeline)
├── .gitignore                         (Files to ignore in Git)
└── README.md                          (Project documentation)

```

## Directory Descriptions

### Frontend (`/frontend`)
- **React.js application** for student result display
- **API Integration**: Calls `/api/result` and `/api/suggestion` endpoints
- **Build Output**: Pre-built assets in `/build` directory for production deployment

### Backend (`/backend`)
- **Node.js + Express server** running on port 5000
- **Main APIs**:
  - `POST /api/result` - Calculate student results
  - `POST /api/suggestion` - Generate AI suggestions (Gemini → Grok fallback)
- **Environment Variables** in `.env`:
  - `GEMINI_API_KEY` - Primary AI model (quota limited)
  - `GROK_API_KEY` - Fallback AI model

### CI/CD
- **Jenkinsfile** - Jenkins pipeline for automated builds & deployments
- **.github/workflows/ci.yml** - GitHub Actions for CI/CD
- **docker-compose.yml** - Orchestrates frontend & backend containers

## Key Technologies

| Component | Technology |
|-----------|-----------|
| Frontend  | React.js |
| Backend   | Node.js + Express |
| APIs      | Gemini 2.0 (Primary), Grok 1 (Fallback) |
| DevOps    | Docker, Docker Compose, Jenkins, GitHub Actions |

## Getting Started

```bash
# Clone repository
git clone https://github.com/vipulpatial82/student-result-app.git

# Start with Docker Compose
docker-compose up -d

# Or build & run manually
docker build -t student-result-frontend ./frontend
docker build -t student-result-backend ./backend

docker run -d -p 3000:3000 --name frontend student-result-frontend
docker run -d -p 5000:5000 --name backend \
  -e GEMINI_API_KEY=your_key \
  -e GROK_API_KEY=your_key \
  student-result-backend
```

## Ports

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
