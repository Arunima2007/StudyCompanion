import { useEffect, useRef } from "react";
import { useAuth } from "../state/auth";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function GoogleAuthButton() {
  const { googleLogin } = useAuth();
  const buttonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: { credential: string }) => {
        await googleLogin(response.credential);
        window.location.href = "/dashboard";
      }
    });

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with"
    });
  }, [googleLogin]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return <div ref={buttonRef} className="mt-4" />;
}
