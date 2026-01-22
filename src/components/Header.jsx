"use client";

import { useNavigate } from "react-router-dom";

export default function Header({ title = "", showBack = true, onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) return onBack();
    navigate(-1);
  };

  return (
    <header className="w-full h-14 flex items-center px-4 bg-[#F7E3D2] text-white shadow-md">
      {/* LEFT */}
      <div className="w-10">
        {showBack && (
          <button
            onClick={handleBack}
            className="text-[#041475] text-xl font-bold"
            aria-label="Back"
          >
            ←
          </button>
        )}
      </div>

      {/* CENTER */}
      <div className="flex-1 text-center">
        <h1 className="text-base text-[#041475] font-semibold tracking-wide">
          {title}
        </h1>
      </div>

      {/* RIGHT */}
      <div className="w-10 flex justify-end">
        <img src="/logo-g.png" alt="Logo" />
      </div>
    </header>
  );
}
