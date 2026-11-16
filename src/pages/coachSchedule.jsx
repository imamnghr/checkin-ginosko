"use client";

import api from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Header, LoadingOverlay } from "@/components";

const PAGE_LIMIT = 20;
const TIMEZONE = "Asia/Jakarta";

const RANGE_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "all", label: "All" },
];

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
];

const STATUS_STYLES = {
  confirmed:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  expired: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const STATUS_LABELS = {
  confirmed: "Confirmed",
  completed: "Completed",
  pending: "Pending",
  cancelled: "Cancelled",
  expired: "Expired",
};

/* ---------------- helpers ---------------- */

const toDateKey = (value) =>
  new Date(value).toLocaleDateString("sv-SE", { timeZone: TIMEZONE }); // YYYY-MM-DD

const todayKey = () => toDateKey(new Date());

const formatDateHeading = (dateKey) => {
  const today = todayKey();
  const tomorrow = toDateKey(Date.now() + 24 * 60 * 60 * 1000);

  const label = new Date(`${dateKey}T00:00:00+07:00`).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: TIMEZONE,
    },
  );

  if (dateKey === today) return `Today · ${label}`;
  if (dateKey === tomorrow) return `Tomorrow · ${label}`;
  return label;
};

const formatTime = (time) => (time ? String(time).slice(0, 5) : "-");

