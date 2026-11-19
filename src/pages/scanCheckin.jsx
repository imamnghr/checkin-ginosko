"use client";

import api from "@/lib/api";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useNavigate } from "react-router-dom";
import { Header, LoadingOverlay } from "@/components";

const SCANNER_CONSTRAINTS = { facingMode: { ideal: "environment" } };
const COOLDOWN_MS = 1500;

export default function Checkin() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);


  // Ref = sinkron, tidak kena masalah stale state
  const isProcessingRef = useRef(false);
  const processedTokensRef = useRef(new Set()); // token sukses
  const failedTokensRef = useRef(new Map()); // token gagal -> timestamp

  const handleScan = async (detectedCodes) => {
    if (!detectedCodes?.length) return;
    if (isProcessingRef.current) return;

    const token = detectedCodes[0].rawValue;
    if (!token) return;

    // Sudah berhasil sebelumnya -> abaikan total
    if (processedTokensRef.current.has(token)) return;

    // Baru saja gagal -> beri cooldown sebelum boleh dicoba lagi
    const lastFail = failedTokensRef.current.get(token);
    if (lastFail && Date.now() - lastFail < 5000) return;

    // LOCK segera (sinkron) sebelum await apa pun
    isProcessingRef.current = true;
    setLoading(true);

    try {
      const res = await api.post("/checkins/verify", { token });

      console.log(res)

      processedTokensRef.current.add(token);
      setResults((prev) => [...prev, res.data.data]);

      toast.success(`${res.data.data?.name ?? "User"} berhasil check in`);
      if (navigator.vibrate) navigator.vibrate(100);
    } catch (e) {
      failedTokensRef.current.set(token, Date.now());
      toast.error(e.response?.data?.message || "failed to check in", {
        id: "checkin-error", // id sama -> toast tidak menumpuk
      });
    } finally {
      setLoading(false);
      // Cooldown sebelum scan berikutnya diterima
      setTimeout(() => {
        isProcessingRef.current = false;
      }, COOLDOWN_MS);
    }
  };

  const handleNext = () => {
    if (!results.length) return;
    sessionStorage.setItem("checkinResults", JSON.stringify(results));
    navigate("/coach/choose-exercise");
  };

  return (
    <>
      <Header title="Coach Checkin" />

      <div className="flex flex-col items-center gap-4 p-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
        <LoadingOverlay show={loading} />

        <div className="w-full max-w-sm overflow-hidden rounded-2xl shadow-lg bg-white dark:bg-gray-800">

          <Scanner
            onScan={handleScan}
            scanDelay={500}
            onError={(error) => {
              console.error("[QR SCANNER ERROR]", {
                kind: error?.kind,
                message: error?.message,
                cause: error?.cause,
                error,
              });

              switch (error?.kind) {
                case "permission-denied":
                  toast.error("Izin kamera ditolak. Aktifkan izin kamera browser.");
                  break;
                case "no-camera":
                  toast.error("Kamera tidak ditemukan.");
                  break;
                case "in-use":
                  toast.error("Kamera sedang digunakan aplikasi lain.");
                  break;
                case "overconstrained":
                  toast.error("Konfigurasi kamera tidak didukung perangkat.");
                  break;
                case "insecure-context":
                  toast.error("Kamera membutuhkan koneksi HTTPS.");
                  break;
                default:
                  toast.error("Terjadi kesalahan saat mengakses kamera.");
              }
            }}
            components={{
              audio: true,
              torch: true,
              finder: true,
            }}
          />

        </div>

        <div className="w-full max-w-sm space-y-2">
          {results.map((item, i) => (
            <div key={item.booking_id ?? i} className="rounded-xl p-3 shadow dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Nama</p>
              <p className="font-semibold">{item.name}</p>
            </div>
          ))}
        </div>

        <button
          disabled={!results.length}
          onClick={handleNext}
          className="mt-4 w-full max-w-sm rounded-xl py-3 text-white bg-[#041475] hover:bg-[#061a9b] dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
        >
          Next ({results.length})
        </button>
      </div>
    </>
  );
}