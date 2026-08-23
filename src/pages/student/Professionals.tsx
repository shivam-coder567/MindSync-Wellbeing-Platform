import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronUp,
  Clock,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  ShieldOff,
  SlidersHorizontal,
  Stethoscope,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import {
  bookAppointment,
  cancelAppointment,
  getProfessionalSlots,
  getProfessionals,
  getStudentAppointments,
  ProfessionalSupportUnavailableError,
} from "../../services/professionalService";
import type { Appointment } from "../../types/appointment";
import type { ConsultationType, Professional } from "../../types/professional";
import type { ProfessionalSlot } from "../../types/appointment";

// ── Constants ────────────────────────────────────────────

const CONSULTATION_LABELS: Record<string, string> = {
  chat: "Chat",
  audio: "Audio",
  video: "Video",
};

const CONSULTATION_ICONS: Record<string, typeof MessageCircle> = {
  chat: MessageCircle,
  audio: Clock,
  video: Video,
};

const ROLE_LABELS: Record<string, string> = {
  psychiatrist: "Psychiatrist",
  psychologist: "Psychologist",
  counselor: "Counselor",
};

const STATUS_STYLES: Record<
  string,
  { background: string; color: string; label: string }
> = {
  upcoming: { background: "#eef6ef", color: "#34775a", label: "Upcoming" },
  completed: { background: "#f0f0f0", color: "#666", label: "Completed" },
  cancelled: { background: "#fef3f0", color: "#b05a45", label: "Cancelled" },
};

// ── Helpers ──────────────────────────────────────────────

function formatSlotDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatSlotTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatAppointmentDateTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Component ────────────────────────────────────────────

