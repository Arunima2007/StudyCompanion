import React from "react";

export default function Loader({ message = "Loading...", fullPage = false }) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[linear-gradient(135deg,#faf9ff_0%,#f0eeff_100%)] p-6">
        <div className="relative flex items-center justify-center">
          {/* Glowing outer ring */}
          <div className="absolute h-20 w-20 animate-ping rounded-full bg-brand/20 blur-xl" />
          
          {/* Main spinning gradient ring */}
          <div className="h-16 w-16 animate-spin rounded-full border-[6px] border-brand-soft border-t-brand" />
          
          {/* Inner pulse */}
          <div className="absolute h-8 w-8 animate-pulse rounded-full bg-brand-mid" />
        </div>
        
        {message && (
          <p className="mt-8 text-lg font-medium text-ink/80 tracking-wide animate-pulse">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-[2rem] bg-white p-12 shadow-card flex flex-col items-center justify-center min-h-[300px] border border-white/60">
      <div className="relative flex items-center justify-center">
        {/* Glow */}
        <div className="absolute h-16 w-16 animate-pulse rounded-full bg-brand-soft/60" />
        
        {/* Spinner */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-soft border-t-brand" />
      </div>
      {message && (
        <p className="mt-6 text-base font-medium text-muted tracking-wide animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
