import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, signInWithGoogle } = useAuth();
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google || !buttonRef.current || !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const data = await signInWithGoogle(response.credential);
            navigate(data.isNewUser ? "/dashboard?tour=true" : "/dashboard", { replace: true });
          } catch {
            setError("Google sign-in failed. Check your frontend and backend Google client IDs.");
          }
        }
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 320
      });
    };

    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [navigate, signInWithGoogle]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#faf9ff_0%,#f0eeff_100%)] px-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-card">
        <div className="text-center">
          <div className="text-4xl font-semibold text-brand">Flashr</div>
          <h1 className="mt-6 text-3xl font-semibold">Sign in with Google</h1>
          <p className="mt-3 text-muted">No passwords. The backend creates or reuses your account and sets a secure `httpOnly` cookie.</p>
        </div>
        <div className="mt-8 flex justify-center">
          <div ref={buttonRef} />
        </div>
        {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <p className="mt-4 text-center text-sm text-red-500">Set `VITE_GOOGLE_CLIENT_ID` to render the Google sign-in button.</p>
        ) : null}
        {error ? <p className="mt-4 text-center text-sm text-red-500">{error}</p> : null}
      </div>
    </div>
  );
}