export default function Professionals() {
  const { profile } = useAuth();

  // ── Directory state ────────────────────────────────────

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Filter state ───────────────────────────────────────

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "available" | "unavailable"
  >("all");
  const [showFilters, setShowFilters] = useState(false);

  // ── Expanded professional state ────────────────────────

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [slots, setSlots] = useState<ProfessionalSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  // ── Booking state ──────────────────────────────────────

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedConsultationType, setSelectedConsultationType] =
    useState<ConsultationType>("chat");
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // ── Upcoming appointments state ────────────────────────

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // ── Load professionals on mount ────────────────────────

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getProfessionals();
        if (alive) setProfessionals(data);
      } catch (err) {
        if (!alive) return;

        if (err instanceof ProfessionalSupportUnavailableError) {
          setError(
            "Professional directory is not connected yet. Please check back once the secure directory has been configured.",
          );
        } else {
          console.error("Failed to load professionals:", err);
          setError(
            "We couldn't load the professional directory right now. Please try again.",
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, []);

  // ── Load upcoming appointments on mount ────────────────

  useEffect(() => {
    if (!profile?.id) {
      setAppointmentsLoading(false);
      return;
    }

    let alive = true;

    async function loadAppointments() {
      setAppointmentsLoading(true);

      try {
        const data = await getStudentAppointments(profile!.id);
        if (alive) {
          setAppointments(
            data.filter((a) => a.status === "upcoming" || a.status === "completed"),
          );
        }
      } catch (err) {
        if (!alive) return;
        // Silently ignore if appointments table doesn't exist
        if (err instanceof ProfessionalSupportUnavailableError) return;
        console.error("Failed to load appointments:", err);
      } finally {
        if (alive) setAppointmentsLoading(false);
      }
    }

    void loadAppointments();
    return () => {
      alive = false;
    };
  }, [profile?.id]);

  // ── Load slots when professional is expanded ───────────

  const loadSlots = useCallback(async (professionalId: string) => {
    setSlotsLoading(true);
    setSlotsError("");
    setSlots([]);
    setSelectedSlotId(null);
    setSelectedConsultationType("chat");
    setBookingError("");
    setBookingSuccess(false);

    try {
      const data = await getProfessionalSlots(professionalId);
      setSlots(data);
    } catch (err) {
      if (err instanceof ProfessionalSupportUnavailableError) {
        setSlotsError("Slots are not available yet.");
      } else {
        console.error("Failed to load slots:", err);
        setSlotsError("Could not load available times. Please try again.");
      }
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (expandedId) {
      void loadSlots(expandedId);
    } else {
      setSlots([]);
      setSelectedSlotId(null);
      setBookingError("");
      setBookingSuccess(false);
    }
  }, [expandedId, loadSlots]);

  // ── Derived filter options ─────────────────────────────

  const roles = useMemo(
    () => Array.from(new Set(professionals.map((p) => p.role))).sort(),
    [professionals],
  );

  const cities = useMemo(
    () =>
      Array.from(
        new Set(professionals.map((p) => p.city).filter(Boolean)),
      ).sort(),
    [professionals],
  );

  // ── Filtered list ──────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return professionals.filter((p) => {
      if (q) {
        const haystack = `${p.name} ${p.specialization} ${p.overview || ""} ${p.role} ${p.city}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (roleFilter && p.role !== roleFilter) return false;
      if (cityFilter && p.city !== cityFilter) return false;
      if (availabilityFilter === "available" && !p.available) return false;
      if (availabilityFilter === "unavailable" && p.available) return false;
      return true;
    });
  }, [professionals, search, roleFilter, cityFilter, availabilityFilter]);

  const hasActiveFilters =
    search || roleFilter || cityFilter || availabilityFilter !== "all";

  function clearFilters() {
    setSearch("");
    setRoleFilter("");
    setCityFilter("");
    setAvailabilityFilter("all");
  }

  // ── Expand/collapse ────────────────────────────────────

  function toggleExpand(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  // ── Book appointment ───────────────────────────────────

  async function handleBook() {
    if (!selectedSlotId || bookingInProgress) return;

    setBookingInProgress(true);
    setBookingError("");
    setBookingSuccess(false);

    try {
      await bookAppointment(expandedId!, selectedSlotId, selectedConsultationType);

      setBookingSuccess(true);
      setSelectedSlotId(null);

      // Remove the booked slot from the local list
      setSlots((current) => current.filter((s) => s.id !== selectedSlotId));

      // Refresh upcoming appointments
      if (profile?.id) {
        try {
          const updated = await getStudentAppointments(profile.id);
          setAppointments(
            updated.filter(
              (a) => a.status === "upcoming" || a.status === "completed",
            ),
          );
        } catch {
          // Non-critical — appointments will refresh on next page load
        }
      }
    } catch (err) {
      console.error("Booking failed:", err);

      if (err instanceof Error) {
        setBookingError(err.message);
      } else {
        setBookingError("Booking failed. Please try again.");
      }
    } finally {
      setBookingInProgress(false);
    }
  }

  // ── Cancel appointment ─────────────────────────────────

  async function handleCancelAppointment(appointmentId: string) {
    if (cancellingId) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?",
    );
    if (!confirmed) return;

    setCancellingId(appointmentId);

    try {
      await cancelAppointment(appointmentId);

      setAppointments((current) =>
        current.map((a) =>
          a.id === appointmentId
            ? { ...a, status: "cancelled" as const, cancelledAt: new Date().toISOString() }
            : a,
        ),
      );

      // Refresh slots if the cancelled appointment's professional is expanded
      if (expandedId) {
        void loadSlots(expandedId);
      }
    } catch (err) {
      console.error("Cancellation failed:", err);
      alert("Could not cancel the appointment. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  // ── Upcoming appointments (not cancelled) ──────────────

  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => a.status === "upcoming"),
    [appointments],
  );

  // ── Render ─────────────────────────────────────────────

  return (
    <main className="page">
      <p className="eyebrow">Support that fits you</p>
      <h1>Meet people who can help.</h1>
      <p className="lead">
        Take your time finding someone whose experience and approach feel right
        for you. Reaching out is a brave first step.
      </p>

      {/* ════════════════════════════════════════════════════
          UPCOMING APPOINTMENTS
      ════════════════════════════════════════════════════ */}

      {!loading && upcomingAppointments.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <CalendarCheck size={18} color="#34775a" />
            <h2 style={{ margin: 0, fontSize: 18 }}>Your upcoming appointments</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcomingAppointments.map((apt) => {
              const statusStyle = STATUS_STYLES[apt.status] || STATUS_STYLES.upcoming;

              return (
                <article
                  className="surface"
                  key={apt.id}
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      minWidth: 42,
                      borderRadius: 12,
                      background: "#eef5f0",
                      color: "#34775a",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Calendar size={18} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: 14, display: "block" }}>
                      {formatAppointmentDateTime(apt.scheduledAt)}
                    </strong>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#71817a",
                        display: "block",
                        marginTop: 2,
                      }}
                    >
                      {CONSULTATION_LABELS[apt.consultationType] || apt.consultationType} consultation
                      {" · "}
                      {formatSlotTime(apt.scheduledAt)} – {formatSlotTime(apt.endsAt)}
                    </span>
                  </div>

                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: statusStyle.background,
                      color: statusStyle.color,
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {statusStyle.label}
                  </span>

                  {apt.status === "upcoming" && (
                    <button
                      className="btn btn-outline"
                      disabled={cancellingId === apt.id}
                      onClick={() => void handleCancelAppointment(apt.id)}
                      style={{
                        fontSize: 12,
                        padding: "7px 12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cancellingId === apt.id ? "Cancelling…" : "Cancel"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════
          SEARCH + FILTERS
      ════════════════════════════════════════════════════ */}

      {!loading && !error && professionals.length > 0 && (
        <div
          style={{
            marginTop: upcomingAppointments.length > 0 ? 30 : 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 12,
                background: "#fff",
                border: "1px solid #dde8e1",
              }}
            >
              <Search size={17} color="#7a9489" />
              <input
                type="text"
                placeholder="Search by name, specialization, or keyword…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search professionals"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 14,
                  color: "#20332f",
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#7a9489",
                    display: "grid",
                    placeItems: "center",
                    padding: 2,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                whiteSpace: "nowrap",
              }}
            >
              <SlidersHorizontal size={15} />
              Filters
              {hasActiveFilters && (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#3a7d5a",
                  }}
                />
              )}
            </button>
          </div>

          {showFilters && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                padding: "14px 16px",
                borderRadius: 12,
                background: "#f6faf7",
                border: "1px solid #e2ece5",
              }}
            >
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                aria-label="Filter by role"
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #dde8e1",
                  background: "#fff",
                  fontSize: 13,
                  color: "#334d44",
                  cursor: "pointer",
                }}
              >
                <option value="">All roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role] || role}
                  </option>
                ))}
              </select>

              {cities.length > 0 && (
                <select
                  value={cityFilter}
                  onChange={(event) => setCityFilter(event.target.value)}
                  aria-label="Filter by city"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #dde8e1",
                    background: "#fff",
                    fontSize: 13,
                    color: "#334d44",
                    cursor: "pointer",
                  }}
                >
                  <option value="">All locations</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={availabilityFilter}
                onChange={(event) =>
                  setAvailabilityFilter(
                    event.target.value as "all" | "available" | "unavailable",
                  )
                }
                aria-label="Filter by availability"
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #dde8e1",
                  background: "#fff",
                  fontSize: 13,
                  color: "#334d44",
                  cursor: "pointer",
                }}
              >
                <option value="all">All availability</option>
                <option value="available">Available now</option>
                <option value="unavailable">Currently unavailable</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #dde8e1",
                    background: "#fff",
                    fontSize: 13,
                    color: "#71817a",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <X size={14} />
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          LOADING STATE
      ════════════════════════════════════════════════════ */}

      {loading && (
        <div
          className="surface"
          style={{
            marginTop: 30,
            padding: 40,
            textAlign: "center",
            color: "#71817a",
            fontSize: 14,
          }}
        >
          Loading the professional directory…
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          ERROR STATE
      ════════════════════════════════════════════════════ */}

      {!loading && error && (
        <div
          className="surface"
          style={{ marginTop: 30, padding: 30, textAlign: "center" }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "#fef3f0",
              color: "#b05a45",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 14px",
            }}
          >
            <ShieldOff size={20} />
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#5a3a33" }}>{error}</p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          EMPTY STATE — NO PROFESSIONALS
      ════════════════════════════════════════════════════ */}

      {!loading && !error && professionals.length === 0 && (
        <div
          className="surface"
          style={{ marginTop: 30, padding: 40, textAlign: "center" }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "#eef5f0",
              color: "#4d8f64",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 14px",
            }}
          >
            <Stethoscope size={20} />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 17 }}>No professionals yet</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#71817a", lineHeight: 1.5 }}>
            The professional directory will appear here once verified
            professionals have been added.
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          EMPTY STATE — FILTERS
      ════════════════════════════════════════════════════ */}

      {!loading && !error && professionals.length > 0 && filtered.length === 0 && (
        <div
          className="surface"
          style={{ marginTop: 30, padding: 34, textAlign: "center" }}
        >
          <Search size={22} color="#8c9a94" style={{ marginBottom: 10 }} />
          <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>
            No professionals match your search
          </h3>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#71817a" }}>
            Try adjusting your filters or search term.
          </p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          PROFESSIONAL CARDS
      ════════════════════════════════════════════════════ */}

      {!loading && !error && filtered.length > 0 && (
        <>
          <p
            style={{
              marginTop: 28,
              marginBottom: 0,
              fontSize: 13,
              color: "#71817a",
            }}
          >
            {filtered.length} professional{filtered.length !== 1 ? "s" : ""}{" "}
            {hasActiveFilters ? "match your filters" : "in the directory"}
          </p>

          <section className="professional-grid">
            {filtered.map((pro) => {
              const initials = getInitials(pro.name);
              const isExpanded = expandedId === pro.id;

              return (
                <article
                  className="surface professional-card"
                  key={pro.id}
                  style={{ transition: "box-shadow 0.2s ease" }}
                >
                  {/* ── Card header ───────────────────────── */}
                  <div className="professional-top">
                    <div className="pro-avatar">{initials}</div>
                    <span className="availability">
                      ●{" "}
                      {pro.available
                        ? "Available this week"
                        : "Currently unavailable"}
                    </span>
                  </div>

                  {/* ── Name + role ───────────────────────── */}
                  <h2 style={{ marginTop: 19, marginBottom: 4 }}>{pro.name}</h2>
                  <p style={{ marginBottom: 0, color: "#39705e", fontWeight: 700 }}>
                    {ROLE_LABELS[pro.role] || pro.role}
                  </p>

                  {pro.overview && (
                    <p style={{ marginTop: 8 }}>{pro.overview}</p>
                  )}

                  {/* ── Tags ──────────────────────────────── */}
                  <div className="pro-meta">
                    <span className="tag">
                      <Stethoscope
                        size={12}
                        style={{ verticalAlign: "middle", marginRight: 4 }}
                      />
                      {pro.specialization}
                    </span>
                    {pro.city && (
                      <span className="tag">
                        <MapPin
                          size={12}
                          style={{ verticalAlign: "middle", marginRight: 4 }}
                        />
                        {pro.city}
                      </span>
                    )}
                    <span className="tag">
                      {pro.verificationStatus === "verified" ? (
                        <>
                          <ShieldCheck
                            size={12}
                            style={{ verticalAlign: "middle", marginRight: 4 }}
                          />
                          Verified
                        </>
                      ) : (
                        <>
                          <ShieldOff
                            size={12}
                            style={{ verticalAlign: "middle", marginRight: 4 }}
                          />
                          {pro.verificationStatus === "pending"
                            ? "Verification pending"
                            : "Not verified"}
                        </>
                      )}
                    </span>
                  </div>

                  {/* ═══════════════════════════════════════
                      EXPANDED — DETAILS + SLOTS + BOOKING
                  ═══════════════════════════════════════ */}

                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      {/* ── Professional details ────────── */}
                      <div
                        style={{
                          padding: "14px 16px",
                          borderRadius: 10,
                          background: "#f6faf7",
                          border: "1px solid #e2ece5",
                          fontSize: 13,
                          color: "#516b61",
                          lineHeight: 1.55,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <div>
                            <strong style={{ color: "#345a4c", fontSize: 12 }}>
                              Role
                            </strong>
                            <p style={{ margin: "2px 0 0" }}>
                              {ROLE_LABELS[pro.role] || pro.role}
                            </p>
                          </div>

                          <div>
                            <strong style={{ color: "#345a4c", fontSize: 12 }}>
                              Specialization
                            </strong>
                            <p style={{ margin: "2px 0 0" }}>
                              {pro.specialization}
                            </p>
                          </div>

                          {pro.city && (
                            <div>
                              <strong style={{ color: "#345a4c", fontSize: 12 }}>
                                Location
                              </strong>
                              <p style={{ margin: "2px 0 0" }}>{pro.city}</p>
                            </div>
                          )}

                          {pro.overview && (
                            <div>
                              <strong style={{ color: "#345a4c", fontSize: 12 }}>
                                About
                              </strong>
                              <p style={{ margin: "2px 0 0" }}>{pro.overview}</p>
                            </div>
                          )}

                          {pro.consultationTypes &&
                            pro.consultationTypes.length > 0 && (
                              <div>
                                <strong style={{ color: "#345a4c", fontSize: 12 }}>
                                  Consultation types
                                </strong>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    marginTop: 4,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {pro.consultationTypes.map((type) => (
                                    <span
                                      key={type}
                                      style={{
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                        background: "#eaf3ec",
                                        color: "#3a6b52",
                                        fontSize: 12,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {CONSULTATION_LABELS[type] || type}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* ── Slots loading ──────────────── */}
                      {slotsLoading && (
                        <div
                          style={{
                            padding: "16px",
                            textAlign: "center",
                            fontSize: 13,
                            color: "#71817a",
                          }}
                        >
                          Loading available times…
                        </div>
                      )}

                      {/* ── Slots error ────────────────── */}
                      {!slotsLoading && slotsError && (
                        <div
                          style={{
                            padding: "14px 16px",
                            borderRadius: 10,
                            background: "#fef8f5",
                            border: "1px solid #f0ddd5",
                            fontSize: 13,
                            color: "#8a5a4a",
                          }}
                        >
                          {slotsError}
                        </div>
                      )}

                      {/* ── No slots available ─────────── */}
                      {!slotsLoading &&
                        !slotsError &&
                        slots.length === 0 &&
                        !bookingSuccess && (
                          <div
                            style={{
                              padding: "16px",
                              textAlign: "center",
                              fontSize: 13,
                              color: "#71817a",
                              background: "#f9fbf9",
                              borderRadius: 10,
                              border: "1px dashed #d7e4dc",
                            }}
                          >
                            <CalendarClock
                              size={20}
                              color="#8c9a94"
                              style={{ marginBottom: 6 }}
                            />
                            <p style={{ margin: 0 }}>
                              No upcoming slots available for this professional
                              right now.
                            </p>
                          </div>
                        )}

                      {/* ── Slot selection ─────────────── */}
                      {!slotsLoading && !slotsError && slots.length > 0 && (
                        <div>
                          <strong
                            style={{
                              display: "block",
                              fontSize: 13,
                              color: "#345a4c",
                              marginBottom: 8,
                            }}
                          >
                            Available times
                          </strong>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              maxHeight: 220,
                              overflowY: "auto",
                            }}
                          >
                            {slots.map((slot) => {
                              const isSelected = selectedSlotId === slot.id;

                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedSlotId(
                                      isSelected ? null : slot.id,
                                    )
                                  }
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    border: isSelected
                                      ? "2px solid #3a7d5a"
                                      : "1px solid #dde8e1",
                                    background: isSelected ? "#eef6ef" : "#fff",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    color: "#29493f",
                                    textAlign: "left",
                                    transition:
                                      "border-color 0.15s ease, background 0.15s ease",
                                  }}
                                >
                                  <span>
                                    <strong>{formatSlotDate(slot.startsAt)}</strong>
                                    <span style={{ color: "#71817a", margin: "0 6px" }}>
                                      ·
                                    </span>
                                    {formatSlotTime(slot.startsAt)} –{" "}
                                    {formatSlotTime(slot.endsAt)}
                                  </span>
                                  {isSelected && (
                                    <Check size={16} color="#3a7d5a" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── Consultation type picker ──── */}
                      {!slotsLoading && selectedSlotId && (
                        <div>
                          <strong
                            style={{
                              display: "block",
                              fontSize: 13,
                              color: "#345a4c",
                              marginBottom: 8,
                            }}
                          >
                            Consultation type
                          </strong>

                          <div style={{ display: "flex", gap: 8 }}>
                            {(pro.consultationTypes || ["chat"]).map((type) => {
                              const Icon = CONSULTATION_ICONS[type] || MessageCircle;
                              const isSelected = selectedConsultationType === type;

                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() =>
                                    setSelectedConsultationType(type)
                                  }
                                  style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "10px 8px",
                                    borderRadius: 8,
                                    border: isSelected
                                      ? "2px solid #3a7d5a"
                                      : "1px solid #dde8e1",
                                    background: isSelected ? "#eef6ef" : "#fff",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: isSelected ? "#2a5e44" : "#5a7569",
                                    transition:
                                      "border-color 0.15s ease, background 0.15s ease",
                                  }}
                                >
                                  <Icon size={17} />
                                  {CONSULTATION_LABELS[type] || type}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── Booking success ────────────── */}
                      {bookingSuccess && (
                        <div
                          style={{
                            padding: "14px 16px",
                            borderRadius: 10,
                            background: "#eef6ef",
                            border: "1px solid #c8e4cf",
                            fontSize: 13,
                            color: "#2a5e44",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <CheckCircle2 size={18} />
                          <span>
                            <strong>Appointment booked!</strong> Check your
                            upcoming appointments above.
                          </span>
                        </div>
                      )}

                      {/* ── Booking error ──────────────── */}
                      {bookingError && (
                        <div
                          style={{
                            padding: "14px 16px",
                            borderRadius: 10,
                            background: "#fef3f0",
                            border: "1px solid #f0d0c5",
                            fontSize: 13,
                            color: "#8a4a3a",
                          }}
                        >
                          {bookingError}
                        </div>
                      )}

                      {/* ── Book button ────────────────── */}
                      {selectedSlotId && !bookingSuccess && (
                        <button
                          className="btn btn-primary"
                          disabled={bookingInProgress}
                          onClick={() => void handleBook()}
                          style={{ width: "100%" }}
                        >
                          {bookingInProgress ? (
                            "Booking…"
                          ) : (
                            <>
                              <CalendarCheck size={15} />
                              Book appointment
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── Actions ───────────────────────────── */}
                  <div
                    style={{ display: "flex", gap: 10, marginTop: 20 }}
                  >
                    <button
                      className="btn btn-primary"
                      onClick={() => toggleExpand(pro.id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={15} /> Close details
                        </>
                      ) : (
                        <>
                          <Calendar size={15} /> View profile
                        </>
                      )}
                    </button>

                    <button
                      className="btn btn-outline"
                      aria-label={`Message ${pro.name}`}
                      disabled={!pro.available}
                      title={
                        pro.available
                          ? `Message ${pro.name}`
                          : `${pro.name} is currently unavailable`
                      }
                      style={{ opacity: pro.available ? 1 : 0.45 }}
                    >
                      <MessageCircle size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      {/* ════════════════════════════════════════════════════
          INFO BOX
      ════════════════════════════════════════════════════ */}

      {!loading && !error && (
        <section className="info-box" style={{ marginTop: 24 }}>
          <CheckCircle2
            size={16}
            style={{
              verticalAlign: "middle",
              marginRight: 8,
              color: "#4d8f64",
            }}
          />
          Professionals on MindSync are shown with their verification status.
          You can explore options without committing to an appointment.
        </section>
      )}
    </main>
  );
}
