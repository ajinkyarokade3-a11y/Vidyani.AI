import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/layouts/AppLayout";
import { AIMentorPage } from "@/pages/AIMentorPage";
import { ApiTestPage } from "@/pages/ApiTestPage";
import { ChatPage } from "@/pages/ChatPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { FeedbackNudgesPage } from "@/pages/FeedbackNudgesPage";
import { HomePage } from "@/pages/HomePage";
import { LearningPlanPage } from "@/pages/LearningPlanPage";
import { MockInterviewPage } from "@/pages/MockInterviewPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { ProgressPage } from "@/pages/ProgressPage";
import { QuizPage } from "@/pages/QuizPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="learning-plan" element={<LearningPlanPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="mentor" element={<AIMentorPage />} />
        <Route path="interview" element={<MockInterviewPage />} />
        <Route path="feedback" element={<FeedbackNudgesPage />} />
        <Route path="api-test" element={<ApiTestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
