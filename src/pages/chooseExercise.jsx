"use client";

import LoadingOverlay from "@/components/LoadingOverlay";
import api from "@/lib/api";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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

  const [stored, setStored] = useState([]);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    equipment: "",
    exercise_name: "",
    body_part: "",
    benefit: "",
  });

  const [selectedExercises, setSelectedExercises] = useState([]);

  useEffect(() => {
    const saved = sessionStorage.getItem("checkinResults");
    if (!saved) {
      navigate("/checkin");
      return;
    }
    setStored(JSON.parse(saved));
  }, [navigate]);

  const debouncedFilters = {
    equipment: useDebounce(filters.equipment),
    exercise_name: useDebounce(filters.exercise_name),
    body_part: useDebounce(filters.body_part),
    benefit: useDebounce(filters.benefit),
  };

  const observerRef = useRef(null);
  const LIMIT = 10;

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

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setSelectedExercises([]);
    getExercise(1, true);
  }, [JSON.stringify(debouncedFilters)]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const toggleExercise = (item) => {
    setSelectedExercises((prev) => {
      const exists = prev.find((e) => e.id === item.id);
      if (exists) {
        return prev.filter((e) => e.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleSubmit = async () => {
    if (!selectedExercises.length) {
      toast.error("Select at least 1 exercise");
      return;
    }

    if (!stored.length) {
      toast.error("No check-in data");
      return;
    }

    try {
      for (let i = 0; i < stored.length; i++) {
        const user = stored[i];

        await api.post("/user-exercises", {
          user_id: user.user_id,
          exercise_ids: selectedExercises.map((e) => e.id),
        });
      }

      await api.patch(
        `/bookings/${parseFloat(stored[0].booking_id)}/complete`,
      );

      sessionStorage.removeItem("checkinResults");
      toast.success("Checkin Participant successfully")
      navigate("/home");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save exercises");
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto bg-transparent">
      {/* FILTER */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <select
          name="equipment"
          value={filters.equipment}
          onChange={handleChange}
          className="border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
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
          className="border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          value={filters.exercise_name}
          onChange={handleChange}
        />

        <input
          name="body_part"
          placeholder="Body Part"
          className="border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          value={filters.body_part}
          onChange={handleChange}
        />

        <input
          name="benefit"
          placeholder="Benefit"
          className="border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          value={filters.benefit}
          onChange={handleChange}
        />
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleExercise(item)}
            className={`
              border rounded p-3 cursor-pointer
              bg-white dark:bg-slate-900
              hover:bg-gray-50 dark:hover:bg-slate-800
              dark:border-slate-700
              ${selectedExercises.some((e) => e.id === item.id)
                ? "ring-2 ring-blue-500"
                : ""
              }
            `}
          >
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {item.exercise_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Equipment: {item.equipment}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Body Part: {item.body_part}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Benefit: {item.benefit}
            </p>
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={observerRef} className="h-10 flex justify-center items-center">
          {loading && <LoadingOverlay show />}
        </div>
      )}

      {/* SUBMIT BUTTON */}
      {selectedExercises.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 px-4 max-w-sm mx-auto">
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
          >
            Submit ({selectedExercises.length} Exercises)
          </button>
        </div>
      )}
    </div>
  );
}
