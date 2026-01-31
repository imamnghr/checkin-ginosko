"use client";

import { useNavigate } from "react-router-dom";

export default function Header({ title = "", showBack = true, onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) return onBack();
    navigate(-1);
  };

  return (
    <header
      className="
        w-full h-14 flex items-center px-4
        bg-[#F7E3D2]
        dark:bg-slate-900
        shadow-md dark:shadow-black/40
      "
    >
      {/* LEFT */}
      <div className="w-10">
        {showBack && (
          <button
            onClick={handleBack}
            className="
              text-[#041475]
              dark:text-blue-300
              text-xl font-bold
            "
            aria-label="Back"
          >
            ←
          </button>
        )}
      </div>

      {/* CENTER */}
      <div className="flex-1 text-center">
        <h1
          className="
            text-base font-semibold tracking-wide
            text-[#041475]
            dark:text-blue-200
          "
        >
          {title}
        </h1>
      </div>

      {/* RIGHT */}
      <div className="w-10 flex justify-end">
        <img
          src="/logo-g.png"
          alt="Logo"
          className="block dark:invert h-6"
        />

        
      </div>
    </header>
  );
}
