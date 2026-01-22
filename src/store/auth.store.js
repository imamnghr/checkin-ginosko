import api from "@/lib/api";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      hasHydrated: false,

      setHasHydrated: () => set({ hasHydrated: true }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      handleLogin: async (body) => {
        try {
          set({ loading: true });

          const res = await api.post("/auth/login", body);
          const { data } = res.data;

          const allowedRoles = ["coach", "resepsionis"];
          if (!allowedRoles.includes(data.user.role)) {
            throw ("You are not authorized");
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
          });

          return true;
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated();
      },
    },
  ),
);
