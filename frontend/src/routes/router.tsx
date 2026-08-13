import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { SubjectsPage } from "../features/subjects/SubjectsPage";
import { SubjectDetailPage } from "../features/subjects/SubjectDetailPage";
import { SessionsPage } from "../features/sessions/SessionsPage";
import { ReviewPage } from "../features/review/ReviewPage";
import { GoalsPage } from "../features/goals/GoalsPage";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/auth/SignupPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "subjects", element: <SubjectsPage /> },
          { path: "subjects/:id", element: <SubjectDetailPage /> },
          { path: "sessions", element: <SessionsPage /> },
          { path: "review", element: <ReviewPage /> },
          { path: "goals", element: <GoalsPage /> },
        ],
      },
    ],
  },
]);