const formatShortDate = (dateKey) =>
  new Date(`${dateKey}T00:00:00+07:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: TIMEZONE,
  });

// The backend already sorts nearest-first. Here we group by date, then merge
// every booking that belongs to the same class (class_id) into one entry.
const groupByDateAndClass = (bookings) => {
  const days = [];
  const dayIndex = new Map();

  bookings.forEach((booking) => {
    const dateKey = toDateKey(booking.class.class_schedule);

    if (!dayIndex.has(dateKey)) {
      dayIndex.set(dateKey, days.length);
      days.push({ dateKey, classes: [], classIndex: new Map() });
    }

    const day = days[dayIndex.get(dateKey)];
    const classKey = booking.class_id ?? `booking-${booking.id}`;

    if (!day.classIndex.has(classKey)) {
      day.classIndex.set(classKey, day.classes.length);
      day.classes.push({
        classKey,
        info: booking.class,
        studioName: booking.studio_name,
        bookings: [],
      });
    }

    day.classes[day.classIndex.get(classKey)].bookings.push(booking);
  });

  return days;
};

/* ---------------- small components ---------------- */

function FilterChips({ options, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition
              ${active
                ? "bg-[#041475] text-white dark:bg-blue-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function DateRangeFilter({ startDate, endDate, onApply }) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);

  const active = Boolean(startDate || endDate);
  const label = active
    ? `${startDate ? formatShortDate(startDate) : "…"} – ${endDate ? formatShortDate(endDate) : "…"
    }`
    : "Date";

  const handleToggle = () => {
    setDraftStart(startDate);
    setDraftEnd(endDate);
    setOpen((prev) => !prev);
  };

  const handleApply = () => {
    if (draftStart && draftEnd && draftStart > draftEnd) {
      toast.error("Start date must be before end date");
      return;
    }

    onApply(draftStart, draftEnd);
    setOpen(false);
  };

  const handleReset = () => {
    setDraftStart("");
    setDraftEnd("");
    onApply("", "");
    setOpen(false);
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]";

  return (
    <div className="shrink-0">
      <button
        onClick={handleToggle}
        className={`
          flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition
          ${active
            ? "bg-[#041475] text-white dark:bg-blue-700"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        {label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full z-20 mt-2 w-64 space-y-3 rounded-xl bg-white p-4 shadow-lg dark:bg-gray-800">
            <label className="block text-xs text-gray-500 dark:text-gray-400">
              Start date
              <input
                type="date"
                value={draftStart}
                max={draftEnd || undefined}
                onChange={(e) => setDraftStart(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-xs text-gray-500 dark:text-gray-400">
              End date
              <input
                type="date"
                value={draftEnd}
                min={draftStart || undefined}
                onChange={(e) => setDraftEnd(e.target.value)}
                className={inputClass}
              />
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg bg-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 rounded-lg bg-[#041475] py-2 text-sm text-white hover:bg-[#061a9b] dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.expired
        }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function MemberRow({ booking }) {
  const { user, guests, session_type, type_booking, pax, status } = booking;

  const details = [session_type, type_booking, pax ? `${pax} pax` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="py-2 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">{user?.name || "-"}</p>
        <StatusBadge status={status} />
      </div>

      {details && (
        <p className="text-xs capitalize text-gray-500 dark:text-gray-400">
          {details}
        </p>
      )}

      {guests?.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
          {guests.map((guest, i) => (
            <li key={`${guest.name}-${i}`}>+ {guest.name}</li>
          ))}
        </ul>
      )}
    </li>
  );
}

function ClassCard({ classGroup }) {
  const { info, studioName, bookings } = classGroup;

  return (
    <div className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">
            {formatTime(info.class_start)} – {formatTime(info.class_end)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {info.class_type || "-"}
            {studioName ? ` · ${studioName}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-700">
          {bookings.length} {bookings.length === 1 ? "participant" : "participants"}
        </span>

      </div>

      <ul className="mt-3 divide-y divide-gray-200 border-t border-gray-200 pt-3 dark:divide-gray-700 dark:border-gray-700">
        {bookings.map((booking) => (
          <MemberRow key={booking.id} booking={booking} />
        ))}
      </ul>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function CoachSchedule() {
  const [coachId, setCoachId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [range, setRange] = useState("upcoming");
  const [status, setStatus] = useState("confirmed");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  // get the logged-in coach's id
  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setCoachId(res.data.data.id))
      .catch((e) =>
        toast.error(e.response?.data?.message || "failed to load profile"),
      );
  }, []);

  const fetchBookings = useCallback(
    async (page) => {
      if (!coachId) return;

      setLoading(true);

      try {
        const params = { coach_id: coachId, page, limit: PAGE_LIMIT, status };
        // a custom start date wins over the "Upcoming" shortcut
        const fromDate = startDate || (range === "upcoming" ? todayKey() : "");
        if (fromDate) params.start_date = fromDate;
        if (endDate) params.end_date = endDate;

        const res = await api.get("/bookings", { params });
        const { data, meta: nextMeta } = res.data.data;

        setBookings((prev) => (page === 1 ? data : [...prev, ...data]));
        setMeta(nextMeta);
      } catch (e) {
        console.log(e);
        toast.error(e.response?.data?.message || "failed to load schedule");
      } finally {
        setLoading(false);
      }
    },
    [coachId, range, status, startDate, endDate],
  );

  // reset to page 1 whenever a filter changes
  useEffect(() => {
    fetchBookings(1);
  }, [fetchBookings]);

  const days = useMemo(() => groupByDateAndClass(bookings), [bookings]);
  const hasMore = meta.page < meta.totalPages;

  const handleApplyDates = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <>
      <Header title="My Schedule" />

      <div className="flex min-h-screen flex-col items-center gap-4 bg-white p-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <LoadingOverlay show={loading && bookings.length === 0} />

        {/* Filter */}
        <div className="w-full max-w-sm space-y-2">
          <div className="relative flex items-center justify-between gap-2">
            <div className="min-w-0">
              <FilterChips
                options={RANGE_OPTIONS}
                value={range}
                onChange={setRange}
              />
            </div>

            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onApply={handleApplyDates}
            />
          </div>
          <FilterChips
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {meta.total} {meta.total === 1 ? "booking" : "bookings"}
          </p>
        </div>

        {/* List grouped by date, then by class */}
        <div className="w-full max-w-sm space-y-6">
          {days.map((day) => (
            <section key={day.dateKey} className="space-y-2">
              <h2 className="sticky top-0 bg-white py-1 text-sm font-semibold text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                {formatDateHeading(day.dateKey)}
              </h2>

              {day.classes.map((classGroup) => (
                <ClassCard key={classGroup.classKey} classGroup={classGroup} />
              ))}
            </section>
          ))}

          {!loading && coachId && bookings.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              No bookings scheduled yet.
            </p>
          )}
        </div>

        {/* Load more */}
        {hasMore && (
          <button
            disabled={loading}
            onClick={() => fetchBookings(meta.page + 1)}
            className="
              w-full max-w-sm rounded-xl py-3 text-white
              bg-[#041475] hover:bg-[#061a9b]
              dark:bg-blue-700 dark:hover:bg-blue-600
              disabled:opacity-50
            "
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </>
  );
}