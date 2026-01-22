"use client";

import LoadingOverlay from "@/components/LoadingOverlay";
import api from "@/lib/api";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// 🔹 Debounce hook
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function ChooseExercise() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // 🔹 hasil scan QR (ARRAY)
  const [stored, setStored] = useState([]);
  const navigate = useNavigate();

  // 🔍 filters
  const [filters, setFilters] = useState({
    equipment: "",
    exercise_name: "",
    body_part: "",
    benefit: "",
  });

  // 🧠 ambil hasil scan QR
  useEffect(() => {
    const saved = sessionStorage.getItem("checkinResults");
    if (!saved) {
      navigate("/checkin");
      return;
    }
    setStored(JSON.parse(saved));
  }, [navigate]);

  // 🟦 modal state
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [repeatCount, setRepeatCount] = useState("");

  // 🔹 progress state
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const debouncedFilters = {
    equipment: useDebounce(filters.equipment),
    exercise_name: useDebounce(filters.exercise_name),
    body_part: useDebounce(filters.body_part),
    benefit: useDebounce(filters.benefit),
  };

  const observerRef = useRef(null);
  const LIMIT = 10;

  // 📡 Fetch exercise
  const getExercise = async (pageNumber = 1, reset = false) => {
    if (loading) return;

    try {
      setLoading(true);

      const response = await api.get("/exercises", {
        params: {
          page: pageNumber,
          limit: LIMIT,
          ...debouncedFilters,
        },
      });

      const newData = response.data?.data?.data || [];
      const meta = response.data?.data?.meta;

      setData((prev) => (reset ? newData : [...prev, ...newData]));
      setHasMore(pageNumber < meta.totalPages);
    } catch (error) {
      console.log("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 reload saat filter berubah
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setSelectedExercise(null);
    getExercise(1, true);
  }, [JSON.stringify(debouncedFilters)]);

  // ♾️ infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setPage((p) => p + 1),
      { threshold: 1 },
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    if (page === 1) return;
    getExercise(page);
  }, [page]);

  // 🧠 handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const openModal = (item) => {
    setSelectedExercise(item);
    setRepeatCount("");
  };

  const closeModal = () => {
    setSelectedExercise(null);
    setRepeatCount("");
  };

  console.log(stored);
  // 🚀 QUEUEING + PROGRESS
  const handleSubmit = async () => {
    if (!repeatCount || Number(repeatCount) <= 0) {
      toast.error("Masukkan jumlah yang valid");
      return;
    }

    if (!stored.length) {
      toast.error("Tidak ada data check-in");
      return;
    }

    const processQueue = async () => {
      setProgress({ current: 0, total: stored.length });

      for (let i = 0; i < stored.length; i++) {
        const user = stored[i];

        const payload = {
          user_id: user.user_id, // 🔴 dari hasil scan QR
          exercise_id: selectedExercise.id,
          times_done: Number(repeatCount),
        };

        await api.post("/user-exercises", payload);

        setProgress({
          current: i + 1,
          total: stored.length,
        });
      }
    };

    try {
      await toast.promise(processQueue(), {
        loading: `Memproses ${progress.current}/${stored.length}`,
        success: `Berhasil menyimpan ${stored.length} user 🎉`,
        error: "Gagal memproses data",
      });
      await api.patch(`/bookings/${parseFloat(stored[0].booking_id)}/complete`);
      sessionStorage.removeItem("checkinResults");
      closeModal();
      navigate("/home");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* 🔍 FILTER */}
      <div className="grid grid-cols-2  gap-2 mb-4">
        <select
          name="equipment"
          value={filters.equipment}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="">All Equipment</option>
          <option value="Reformer">Reformer</option>
          <option value="Wunda Chair">Wunda Chair</option>
          <option value="Ladder Barrel">Ladder Barrel</option>
          <option value="Tower">Tower</option>
          <option value="Spine Corrector">Spine Corrector</option>
          <option value="Cadillac">Cadillac</option>
        </select>

        <input
          name="exercise_name"
          placeholder="Exercise Name"
          className="border p-2 rounded"
          value={filters.exercise_name}
          onChange={handleChange}
        />

        <input
          name="body_part"
          placeholder="Body Part"
          className="border p-2 rounded"
          value={filters.body_part}
          onChange={handleChange}
        />

        <input
          name="benefit"
          placeholder="Benefit"
          className="border p-2 rounded"
          value={filters.benefit}
          onChange={handleChange}
        />
      </div>

      {/* 📋 LIST */}
      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.id}
            onClick={() => openModal(item)}
            className="border rounded p-3 cursor-pointer hover:bg-gray-50"
          >
            <h3 className="font-semibold">{item.exercise_name}</h3>
            <p className="text-sm text-gray-600">Equipment: {item.equipment}</p>
            <p className="text-sm text-gray-600">Body Part: {item.body_part}</p>
            <p className="text-sm text-gray-600">Benefit: {item.benefit}</p>
          </div>
        ))}
      </div>

      {hasMore && (
        <div
          ref={observerRef}
          className="h-10 flex justify-center items-center"
        >
          {loading && <LoadingOverlay show />}
        </div>
      )}

      {/* 🟦 MODAL */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm">
            <h4 className="font-semibold mb-2">
              {selectedExercise.exercise_name}
            </h4>

            <input
              type="number"
              min={1}
              placeholder="Times Done?"
              value={repeatCount}
              onChange={(e) => setRepeatCount(e.target.value)}
              className="border p-2 rounded w-full mb-3"
            />

            <div className="flex gap-2">
              <button
                onClick={closeModal}
                className="flex-1 border py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
