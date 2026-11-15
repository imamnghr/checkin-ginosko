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
  { value: "pending", label: "Pending" },
  { value: "", label: "All statuses" },
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

// The backend already sorts nearest-first; here we only group by date.
const groupByDate = (bookings) => {
  const groups = [];
  const indexByDate = new Map();

  bookings.forEach((booking) => {
    const dateKey = toDateKey(booking.class.class_schedule);

    if (!indexByDate.has(dateKey)) {
      indexByDate.set(dateKey, groups.length);
      groups.push({ dateKey, items: [] });
    }

    groups[indexByDate.get(dateKey)].items.push(booking);
  });

  return groups;
};

/* ---------------- small components ---------------- */

function FilterChips({ options, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.label}
            onClick={() => onChange(option.value)}
            className={`
              shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition
              ${
                active
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

function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] || STATUS_STYLES.expired
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function ScheduleCard({ booking }) {
  const { class: cls, user, guests, session_type, type_booking, pax, status } =
    booking;

  return (
    <div className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">
            {formatTime(cls.class_start)} – {formatTime(cls.class_end)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {cls.class_type || "-"}
            {booking.studio_name ? ` · ${booking.studio_name}` : ""}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-md bg-gray-100 px-2 py-1 capitalize dark:bg-gray-700">
          {session_type}
        </span>
        <span className="rounded-md bg-gray-100 px-2 py-1 capitalize dark:bg-gray-700">
          {type_booking}
        </span>
        <span className="rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-700">
          {pax} pax
        </span>
      </div>

      <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">Member</p>
        <p className="font-semibold">{user?.name || "-"}</p>
        {user?.phone && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.phone}
          </p>
        )}

        {guests?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Guest ({guests.length})
            </p>
            <ul className="text-sm">
              {guests.map((guest) => (
                <li key={`${guest.phone}-${guest.name}`}>{guest.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
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
        const params = { coach_id: coachId, page, limit: PAGE_LIMIT };
        if (range === "upcoming") params.start_date = todayKey();
        if (status) params.status = status;

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
    [coachId, range, status],
  );

  // reset to page 1 whenever a filter changes
  useEffect(() => {
    fetchBookings(1);
  }, [fetchBookings]);

  const groups = useMemo(() => groupByDate(bookings), [bookings]);
  const hasMore = meta.page < meta.totalPages;

  return (
    <>
      <Header title="My Schedule" />

      <div className="flex min-h-screen flex-col items-center gap-4 bg-white p-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <LoadingOverlay show={loading && bookings.length === 0} />

        {/* Filter */}
        <div className="w-full max-w-sm space-y-2">
          <FilterChips
            options={RANGE_OPTIONS}
            value={range}
            onChange={setRange}
          />
          <FilterChips
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {meta.total} {meta.total === 1 ? "booking" : "bookings"}
          </p>
        </div>

        {/* List per tanggal */}
        <div className="w-full max-w-sm space-y-6">
          {groups.map((group) => (
            <section key={group.dateKey} className="space-y-2">
              <h2 className="sticky top-0 bg-white py-1 text-sm font-semibold text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                {formatDateHeading(group.dateKey)}
              </h2>

              {group.items.map((booking) => (
                <ScheduleCard key={booking.id} booking={booking} />
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