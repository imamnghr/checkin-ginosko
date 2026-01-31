import Header from "@/components/Header";
import { useAuthStore } from "@/store";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import React from "react";

export default function Page() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // =========================
  // MENU CONFIG (ROLE BASED)
  // =========================
  const menus = [
    {
      id: 1,
      title: "Coach Menus",
      subtitle: "This is list menu for coach",
      link: "/coach",
      icon: "checkin",
      role: "coach",
    },
    {
      id: 2,
      title: "Resepsionist Menus",
      subtitle: "Verify gate access for customers",
      link: "/recepsionist",
      icon: "gate",
      role: "resepsionis",
    },
  ];

  const filteredMenus = menus.filter(
    (menu) => !menu.role || menu.role === user?.role
  );

  const handleMenuClick = (menu) => {
    if (menu.role && menu.role !== user?.role) {
      toast.error("Menu ini tidak bisa diakses");
      return;
    }
    navigate(menu.link);
  };

  const handleLogout = () => {
    logout();
    toast.success("Berhasil logout");
    navigate("/login");
  };

  // =========================
  // ICONS (DARK FRIENDLY)
  // =========================
  const icons = {
    checkin: (
      <svg
        className="w-5 h-5 text-[#041475] dark:text-blue-300"
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
        className="w-5 h-5 text-[#041475] dark:text-blue-300"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M12 8v8" />
      </svg>
    ),
    logout: (
      <svg
        className="w-5 h-5 text-red-600 dark:text-red-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    ),
  };

  // =========================
  // RENDER
  // =========================
  return (
    <>
      <Header title="Home" />

      <main className="px-4 pt-6 pb-10 bg-gray-50 dark:bg-slate-950 min-h-[calc(100vh-56px)]">
        <h2 className="text-lg font-bold text-[#041475] dark:text-blue-300 mb-4 tracking-wide">
          MENUS
        </h2>

        <div className="flex flex-col gap-3">
          {filteredMenus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => handleMenuClick(menu)}
              className="
                w-full
                bg-white dark:bg-slate-900
                rounded-xl
                px-4 py-3
                flex items-center gap-4
                shadow-sm dark:shadow-none
                transition
                hover:shadow-md dark:hover:bg-slate-800
                active:scale-[0.98]
              "
            >
              <div className="w-10 h-10 rounded-full bg-[#041475]/10 dark:bg-blue-400/10 flex items-center justify-center">
                {icons[menu.icon]}
              </div>

              <div className="flex-1 text-left">
                <p className="text-base font-semibold text-[#041475] dark:text-blue-200 leading-tight">
                  {menu.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {menu.subtitle}
                </p>
              </div>

              <div className="text-gray-400 dark:text-gray-500 text-lg">
                ›
              </div>
            </button>
          ))}

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="
              mt-6
              w-full
              bg-white dark:bg-slate-900
              border border-red-200 dark:border-red-500/30
              rounded-xl
              px-4 py-3
              flex items-center gap-4
              transition
              hover:bg-red-50 dark:hover:bg-red-500/10
              active:scale-[0.98]
            "
          >
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
              {icons.logout}
            </div>

            <div className="flex-1 text-left">
              <p className="text-base font-semibold text-red-600 dark:text-red-400">
                Logout
              </p>
              <p className="text-sm text-red-400 dark:text-red-500/70">
                Keluar dari akun ini
              </p>
            </div>
          </button>
        </div>
      </main>
    </>
  );
}
