import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TourOverlay from "./TourOverlay";

export default function AppLayout() {
  const { user, logout, finishTour } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tour") === "true" && !user?.hasCompletedTour) {
      setTourOpen(true);
    }
  }, [location.search, user?.hasCompletedTour]);

  async function handleFinishTour() {
    await finishTour();
    setTourOpen(false);
    navigate(location.pathname, { replace: true });
  }

  return (
    <div className="min-h-screen bg-brand-soft text-ink">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="text-2xl font-semibold">Flashr</div>
          <nav className="hidden gap-6 text-sm font-medium md:flex">
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "text-brand" : "text-muted"}>Dashboard</NavLink>
            <NavLink to="/study-room" className={({ isActive }) => isActive ? "text-brand" : "text-muted"}>My Study Room</NavLink>
            <NavLink to="/progress" className={({ isActive }) => isActive ? "text-brand" : "text-muted"}>Progress</NavLink>
          </nav>
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((current) => !current)} className="flex items-center gap-3 rounded-full bg-brand-soft px-3 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                {user?.name?.slice(0, 2)?.toUpperCase() ?? "FL"}
              </div>
              <span className="hidden text-sm font-medium md:block">{user?.name}</span>
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-14 w-48 rounded-3xl border border-brand-mid bg-white p-2 shadow-card">
                <NavLink to="/profile" className="block rounded-2xl px-4 py-3 text-sm hover:bg-brand-soft">Profile</NavLink>
                <button type="button" onClick={logout} className="block w-full rounded-2xl px-4 py-3 text-left text-sm hover:bg-brand-soft">Logout</button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Outlet />
      </main>
      {tourOpen ? <TourOverlay onSkip={() => setTourOpen(false)} onFinish={handleFinishTour} /> : null}
    </div>
  );
}
