"use client";

import api from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useNavigate } from "react-router-dom";
import { Header, LoadingOverlay } from "@/components";

export default function Checkin() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleScan = async (detectedCodes) => {
    if (!detectedCodes?.length || loading) return;

    const code = detectedCodes[0];

    if (results.some((r) => r.token === code.rawValue)) return;

    setLoading(true);

    try {
      const res = await api.post("/checkins/verify", {
        token: code.rawValue,
      });

      const data = {
        ...res.data.data,
      };

      setResults((prev) => [...prev, data]);
    } catch (e) {
      console.log(e);
      toast.error(e.response.data.message || "failed to chek in");
    } finally {
      setLoading(false);
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
      <div className="flex flex-col items-center gap-4 p-4">
        <LoadingOverlay show={loading} />

        <div className="w-full max-w-sm overflow-hidden rounded-2xl shadow-lg">
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

        {/* List hasil scan */}
        <div className="w-full max-w-sm space-y-2">
          {results.map((item, i) => (
            <div key={i} className="rounded-xl bg-white p-3 shadow">
              <p className="text-xs text-gray-500">Nama</p>
              <p className="font-semibold">{item.name}</p>
            </div>
          ))}
        </div>

        {/* Button Next */}
        <button
          disabled={!results.length}
          onClick={handleNext}
          className="mt-4 w-full max-w-sm rounded-xl bg-[#041475] py-3 text-white disabled:opacity-50"
        >
          Next ({results.length})
        </button>
      </div>
    </>
  );
}
