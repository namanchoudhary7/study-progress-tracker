import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/Layout";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { SubjectsPage } from "../features/subjects/SubjectsPage";
import { SubjectDetailPage } from "../features/subjects/SubjectDetailPage";
import { SessionsPage } from "../features/sessions/SessionsPage";
import { ReviewPage } from "../features/review/ReviewPage";
import { GoalsPage } from "../features/goals/GoalsPage";

export const router = createBrowserRouter([
  {
    path: "/",
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
]);
