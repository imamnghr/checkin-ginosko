"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import {Header} from "@/components";

export default function CoachCheckinsPage() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);

  // filters
  const [classType, setClassType] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [note, setNote] = useState("");
  const [noteId, setNoteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);

  const loaderRef = useRef(null);

  // 🔹 fetch checkins
  const fetchData = async (reset = false) => {
    if (loading || (!hasNext && !reset)) return;

    setLoading(true);

    const res = await api.get("/checkins/coach", {
      params: {
        page: reset ? 1 : page,
        limit: 10,
        class_type: classType || undefined,
        session_type: sessionType || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
    });

    const result = res.data.data;

    setData((prev) => (reset ? result.data : [...prev, ...result.data]));
    setHasNext(result.meta.hasNext);
    setPage((p) => (reset ? 2 : p + 1));
    setLoading(false);
  };

  // 🔹 infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) fetchData();
    });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [page, hasNext]);

  // 🔹 refetch filter
  useEffect(() => {
    setPage(1);
    setHasNext(true);
    fetchData(true);
  }, [classType, sessionType, startDate, endDate]);

  // 🔹 open modal & fetch note
  const openNoteModal = async (item) => {
    setSelectedCheckin(item);
    setShowNoteModal(true);
    setNote("");
    setNoteId(null);

    if (!item.has_note) return;

    try {
      setLoadingNote(true);

      const res = await api.get(`/coach-notes/checkin/${item.checkin_id}`);
      console.log(res)
      const noteData = res.data.data;

      setNote(noteData.note);
      setNoteId(noteData.id);
    } finally {
      setLoadingNote(false);
    }
  };

  // 🔹 save note (POST / PUT)
  const handleSave = async () => {
    if (!note) return;

    try {
      setSaving(true);

      if (noteId) {
        // UPDATE
        await api.put(`/coach-notes/${noteId}`, { note });
      } else {
        // CREATE
        await api.post("/coach-notes", {
          checkin_id: selectedCheckin.checkin_id,
          note,
        });
      }

      // optimistic update
      setData((prev) =>
        prev.map((c) =>
          c.checkin_id === selectedCheckin.checkin_id
            ? { ...c, has_note: true }
            : c,
        ),
      );

      setShowNoteModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title="List Check-in" />

      <div className="p-6 max-w-3xl mx-auto">
        {/* FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <select
            className="h-10 border rounded-md px-3 text-sm"
            value={classType}
            onChange={(e) => setClassType(e.target.value)}
          >
            <option value="">All Classes</option>
            <option value="REFORMER">REFORMER</option>
            <option value="CADILLAC">CADILLAC</option>
            <option value="WUNDA CHAIR">WUNDA CHAIR</option>
            <option value="TOWER">TOWER</option>
            <option value="LADDER BARREL">LADDER BARREL</option>
            <option value="SPINNE CORRECTOR">SPINNE CORRECTOR</option>
          </select>

          <select
            className="h-10 border rounded-md px-3 text-sm"
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
          >
            <option value="">All Sessions</option>
            <option value="group">Group</option>
            <option value="private">Private</option>
          </select>

          <input
            type="date"
            className="h-10 border rounded-md px-3 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <input
            type="date"
            className="h-10 border rounded-md px-3 text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {data.map((item, i) => (
            <div
              key={i}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.class_type} • {item.session_type}
                </p>
              </div>

              <button
                onClick={() => openNoteModal(item)}
                className={`text-xs px-3 py-1 rounded-full border ${
                  item.has_note
                    ? "border-green-400 text-green-700"
                    : "border-yellow-400 text-yellow-700"
                }`}
              >
                {item.has_note ? "View Note" : "Add Note"}
              </button>
            </div>
          ))}
        </div>

        {hasNext && (
          <div
            ref={loaderRef}
            className="h-10 flex justify-center items-center"
          >
            {loading && <p className="text-sm text-gray-400">Loading...</p>}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showNoteModal && selectedCheckin && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-md p-5">
            <h2 className="font-semibold text-lg mb-1">Coach Note</h2>

            <p className="text-sm text-gray-500 mb-3">
              {selectedCheckin.name} • {selectedCheckin.class_type}
            </p>

            {loadingNote ? (
              <p className="text-sm text-gray-400">Loading note...</p>
            ) : (
              <textarea
                rows={4}
                className="w-full border rounded-md p-3 text-sm"
                placeholder="Tulis catatan coach..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 text-sm border rounded-md"
              >
                Cancel
              </button>

              <button
                disabled={!note || saving}
                onClick={handleSave}
                className="px-4 py-2 text-sm rounded-md bg-black text-white disabled:opacity-50"
              >
                {noteId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
