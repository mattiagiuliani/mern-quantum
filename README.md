# MERN Quantum

MERN Quantum is a full-stack web application for simulating quantum circuits interactively.  
The project is fully JavaScript-based (MERN stack) and uses a local JS simulator on the backend.
It does not depend on IBM services or Python runtimes.

This app allows users to:

- Build quantum circuits using basic gates (H, X, Measure)  
- Run simulations with single or multiple shots  
- Visualize probabilistic outcomes  
- Save and manage circuits with user authentication  
- Explore circuits step-by-step (educational mode)

---

## 🚀 Features

Le feature frontend sono organizzate in `frontend/src/features`.

### Core
- Interactive Circuit Builder  
- Feature A: Multi-run nel Circuit Builder con shots configurabili (128/512/1024/4096)  
- Results visualization (probabilities)  

Implementazione Feature A:
- File principale: `frontend/src/features/feature-a-multi-run/feature-a-multi-run.js`
- Sottofile collegati (stato/costanti/utils) nella stessa cartella feature

### Additional
- Predefined circuit templates  
- Step-by-step execution  
- User authentication (JWT)  
- Dashboard for saved circuits  

---

## 🛠 Tech Stack

- Frontend: React, Tailwind CSS (optional)  
- Backend: Node.js, Express.js  
- Database: MongoDB  
- Authentication: JWT + bcrypt  
- Testing: Node.js test runner (`node --test`)  

---

📦 Install dependencies:

cd backend
npm install
cd ../frontend
npm install
git clone https://github.com/mattiagiuliani/mern-quantum.git

---

Setup environment variables:

backend/.env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=3001
QUANTUM_SEMANTICS_MODE=v2

frontend/.env
VITE_API_URL=http://localhost:3001/api

`QUANTUM_SEMANTICS_MODE` options:
- `v2` (default): simplified, stable semantics (H toggles superposition, X acts as classical NOT only on deterministic states, M collapses/output)
- `v1`: legacy behavior (quick rollback mode)

---

Run backend:

cd backend
npm run dev

---

Run frontend:

cd frontend
npm run dev

---

Open http://localhost:5173 in your browser.

---

🧪 Testing / Test

Run backend tests:

cd backend
npm test

---

Tests include:

Circuit simulation logic
Circuit API input validation
Auth endpoints (login/register)
Protected routes

---

🌍 Deployment 

Frontend: Vercel / Netlify
Backend: Render / Railway

---

👀 Screenshots: (to add!)

📄 License / Licenza

MIT License © 2026 Mattia Giuliani
