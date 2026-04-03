import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { Button } from "./Button";
import { AmbientGlow } from "./AmbientGlow";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/study-room", label: "My Study Room" },
  { to: "/progress", label: "Progress" },
  { to: "/profile", label: "Profile" }
];

export function AppShell() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.14),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.08),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef3f9_100%)]">
      <AmbientGlow />
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <button
            className="font-display text-2xl font-bold text-ink transition duration-300 hover:-translate-y-0.5 hover:text-teal"
            onClick={() => navigate("/dashboard")}
          >
            RecallFlow
          </button>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-full px-4 py-2 text-sm font-semibold transition duration-300",
                    isActive
                      ? "bg-ink text-white shadow-[0_14px_28px_rgba(17,24,39,0.14)]"
                      : "text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-ink">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                logout();
                navigate("/", { replace: true });
              }}
            >
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="relative mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}
