import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { NotFoundPage } from "../components/NotFoundPage";
import { AgentPage } from "../features/agent/AgentPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { SubjectsPage } from "../features/subjects/SubjectsPage";
import { SubjectDetailPage } from "../features/subjects/SubjectDetailPage";
import { SessionsPage } from "../features/sessions/SessionsPage";
import { ReviewPage } from "../features/review/ReviewPage";
import { GoalsPage } from "../features/goals/GoalsPage";
import { PlansPage } from "../features/plans/PlansPage";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/auth/SignupPage";
import { VerifyEmailPage } from "../features/auth/VerifyEmailPage";
import { LandingPage } from "../features/landing/LandingPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { SharePage } from "../features/share/SharePage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "/share/:token", element: <SharePage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "agent", element: <AgentPage /> },
          { path: "subjects", element: <SubjectsPage /> },
          { path: "subjects/:id", element: <SubjectDetailPage /> },
          { path: "sessions", element: <SessionsPage /> },
          { path: "review", element: <ReviewPage /> },
          { path: "goals", element: <GoalsPage /> },
          { path: "plans", element: <PlansPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
