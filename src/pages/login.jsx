"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { handleLogin } = useAuthStore();
  const login = async (e) => {
    e.preventDefault();

    try {
      const res = await handleLogin({ phone, password });
      if (res) {
        toast.success("Login successful");
        navigate("/home");
      }
    } catch (err) {
      console.log(err);
      if (err.response && err.response.data && err.response.data.message) {
        console.log(err.response.data)
        toast.error(err.response.data.message || "Login failed");
        return
      }
      toast.error(err || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 flex justify-center items-center h-screen">
      <form
        onSubmit={login}
        className="
          w-full
          max-w-sm
          rounded-2xl
          shadow-sm
          px-6
          py-8
          flex
          flex-col
        "
      >
        {/* Logo */}
        <img
          src="/logo.png"
          className="h-20 mx-auto mb-4 transition-all dark:invert"
          alt="Logo"
        />


        <h1 className="text-xl font-bold text-center mb-6 text-[#041475]">
          Login
        </h1>

        {/* Phone */}
        <input
          className="
            border
            border-gray-300
            p-2.5
            w-full
            mb-3
            rounded-lg
            focus:outline-none
            focus:ring-2
            focus:ring-[#041475]/40
          "
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="number"
        />

        {/* Password */}
        <input
          className="
            border
            border-gray-300
            p-2.5
            w-full
            rounded-lg
            focus:outline-none
            focus:ring-2
            focus:ring-[#041475]/40
          "
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* 🔑 CHANGE / FORGOT PASSWORD */}
        <div className="text-right mt-2 mb-4">
          <button
            type="button"
            // onClick={() => navigate}
            className="
              text-sm
              text-[#041475]
              font-medium
              hover:underline
            "
          >
            Change Password
          </button>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading || !phone || !password}
          className="
            bg-[#041475]
            text-white
            w-full
            p-2.5
            rounded-xl
            font-semibold
            transition
            hover:bg-[#041475]/90
            disabled:opacity-60
          "
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
}
