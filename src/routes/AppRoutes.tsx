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
import RelaxReset from "../pages/student/RelaxReset";
import BreathingBubble from "../pages/student/BreathingBubble";
import ZenGarden from "../pages/student/ZenGarden";
import BubblePop from "../pages/student/BubblePop";
import InfinityFlow from "../pages/student/InfinityFlow";
import WellnessPage from "../pages/student/WellnessPage";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyOtp from "../pages/auth/VerifyOtp";
import ResetPassword from "../pages/auth/ResetPassword";
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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
            <Route path="relax-reset" element={<RelaxReset />} />
            <Route path="relax-reset/breathing" element={<BreathingBubble />} />
            <Route path="relax-reset/zen-garden" element={<ZenGarden />} />
            <Route path="relax-reset/bubble-pop" element={<BubblePop />} />
            <Route path="relax-reset/infinity-flow" element={<InfinityFlow />} />
            <Route path="wellness" element={<WellnessPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
