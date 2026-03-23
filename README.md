# 🚀 Gen AI Job Preparation Web Application

Welcome to the **Gen AI Job Preparation Web Application**! This is a smart, full-stack platform designed to help candidates prepare for their dream jobs. By feeding in a target Job Description and your profile (via a PDF Resume or a quick self-description), the app uses Google's latest **Gemini AI** to generate a highly personalized, actionable interview strategy.

---

## ✨ What Does It Do?

Getting ready for an interview can be overwhelming. This app acts as your personal AI career coach:
1. **Upload your Resume** (PDF/DOCX) and paste the **Job Description**.
2. **Hit Generate.** Behind the scenes, the app perfectly parses your resume and queries the Gemini AI model.
3. **Get Your Strategy!** Within seconds, you'll receive a detailed dashboard containing:
   - 🎯 **Match Score:** A percentage showing how well your profile fits the role.
   - 💻 **Technical Questions:** Custom-tailored coding or domain-specific questions you are likely to be asked, complete with the intention behind the question and how to answer it.
   - 🤝 **Behavioral Questions:** Culture-fit and situational questions modeled after the job requirements.
   - ⚠️ **Skill Gaps:** Honest feedback on what you're missing compared to the job description (Low/Medium/High severity).
   - 📅 **Day-by-Day Preparation Plan:** A structured, actionable roadmap to get you interview-ready.

*Want to take it with you? The app also supports generating and downloading a crisp, ATS-friendly PDF version of your optimized resume!*

---

## 🛠️ Built With

This project is separated into a modern backend API and a fast, responsive frontend, running seamlessly side by side.

### Frontend
* **React 18** (via Vite) for a lightning-fast UI.
* **React Router** for seamless dashboard navigation.
* **Axios** with global contexts for dynamic, secure API requesting.
* **SCSS** for beautiful, custom styling (Vibrant dark mode with crisp animations!).

### Backend
* **Node.js & Express.js** providing the robust REST API framework.
* **MongoDB & Mongoose** for storing user sessions and generated interview reports.
* **Google Generative AI (Gemini 2.5 Flash)** for blistering fast and accurate AI reasoning.
* **Puppeteer** for high-fidelity HTML-to-PDF rendering.
* **JWT & bcryptjs** for secure, cookie-based user authentication.
* **pdf-parse** & Multer for safe, memory-buffered file extraction.

---

## 🚀 Getting Started Locally

Want to run this on your own machine? It's easy!

### 1. Clone the repository
```bash
git clone https://github.com/MAyurDongare12/Gen-AI-Job-Preparation-Web-Application.git
cd Gen-AI-Job-Preparation-Web-Application
```

### 2. Set Up the Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd Backend
   npm install
   ```
2. Create a `.env` file in the `Backend` directory and add your secrets:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   GOOGLE_GENAI_API_KEY=your_gemini_api_key
   ```
3. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Set Up the Frontend
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd Frontend
   npm install
   ```
2. Start the frontend development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser and start generating your strategy!

---

## 🤝 Contributing
Contributions, issues, and feature requests are always welcome! Feel free to check the issues page if you want to contribute.

## 📝 License
This project is open source and available under the [ISC License](LICENSE).

---
*Built with ❤️ and AI.*
