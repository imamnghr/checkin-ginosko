import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import { Header } from "@/components";

const MAX_IMAGES = 3;
const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 100;

const CLASS_TYPES = ["REFORMER", "CADILLAC", "WUNDA CHAIR", "TOWER"];

const toMB = (bytes) => bytes / 1024 / 1024;
const toUrl = (m) => (typeof m === "string" ? m : m?.url);

export default function CoachCheckinsPage() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);

  // filters
  const [classType, setClassType] = useState("");
  const [sessionType, setSessionType] = useState("private");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [note, setNote] = useState("");
  const [noteId, setNoteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  // media baru (belum di-upload)
  const [images, setImages] = useState([]); // File[]
  const [video, setVideo] = useState(null); // File | null

  // media yang sudah tersimpan (mode edit, read-only)
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideo, setExistingVideo] = useState(null);

  const loaderRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // ---------- preview URLs (otomatis dibersihkan) ----------
  const imagePreviews = useMemo(
    () => images.map((f) => URL.createObjectURL(f)),
    [images]
  );
  useEffect(
    () => () => imagePreviews.forEach((u) => URL.revokeObjectURL(u)),
    [imagePreviews]
  );

  const videoPreview = useMemo(
    () => (video ? URL.createObjectURL(video) : null),
    [video]
  );
  useEffect(
    () => () => videoPreview && URL.revokeObjectURL(videoPreview),
    [videoPreview]
  );

  const totalImages = existingImages.length + images.length;
  const canAddImage = totalImages < MAX_IMAGES;

  // ---------- fetch list ----------
  const fetchData = async (reset = false) => {
    if (loading || (!hasNext && !reset)) return;

    setLoading(true);
    try {
      const res = await api.get("/checkins/coach", {
        params: {
          page: reset ? 1 : page,
          limit: 10,
          class_type: classType || undefined,
          session_type: sessionType,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });

      const result = res.data.data;

      setData((prev) => (reset ? result.data : [...prev, ...result.data]));
      setHasNext(result.meta.hasNext);
      setPage((p) => (reset ? 2 : p + 1));
    } finally {
      setLoading(false);
    }
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

  const resetFilters = () => {
    setClassType("");
    setSessionType("private");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilter =
    classType || startDate || endDate || sessionType !== "private";

  // ---------- modal ----------
  const closeModal = () => {
    if (saving) return;
    setShowNoteModal(false);
  };

  useEffect(() => {
    if (!showNoteModal) return;
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showNoteModal, saving]);

  const openNoteModal = async (item) => {
    setSelectedCheckin(item);
    setShowNoteModal(true);
    setNote("");
    setNoteId(null);
    setImages([]);
    setVideo(null);
    setExistingImages([]);
    setExistingVideo(null);
    setError("");
    setProgress(0);

    if (!item.has_note) return;

    try {
      setLoadingNote(true);
      const res = await api.get(`/coach-notes/checkin/${item.checkin_id}`);
      const d = res.data.data;
      setNote(d.note);
      setNoteId(d.id);
      setExistingImages((d.images || []).map(toUrl).filter(Boolean));
      setExistingVideo(toUrl(d.video) || d.video_url || null);
    } catch {
      setError("Gagal memuat catatan.");
    } finally {
      setLoadingNote(false);
    }
  };

  // ---------- media handlers ----------
  const handlePickImages = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // supaya file yang sama bisa dipilih lagi
    if (!picked.length) return;

    const slots = MAX_IMAGES - totalImages;
    const valid = picked.filter((f) => toMB(f.size) <= MAX_IMAGE_MB);

    if (valid.length < picked.length) {
      setError(`Ukuran foto maksimal ${MAX_IMAGE_MB} MB per file.`);
    } else if (picked.length > slots) {
      setError(`Maksimal ${MAX_IMAGES} foto.`);
    } else {
      setError("");
    }

    setImages((prev) => [...prev, ...valid.slice(0, slots)]);
  };

  const removeImage = (index) =>
    setImages((prev) => prev.filter((_, i) => i !== index));

  const handlePickVideo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (toMB(file.size) > MAX_VIDEO_MB) {
      setError(`Ukuran video maksimal ${MAX_VIDEO_MB} MB.`);
      return;
    }
    setError("");
    setVideo(file);
  };

  // ---------- save ----------
  const handleSave = async () => {
    if (!note.trim()) return;

    try {
      setSaving(true);
      setError("");
      setProgress(0);

      const formData = new FormData();
      formData.append("note", note.trim());
      formData.append("checkin_id", selectedCheckin.checkin_id);
      images.forEach((file) => formData.append("images", file));
      if (video) formData.append("video", video);

      const config = {
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      };

      if (noteId) {
        await api.put(`/coach-notes/${noteId}`, formData, config);
      } else {
        await api.post("/coach-notes", formData, config);
      }

      await fetchData(true);
      setShowNoteModal(false);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Gagal menyimpan catatan. Coba lagi."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------- styles ----------
  const fieldClass =
    "h-10 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 text-sm " +
    "bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <>
      <Header title="List Check-in" />

      <div className="p-4 sm:p-6 max-w-3xl bg-white dark:bg-gray-900 min-h-screen">
        {/* FILTER */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-xs text-gray-500 space-y-1">
              Kelas
              <select
                className={fieldClass}
                value={classType}
                onChange={(e) => setClassType(e.target.value)}
              >
                <option value="">All Classes</option>
                {CLASS_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-gray-500 space-y-1">
              Tipe sesi
              <select
                className={fieldClass}
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
              >
                <option value="private">PRIVATE</option>
                <option value="dap">DAP</option>
              </select>
            </label>

            <label className="text-xs text-gray-500 space-y-1">
              Dari tanggal
              <input
                type="date"
                className={fieldClass}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>

            <label className="text-xs text-gray-500 space-y-1">
              Sampai tanggal
              <input
                type="date"
                className={fieldClass}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>

          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="mt-3 text-xs text-blue-600 hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.checkin_id}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4
                flex justify-between items-center gap-3 dark:bg-gray-800"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700
                    flex items-center justify-center text-sm font-semibold"
                >
                  {item.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {item.class_type} • {item.session_type}
                  </p>
                </div>
              </div>

              <button
                onClick={() => openNoteModal(item)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${item.has_note
                    ? "border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    : "border-yellow-400 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                  }`}
              >
                {item.has_note ? "View Note" : "Add Note"}
              </button>
            </div>
          ))}

          {!loading && data.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">
              Tidak ada data check-in.
            </p>
          )}
        </div>

        {hasNext && (
          <div ref={loaderRef} className="h-10 flex justify-center items-center">
            {loading && <p className="text-sm text-gray-400">Loading...</p>}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showNoteModal && selectedCheckin && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh]
              flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="min-w-0">
                <h2 className="font-semibold text-lg">Coach Note</h2>
                <p className="text-sm text-gray-500 truncate">
                  {selectedCheckin.name} • {selectedCheckin.class_type} •{" "}
                  {selectedCheckin.session_type}
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={saving}
                aria-label="Tutup"
                className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1"
              >
                ×
              </button>
            </div>

            {/* body */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {loadingNote ? (
                <p className="text-sm text-gray-400">Memuat catatan...</p>
              ) : (
                <>
                  {/* NOTE */}
                  <div>
                    <label className="text-sm font-medium">Catatan</label>
                    <textarea
                      rows={4}
                      className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-md p-3
                        text-sm dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tulis catatan coach..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  {/* PHOTOS */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Foto</label>
                      <span className="text-xs text-gray-500">
                        {totalImages}/{MAX_IMAGES}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {existingImages.map((url, i) => (
                        <div
                          key={`old-${i}`}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
                        >
                          <img
                            src={url}
                            alt={`Foto tersimpan ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}

                      {imagePreviews.map((url, i) => (
                        <div
                          key={url}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
                        >
                          <img
                            src={url}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            disabled={saving}
                            aria-label="Hapus foto"
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white
                              text-sm leading-none flex items-center justify-center hover:bg-black"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {canAddImage && (
                        <button
                          type="button"
                          onClick={() => imageInputRef.current.click()}
                          disabled={saving}
                          className="aspect-square rounded-lg border-2 border-dashed border-gray-300
                            dark:border-gray-600 hover:border-blue-500 transition flex flex-col
                            items-center justify-center text-gray-500"
                        >
                          <span className="text-2xl leading-none">+</span>
                          <span className="text-xs mt-1">Tambah</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      JPG/PNG, maks. {MAX_IMAGE_MB} MB per foto.
                    </p>

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePickImages}
                    />
                  </div>

                  {/* VIDEO */}
                  <div>
                    <label className="text-sm font-medium">Video</label>

                    <div className="mt-2">
                      {videoPreview ? (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-black">
                          <video
                            src={videoPreview}
                            controls
                            className="w-full max-h-56"
                          />
                          <button
                            type="button"
                            onClick={() => setVideo(null)}
                            disabled={saving}
                            aria-label="Hapus video"
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white
                              text-base leading-none flex items-center justify-center hover:bg-black"
                          >
                            ×
                          </button>
                        </div>
                      ) : existingVideo ? (
                        <video
                          src={existingVideo}
                          controls
                          className="w-full max-h-56 rounded-lg bg-black"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => videoInputRef.current.click()}
                          disabled={saving}
                          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600
                            hover:border-blue-500 transition rounded-lg p-5 text-center"
                        >
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            Upload Video
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            MP4/MOV, maks. {MAX_VIDEO_MB} MB
                          </p>
                        </button>
                      )}
                    </div>

                    {video && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {video.name} ({toMB(video.size).toFixed(1)} MB)
                      </p>
                    )}

                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handlePickVideo}
                    />
                  </div>

                  {/* PROGRESS */}
                  {saving && (images.length > 0 || video) && (
                    <div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Mengunggah... {progress}%
                      </p>
                    </div>
                  )}

                  {/* ERROR */}
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 rounded-md px-3 py-2">
                      {error}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* footer */}
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md
                  hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                disabled={!note.trim() || saving || loadingNote}
                onClick={handleSave}
                className="px-4 py-2 text-sm rounded-md bg-black text-white disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : noteId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
