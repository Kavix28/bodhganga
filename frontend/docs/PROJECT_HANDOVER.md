# PROMPT FOR CONTINUED DEVELOPMENT: GANGABHODH FRONTEND

## 📋 CONTEXT
You are a senior frontend engineer. Your task is to continue the development of the **GangaBodh Learning Platform** frontend. 
The backend is already implemented (Black Box). You are responsible for the **React + Vite + Tailwind CSS** frontend.

## 🚀 CURRENT STATUS
- **PHASE 1 (Architecture):** COMPLETE. Folder structure, state management (AuthContext), and routing are defined.
- **PHASE 2 (UI Design):** COMPLETE. Detailed plan for 10 mandatory pages is documented.
- **PHASE 3 (API Contracts):** COMPLETE. All endpoints and expected payloads are defined.
- **PHASE 4 (Implementation):** JUST STARTED. Infrastructure is setup.

## 🛠️ TECH STACK
- **Core:** React 18, Vite
- **Styling:** Tailwind CSS (Mobile-first)
- **Routing:** React Router DOM v6
- **API:** Axios (Service layer with interceptors setup)
- **Auth:** JWT stored in LocalStorage, managed via AuthContext.

## 📁 PROJECT STRUCTURE READY
- `/src/services/`: api.js, authService, courseService, lessonService, userService.
- `/src/context/`: AuthContext.jsx.
- `/src/hooks/`: useAuth.js.
- `/src/utils/`: validators.js, formatters.js, constants.js, storage.js.
- `/src/components/common/`: Navbar, Footer, Button, Input, Loader, ProtectedRoute.
- `/src/pages/`: Placeholder files created for all routes.

## 🎯 NEXT STEPS FOR YOU
The next task is to implement the pages one by one, ensuring high-quality, production-ready Tailwind UI.

**Start with implementation of:**
1. **Landing Page (`/src/pages/Landing.jsx`):** Follow the plan in `PHASE_2_UI_DESIGN.md`.
2. **Registration & OTP Flow:** Implement logic and UI for `Register.jsx` and `VerifyOTP.jsx`.
3. **Login Page:** Implement `Login.jsx`.

## 📖 REFERENCE FILES IN WORKSPACE
- `FRONTEND_ARCHITECTURE.md`: Technical design.
- `PHASE_2_UI_DESIGN.md`: UI/UX specifications for every page.
- `PHASE_3_API_CONTRACTS.md`: Detailed API documentation for integration.

## 📝 GLOBAL RULES
- Use **Full Files Only** when updating.
- Map code to **FR-1 to FR-16** requirement IDs.
- Ensure **Responsive Design (NFR-6)** and **Intuitive Navigation (NFR-7)**.
- Strictly follow the **Tailwind utility patterns** established in `index.css`.
