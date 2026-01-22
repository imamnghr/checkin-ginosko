import api from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";
import moment from "moment";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Header, LoadingOverlay } from "@/components";

export default function CheckGates() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (detectedCodes) => {
    if (!detectedCodes?.length || loading) return;

    const code = detectedCodes[0];

    setLoading(true);

    try {
      const res = await api.post("/checkins/reception/scan", {
        token: code.rawValue,
      });

      const data = {
        ...res.data.data,
      };

      console.log(res)

      setResults(data);
    } catch (e) {
      console.log(e);
      toast.error(e.response.data.message || "failed to chek in");
    } finally {
      setLoading(false);
    }
  };

  return (
   <>
   <Header title="Resepsionis Checkin" />
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
      {results && (
        <div className="w-full max-w-sm space-y-2">
          {/* Nama */}
          <div className="rounded-xl bg-white p-3 shadow">
            <p className="text-xs text-gray-500">Nama</p>
            <p className="font-semibold">{results.name}</p>
          </div>

          {/* Phone */}
          <div className="rounded-xl bg-white p-3 shadow">
            <p className="text-xs text-gray-500">No. HP</p>
            <p className="font-semibold">{results.phone || "-"}</p>
          </div>

          {/* Booking ID */}
          <div className="rounded-xl bg-white p-3 shadow">
            <p className="text-xs text-gray-500">Booking ID</p>
            <p className="font-semibold">{results.booking_id}</p>
          </div>

          {/* Booking Type */}
          <div className="rounded-xl bg-white p-3 shadow">
            <p className="text-xs text-gray-500">Tipe Booking</p>
            <p className="font-semibold capitalize">{results.booking_type}</p>
          </div>

          {/* Class Name */}
          <div className="rounded-xl bg-white p-3 shadow">
            <p className="text-xs text-gray-500">Class</p>
            <p className="font-semibold">{results.class_name || "-"}</p>
          </div>

          {/* Schedule Date */}
          <div className="rounded-xl bg-white p-3 shadow">
            <p className="text-xs text-gray-500">Tanggal</p>
            <p className="font-semibold">
              {moment(results.schedule_date).format("YYYY MM DD HH:mm")}
            </p>
          </div>

          {/* Message */}
          <div className="rounded-xl bg-green-50 border border-green-200 p-3">
            <p className="text-xs text-green-700">Status</p>
            <p className="font-semibold text-green-800">{results.message}</p>
          </div>
        </div>
      )}

      {/* Button Next */}
    </div>
   </>
  );
}
