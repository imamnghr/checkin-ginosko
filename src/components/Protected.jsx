import { useAuthStore } from "@/store";
import { Navigate } from "react-router-dom";

const ALLOWED_ROLES = ["coach", "resepsionis"];

export default function Protected({ children }) {
  const { token, user, hasHydrated, logout } = useAuthStore();

  // ⏳ tunggu persist selesai
  if (!hasHydrated) {
    return <div>Loading...</div>; // atau splash screen
  }

  // ❌ tidak ada token
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ role tidak diizinkan
  if (!ALLOWED_ROLES.includes(user.role)) {
    logout();
    return <Navigate to="/login" replace />;
  }

  // ✅ aman
  return children;
}
