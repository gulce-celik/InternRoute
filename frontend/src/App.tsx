import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import AnalyzePage from "./pages/Analyze";
import ApplicationsPage from "./pages/Applications";
import CoverLetterPage from "./pages/CoverLetter";
import CVsPage from "./pages/CVs";
import DashboardPage from "./pages/Dashboard";
import InterviewPage from "./pages/Interview";
import JobsPage from "./pages/Jobs";
import LoginPage from "./pages/Login";
import ProfilePage from "./pages/Profile";
import RegisterPage from "./pages/Register";
import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/cvs" element={<CVsPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/interview" element={<InterviewPage />} />
              <Route path="/cover-letter" element={<CoverLetterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
