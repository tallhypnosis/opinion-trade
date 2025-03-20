# 🏆 Opinion Trade

A full-stack real-time trading platform that allows users to view live event odds, place trades, and track their trade history.

## 📌 Tech Stack
- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (MongoDB Atlas)
- **Real-time Updates:** WebSockets (Socket.io)
- **Authentication:** JWT

---

## 🚀 Setup & Run Locally

### **1️⃣ Clone the Repository**
```bash
git clone git@github.com:tallhypnosis/opinion-trade.git
cd opinion-trade


🖥 Backend Setup
2️⃣ Navigate to Backend
bash
Copy
Edit
cd backend
3️⃣ Install Dependencies
bash
Copy
Edit
npm install
4️⃣ Configure Environment Variables
Create a .env file in the backend/ directory:

env
Copy
Edit
PORT=5000
MONGO_URI=mongodb+srv://<your_mongodb_url>
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
5️⃣ Run the Backend
bash
Copy
Edit
npm start
or using nodemon (for auto-reloading):

bash
Copy
Edit
npm run dev
🔹 The backend will start on http://localhost:5000

🌐 Frontend Setup
6️⃣ Navigate to Frontend
bash
Copy
Edit
cd ../frontend
7️⃣ Install Dependencies
bash
Copy
Edit
npm install
8️⃣ Configure Environment Variables
Create a .env.local file in the frontend/ directory:

env
Copy
Edit
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
9️⃣ Run the Frontend
bash
Copy
Edit
npm run dev
🔹 The frontend will start on http://localhost:3000

📡 WebSocket Setup
WebSocket connection is automatically handled when the backend is running.
Events and trades will update in real-time.


Backend is hosted on render with url https://opinion-trade-backend.onrender.com

Frontend is hosted on vercel with url https://opinion-trade.vercel.app
