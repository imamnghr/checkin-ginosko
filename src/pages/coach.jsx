"use client";

import Header from "@/components/Header";
import { useAuthStore } from "@/store";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function Coach() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const menus = [
    {
      id: 1,
      title: "Check In participants",
      subtitle: "Scan and validate customer entry",
      link: "/coach/scan-checkin",
      icon: "checkin",
      role: "coach", // 🔑 role requirement
    },
    {
      id: 2,
      title: "List Checkin by session",
      subtitle: "This is list chekcin for coach",
      link: "/coach/list-checkin",
      icon: "gate",
    },
  ];

  const handleMenuClick = (menu) => {
    // 🔐 Role guard
    if (menu.link === "/checkin" && user?.role !== "coach") {
      toast.error("Menu ini hanya bisa diakses oleh coach");
      return;
    }

    navigate(menu.link);
  };

  const icons = {
    checkin: (
      <svg
        className="w-5 h-5 text-[#041475]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <path d="M17 11l2 2 4-4" />
      </svg>
    ),
    gate: (
      <svg
        className="w-5 h-5 text-[#041475]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M12 8v8" />
      </svg>
    ),
  };

  return (
    <>
      <Header title="Coach Menus" />

      <main className="px-4 pt-6 pb-10 bg-gray-50 min-h-[calc(100vh-56px)]">
        <h2 className="text-lg font-bold text-[#041475] mb-4 tracking-wide">
          MENUS
        </h2>

        <div className="flex flex-col gap-3">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => handleMenuClick(menu)}
              className="
                w-full
                bg-white
                rounded-xl
                shadow-sm
                px-4
                py-3
                flex
                items-center
                gap-4
                transition
                hover:shadow-md
                active:scale-[0.98]
              "
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-[#041475]/10 flex items-center justify-center">
                {icons[menu.icon]}
              </div>

              {/* Text */}
              <div className="flex-1 text-left">
                <p className="text-base font-semibold text-[#041475] leading-tight">
                  {menu.title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{menu.subtitle}</p>
              </div>

              {/* Arrow */}
              <div className="text-gray-400 text-lg">›</div>
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
