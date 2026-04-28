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
    console.log(detectedCodes);
    const params = {
      token: detectedCodes[0].rawValue,
    };
    try {
      const res = await api.get("/rewards/redeem", { params });
      const { data } = res.data;
      setResults(data);
      toast.success("Redeem success");
    } catch (e) {
      console.log(e);
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
              <p className="text-xs text-gray-500">Customer Name</p>
              <p className="font-semibold">{results.user.name}</p>
            </div>

            {/* Phone */}
            <div className="rounded-xl bg-white p-3 shadow">
              <p className="text-xs text-gray-500">Phone Number</p>
              <p className="font-semibold">{results.user.phone || "-"}</p>
            </div>

            {/* Booking ID */}
            <div className="rounded-xl bg-white p-3 shadow">
              <p className="text-xs text-gray-500">Reward Category</p>
              <p className="font-semibold">{results.reward.category}</p>
            </div>

            {/* Booking Type */}
            <div className="rounded-xl bg-white p-3 shadow">
              <p className="text-xs text-gray-500">Reward Name</p>
              <p className="font-semibold capitalize">
                {results.reward.item_name}
              </p>
            </div>
          </div>
        )}

        {/* Button Next */}
      </div>
    </>
  );
}
