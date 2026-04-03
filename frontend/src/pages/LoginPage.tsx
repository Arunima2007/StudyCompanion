import { Link, Navigate } from "react-router-dom";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { useAuth } from "../state/auth";

export function LoginPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal">Google Sign-In</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Continue with your Google account</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          RecallFlow now uses Google authentication only. Sign in once and come
          straight back to your dashboard on your next visit.
        </p>
        <GoogleAuthButton />
        <p className="mt-5 text-sm text-slate-500">
          Need more context first?{" "}
          <Link to="/about" className="font-semibold text-teal">
            Read about the product
          </Link>
        </p>
      </div>
    </div>
  );
}
