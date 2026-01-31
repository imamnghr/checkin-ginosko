"use client";

import api from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";
import moment from "moment";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Header, LoadingOverlay } from "@/components";
import { useNavigate } from "react-router-dom";

export default function CheckGates() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleScan = async (detectedCodes) => {
    if (!detectedCodes?.length || loading) return;

    const code = detectedCodes[0];
    setLoading(true);

    try {
      const res = await api.post("/checkins/reception/scan", {
        token: code.rawValue,
      });

      setResults({ ...res.data.data });
    } catch (e) {
      console.log(e);
      toast.error(e.response?.data?.message || "failed to check in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Resepsionis Checkin" />

      <div className="flex flex-col items-center gap-4 p-4 min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <LoadingOverlay show={loading} />

        {/* QR Scanner */}
        <div className="w-full max-w-sm overflow-hidden rounded-2xl shadow-lg bg-white dark:bg-gray-800">
          <Scanner
            onScan={handleScan}
            onError={(error) => console.error(error)}
            constraints={{ facingMode: "environment" }}
            components={{
              audio: true,
              torch: true,
              finder: true,
            }}
          />
        </div>

        {/* Result */}
        {results && (
          <div className="w-full max-w-sm space-y-2">
            {/* Nama */}
            <div className="rounded-xl p-3 shadow bg-white dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Nama</p>
              <p className="font-semibold">{results.name}</p>
            </div>

            {/* Phone */}
            <div className="rounded-xl p-3 shadow bg-white dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">No. HP</p>
              <p className="font-semibold">{results.phone || "-"}</p>
            </div>

            {/* Booking ID */}
            <div className="rounded-xl p-3 shadow bg-white dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Booking ID
              </p>
              <p className="font-semibold">{results.booking_id}</p>
            </div>

            {/* Booking Type */}
            <div className="rounded-xl p-3 shadow bg-white dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tipe Booking
              </p>
              <p className="font-semibold capitalize">
                {results.session_type}
              </p>
            </div>

            {/* Class */}
            <div className="rounded-xl p-3 shadow bg-white dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Class</p>
              <p className="font-semibold">{results.class_type || "-"}</p>
            </div>

            {/* Schedule */}
            <div className="rounded-xl p-3 shadow bg-white dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tanggal
              </p>
              <p className="font-semibold">
                {moment(results.schedule_date).format("YYYY MM DD HH:mm")}
              </p>
            </div>

            {/* Status */}
            <div className="rounded-xl p-3 border bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700">
              <p className="text-xs text-green-700 dark:text-green-300">
                Status
              </p>
              <p className="font-semibold text-green-800 dark:text-green-200">
                {results.message}
              </p>
            </div>

            {/* Done Button */}
            <button
              onClick={() => navigate("/")}
              className="
                mt-5 w-full rounded-xl p-3 text-white
                bg-[#041475] hover:bg-[#061a9b]
                dark:bg-blue-700 dark:hover:bg-blue-600
              "
            >
              Done
            </button>
          </div>
        )}
      </div>
    </>
  );
}
