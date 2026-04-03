import { Link, Navigate } from "react-router-dom";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { useAuth } from "../state/auth";

export function SignupPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-coral">Get Started</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Create your account with Google</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Your Google account handles sign-up and sign-in now, so there is no separate
          email and password setup to manage.
        </p>
        <GoogleAuthButton />
        <p className="mt-5 text-sm text-slate-500">
          Already exploring?{" "}
          <Link to="/login" className="font-semibold text-teal">
            Continue with Google
          </Link>
        </p>
      </div>
    </div>
  );
}
