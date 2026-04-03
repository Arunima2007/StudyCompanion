import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AboutPage } from "./pages/AboutPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProgressPage } from "./pages/ProgressPage";
import { ReviewPage } from "./pages/ReviewPage";
import { SignupPage } from "./pages/SignupPage";
import { StudyRoomPage } from "./pages/StudyRoomPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/study-room", element: <StudyRoomPage /> },
          { path: "/study-room/:subjectId", element: <StudyRoomPage /> },
          { path: "/progress", element: <ProgressPage /> },
          { path: "/profile", element: <ProfilePage /> },
          { path: "/review", element: <ReviewPage /> }
        ]
      }
    ]
  },
  { path: "*", element: <Navigate to="/" replace /> }
]);
