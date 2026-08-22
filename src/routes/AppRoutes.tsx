import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";

import StudentDashboard from "../pages/student/StudentDashboard";
import AICompanion from "../pages/student/AICompanion";
import CheckIn from "../pages/student/CheckIn";
import Professionals from "../pages/student/Professionals";
import Chat from "../pages/student/Chat";
import Recovery from "../pages/student/Recovery";
import SOS from "../pages/student/SOS";
import Profile from "../pages/student/Profile";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default page */}
        <Route path="/" element={<Navigate to="/student" replace />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="ai" element={<AICompanion />} />
            <Route path="check-in" element={<CheckIn />} />
            <Route path="professionals" element={<Professionals />} />
            <Route path="chat" element={<Chat />} />
            <Route path="recovery" element={<Recovery />} />
            <Route path="sos" element={<SOS />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
