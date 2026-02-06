import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Header } from "@/components";

export default function CoachCheckinsPage() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
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

  // 🆕 image
  const [image, setImage] = useState(null);

  const loaderRef = useRef(null);
  const fileInputRef = useRef(null);


  const fetchData = async (reset = false) => {
    if (loading || (!hasNext && !reset)) return;

    setLoading(true);

    const res = await api.get("/checkins/coach", {
      params: {
        page: reset ? 1 : page,
        limit: 10,
        class_type: classType || undefined,
        session_type: "private",
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

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) fetchData();
    });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [page, hasNext]);

  useEffect(() => {
    setPage(1);
    setHasNext(true);
    fetchData(true);
  }, [classType, sessionType, startDate, endDate]);

  const openNoteModal = async (item) => {
    setSelectedCheckin(item);
    setShowNoteModal(true);
    setNote("");
    setNoteId(null);
    setImage(null);

    if (!item.has_note) return;

    try {
      setLoadingNote(true);
      const res = await api.get(`/coach-notes/checkin/${item.checkin_id}`);
      setNote(res.data.data.note);
      setNoteId(res.data.data.id);
    } finally {
      setLoadingNote(false);
    }
  };

  console.log(image)

  const handleSave = async () => {
    if (!note) return;

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("note", note);
      formData.append("checkin_id", selectedCheckin.checkin_id);

      if (image) {
        formData.append("image", image);
      }

      if (noteId) {
        await api.put(`/coach-notes/${noteId}`, formData);
      } else {
        await api.post("/coach-notes", formData);
      }

      setData((prev) =>
        prev.map((c) =>
          c.checkin_id === selectedCheckin.checkin_id
            ? { ...c, has_note: true }
            : c
        )
      );

      setShowNoteModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title="List Check-in" />

      <div className="p-6 max-w-3xl mx-auto bg-white dark:bg-gray-900 min-h-screen">
        {/* FILTER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <select
            className="h-10 border rounded-md px-3 text-sm dark:bg-gray-800"
            value={classType}
            onChange={(e) => setClassType(e.target.value)}
          >
            <option value="">All Classes</option>
            <option value="REFORMER">REFORMER</option>
            <option value="CADILLAC">CADILLAC</option>
            <option value="WUNDA CHAIR">WUNDA CHAIR</option>
            <option value="TOWER">TOWER</option>
          </select>

          <input
            type="date"
            className="h-10 border rounded-md px-3 text-sm dark:bg-gray-800"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <input
            type="date"
            className="h-10 border rounded-md px-3 text-sm dark:bg-gray-800"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {data.map((item, i) => (
            <div
              key={i}
              className="border rounded-lg p-4 flex justify-between items-center dark:bg-gray-800"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.class_type} • {item.session_type}
                </p>
              </div>

              <button
                onClick={() => openNoteModal(item)}
                className={`text-xs px-3 py-1 rounded-full border ${item.has_note
                    ? "border-green-400 text-green-600"
                    : "border-yellow-400 text-yellow-600"
                  }`}
              >
                {item.has_note ? "View Note" : "Add Note"}
              </button>
            </div>
          ))}
        </div>

        {hasNext && (
          <div ref={loaderRef} className="h-10 flex justify-center items-center">
            {loading && <p className="text-sm text-gray-400">Loading...</p>}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showNoteModal && selectedCheckin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-5">
            <h2 className="font-semibold text-lg mb-2">Coach Note</h2>

            <textarea
              rows={4}
              className="w-full border rounded-md p-3 text-sm dark:bg-gray-900"
              placeholder="Tulis catatan coach..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {/* IMAGE UPLOAD */}
            <div
              onClick={() => fileInputRef.current.click()}
              className="mt-3 border-2 border-dashed rounded-lg p-4 cursor-pointer
             text-center transition
             hover:border-blue-500
             border-gray-300 dark:border-gray-600"
            >
              {image ? (
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="mx-auto max-h-40 rounded-md object-cover"
                />
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Upload Photo
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Tap to upload image (JPG, PNG)
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImage(e.target.files[0])}
            />


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
