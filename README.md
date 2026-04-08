# MERN Quantum

MERN Quantum is a full-stack web application for simulating quantum circuits interactively.  
Inspired by [IBM Quantum Composer](https://quantum-computing.ibm.com/), this app allows users to:

- Build quantum circuits using basic gates (H, X, Measure)  
- Run simulations with single or multiple shots  
- Visualize probabilistic outcomes  
- Save and manage circuits with user authentication  
- Explore circuits step-by-step (educational mode)

---

## 🚀 Features

### Core
- Interactive Circuit Builder  
- Run Simulation (single/multi-run)  
- Results visualization (probabilities)  

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
- Testing: Jest (backend tests)  

---

📦 Install dependencies:

cd backend
npm install
cd ../frontend
npm install
git clone https://github.com/yourusername/mern-quantum.git

---

Setup environment variables:

MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000

---

Run backend:

cd backend
npm run dev

---

Run frontend:

cd frontend
npm start

---

Open http://localhost:3000 in your browser.

---

🧪 Testing / Test

Run backend tests:

cd backend
npm test

---

Tests include:

Circuit simulation logic
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
