import {
  AlertTriangle,
  ChevronRight,
  Copy,
  HeartHandshake,
  LocateFixed,
  MapPin,
  MessageCircle,
  Phone,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";
import {
  getTrustedContacts,
  type TrustedContact,
} from "../../services/studentService";

type ApproximateLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export default function SOS() {
  const { profile } = useAuth();

  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<ApproximateLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [locationSharingApproved, setLocationSharingApproved] =
    useState(false);
  const [locationCopied, setLocationCopied] = useState(false);

  useEffect(() => {
    async function loadContacts() {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      try {
        setError("");
        const data = await getTrustedContacts(profile.id);
        setContacts(data);
      } catch (err) {
        console.error("Failed to load trusted contacts:", err);
        setError("Unable to load your trusted contacts.");
      } finally {
        setLoading(false);
      }
    }

    void loadContacts();
  }, [profile?.id]);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not available in this browser.");
      return;
    }

    setRequestingLocation(true);
    setLocationStatus("Waiting for location permission…");
    setLocationCopied(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus("");
        setRequestingLocation(false);
      },
      (positionError) => {
        const message =
          positionError.code === positionError.PERMISSION_DENIED
            ? "Location permission was not granted. You can still contact support without sharing your location."
            : positionError.code === positionError.TIMEOUT
              ? "We could not get your location in time. Please try again."
              : "Your location is unavailable right now. Please try again or continue without it.";

        setLocation(null);
        setLocationSharingApproved(false);
        setLocationStatus(message);
        setRequestingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    );
  }

  function stopUsingLocation() {
    setLocation(null);
    setLocationStatus("");
    setLocationSharingApproved(false);
    setLocationCopied(false);
  }

  async function copyApproximateLocation() {
    if (!location || !locationSharingApproved) return;

    const details = formatLocation(location);

    try {
      await navigator.clipboard.writeText(details);
      setLocationCopied(true);
      setLocationStatus("Approximate location copied. MindSync has not sent it to anyone.");
    } catch {
      setLocationStatus("We could not copy your location. You can continue without it.");
    }
  }

  return (
    <main className="page">
      {/* PAGE HEADER */}
      <section style={{ marginBottom: 22 }}>
        <p className="eyebrow" style={{ color: "#a44f3d", marginBottom: 6 }}>
          Immediate support
        </p>

        <h1 style={{ marginBottom: 8 }}>You don't have to face this alone.</h1>

        <p className="lead" style={{ maxWidth: 700 }}>
          Reach someone you trust or find immediate professional support when
          you need it.
        </p>
      </section>

      {/* EMERGENCY NOTICE */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 18px",
          marginBottom: 20,
          borderRadius: 14,
          background: "#fff7f3",
          border: "1px solid #f0d8d0",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            minWidth: 38,
            display: "grid",
            placeItems: "center",
            borderRadius: 11,
            background: "#f8ddd4",
            color: "#aa513e",
          }}
        >
          <ShieldAlert size={19} />
        </div>

        <div>
          <strong
            style={{
              display: "block",
              fontSize: 13,
              color: "#63372e",
            }}
          >
            If you are in immediate danger
          </strong>

          <span
            style={{
              fontSize: 12,
              color: "#80655e",
            }}
          >
            Contact your local emergency service or go to the nearest emergency
            department.
          </span>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section
        className="sos-support-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.65fr) minmax(280px, 0.8fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        {/* TRUSTED CONTACTS */}
        <article
          className="surface"
          style={{
            padding: 22,
            background: "#fffaf7",
            border: "1px solid #f0ddd5",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  background: "#f8ddd3",
                  color: "#b3533d",
                }}
              >
                <HeartHandshake size={21} />
              </div>

              <div>
                <h2 style={{ margin: 0, fontSize: 20 }}>Someone you trust</h2>

                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 12,
                    color: "#80655e",
                  }}
                >
                  Call or message a trusted contact.
                </p>
              </div>
            </div>

            <span
              style={{
                padding: "6px 9px",
                borderRadius: 999,
                background: "#edf6ef",
                color: "#47785a",
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {contacts.length} saved
            </span>
          </div>

          {/* LOADING */}
          {loading && (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: "#71817a",
                fontSize: 13,
              }}
            >
              Loading trusted contacts...
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#fff1ed",
                color: "#914c3d",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {/* EMPTY */}
          {!loading && !error && contacts.length === 0 && (
            <div
              style={{
                padding: 22,
                textAlign: "center",
                borderRadius: 12,
                background: "#f8fbf9",
                border: "1px dashed #d7e4dc",
              }}
            >
              <UserRound
                size={24}
                color="#789088"
                style={{ marginBottom: 6 }}
              />

              <strong
                style={{
                  display: "block",
                  fontSize: 13,
                  color: "#36594e",
                }}
              >
                No trusted contacts yet
              </strong>

              <p
                style={{
                  margin: "5px 0 12px",
                  fontSize: 12,
                  color: "#71817a",
                }}
              >
                Add someone you trust from your profile.
              </p>

              <Link
                to="/student/profile"
                className="btn btn-outline"
                style={{ fontSize: 12 }}
              >
                Add contact
                <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {/* CONTACTS */}
          {!loading && !error && contacts.length > 0 && (
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {contacts.map((contact) => {
                const initials = contact.name
                  .split(" ")
                  .filter(Boolean)
                  .map((part: string) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const message = `Hi ${contact.name}, I need some support right now. Please check in with me when you can.`;

                return (
                  <div
                    key={contact.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 13,
                      background: "#fff",
                      border: "1px solid #e3ebe6",
                    }}
                  >
                    {/* AVATAR */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        minWidth: 40,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        background: "#dcefe2",
                        color: "#376b57",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {initials}
                    </div>

                    {/* DETAILS */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          fontSize: 13,
                          color: "#294a40",
                        }}
                      >
                        {contact.name}
                      </strong>

                      <span
                        style={{
                          display: "block",
                          marginTop: 2,
                          fontSize: 11,
                          color: "#71817a",
                        }}
                      >
                        {contact.relationship} · {contact.phone}
                      </span>

                      {contact.location && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            marginTop: 3,
                            fontSize: 10,
                            color: "#789088",
                          }}
                        >
                          <MapPin size={11} />
                          {contact.location}
                        </span>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div
                      style={{
                        display: "flex",
                        gap: 7,
                      }}
                    >
                      <a
                        href={`tel:${contact.phone}`}
                        aria-label={`Call ${contact.name}`}
                        title={`Call ${contact.name}`}
                        style={{
                          width: 38,
                          height: 38,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: 10,
                          background: "#e9f4ec",
                          color: "#3f7c58",
                          border: "1px solid #d8e9dc",
                          textDecoration: "none",
                        }}
                      >
                        <Phone size={16} />
                      </a>

                      <a
                        href={`sms:${contact.phone}?body=${encodeURIComponent(message)}`}
                        aria-label={`Message ${contact.name}`}
                        title={`Message ${contact.name}`}
                        style={{
                          width: 38,
                          height: 38,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: 10,
                          background: "#edf5f8",
                          color: "#477889",
                          border: "1px solid #dbe9ed",
                          textDecoration: "none",
                        }}
                      >
                        <MessageCircle size={16} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MANAGE */}
          {contacts.length > 0 && (
            <Link
              to="/student/profile"
              className="text-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 14,
                fontSize: 12,
              }}
            >
              Manage trusted contacts
              <ChevronRight size={13} />
            </Link>
          )}
        </article>

        {/* RIGHT SIDE */}
        <aside
          className="surface"
          style={{
            padding: 22,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              borderRadius: 12,
              background: "#f8ddd4",
              color: "#aa513e",
              marginBottom: 14,
            }}
          >
            <AlertTriangle size={21} />
          </div>

          <h2
            style={{
              margin: "0 0 7px",
              fontSize: 20,
            }}
          >
            Need immediate help?
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.6,
              color: "#71817a",
            }}
          >
            If you are in immediate danger, contact your local emergency
            service.
          </p>

          {/* EMERGENCY */}
          <button
            type="button"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 11,
              marginTop: 18,
              padding: 13,
              borderRadius: 12,
              background: "#fff7f3",
              border: "1px solid #f0ddd5",
              textAlign: "left",
              cursor: "pointer",
            }}
            onClick={() => {
              window.alert(
                "Please use your local emergency number or go to the nearest emergency department.",
              );
            }}
          >
            <ShieldAlert size={19} color="#aa513e" />

            <span>
              <strong
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#3b4944",
                }}
              >
                Local emergency services
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: 2,
                  fontSize: 10,
                  color: "#80655e",
                }}
              >
                Get immediate emergency help
              </span>
            </span>
          </button>

          {/* PROFESSIONAL */}
          <Link
            to="/student/professionals"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              marginTop: 9,
              padding: 13,
              borderRadius: 12,
              background: "#f8fbf9",
              border: "1px solid #e1ebe5",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <UserRound size={19} color="#4d8064" />

            <span style={{ flex: 1 }}>
              <strong
                style={{
                  display: "block",
                  fontSize: 12,
                }}
              >
                Talk to a professional
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: 2,
                  fontSize: 10,
                  color: "#71817a",
                }}
              >
                Find mental health support
              </span>
            </span>

            <ChevronRight size={15} color="#789088" />
          </Link>

          {/* AI */}
          <Link
            to="/student/ai"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              marginTop: 9,
              padding: 13,
              borderRadius: 12,
              background: "#f8fbf9",
              border: "1px solid #e1ebe5",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <MessageCircle size={19} color="#4d8064" />

            <span style={{ flex: 1 }}>
              <strong
                style={{
                  display: "block",
                  fontSize: 12,
                }}
              >
                Talk to AI Companion
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: 2,
                  fontSize: 10,
                  color: "#71817a",
                }}
              >
                Put your thoughts into words
              </span>
            </span>

            <ChevronRight size={15} color="#789088" />
          </Link>
        </aside>
      </section>

      <section
        className="surface"
        aria-labelledby="location-support-title"
        style={{
          marginTop: 18,
          padding: 22,
          border: "1px solid #dfe9e2",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <span
              style={{
                width: 42,
                height: 42,
                minWidth: 42,
                display: "grid",
                placeItems: "center",
                borderRadius: 12,
                background: "#e9f4ec",
                color: "#3f7c58",
              }}
            >
              <MapPin size={20} />
            </span>
            <div>
              <h2 id="location-support-title" style={{ margin: "0 0 5px", fontSize: 20 }}>
                Location support
              </h2>
              <p style={{ margin: 0, color: "#71817a", fontSize: 13, lineHeight: 1.55 }}>
                Use your approximate location only if it would help you explain
                where you are. MindSync does not track or share it automatically.
              </p>
            </div>
          </div>

          {!location && (
            <button
              className="btn btn-outline"
              type="button"
              onClick={requestLocation}
              disabled={requestingLocation}
              aria-busy={requestingLocation}
              style={{ flex: "0 0 auto" }}
            >
              <LocateFixed size={16} />
              {requestingLocation ? "Getting location…" : "Use my location"}
            </button>
          )}
        </div>

        {locationStatus && !location && (
          <p role="status" style={{ margin: "15px 0 0", color: "#71817a", fontSize: 13, lineHeight: 1.5 }}>
            {locationStatus}
          </p>
        )}

        {location && (
          <div
            style={{
              marginTop: 18,
              padding: "16px 17px",
              borderRadius: 13,
              background: "#f8fbf9",
              border: "1px solid #e1ebe5",
            }}
          >
            <div className="sos-location-summary">
              <div>
                <strong style={{ display: "block", color: "#315347", fontSize: 14 }}>
                  Approximate location ready
                </strong>
                <span style={{ display: "block", marginTop: 4, color: "#71817a", fontSize: 12 }}>
                  {formatLocation(location)} · accuracy about {formatAccuracy(location.accuracy)}
                </span>
              </div>
              <button className="btn btn-outline" type="button" onClick={stopUsingLocation}>
                <X size={15} />
                Stop using location
              </button>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 9,
                marginTop: 16,
                color: "#516b61",
                fontSize: 13,
                lineHeight: 1.5,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={locationSharingApproved}
                onChange={(event) => {
                  setLocationSharingApproved(event.target.checked);
                  setLocationCopied(false);
                  setLocationStatus("");
                }}
                style={{ marginTop: 3 }}
              />
              I want to use this approximate location when I manually share it.
            </label>

            <div className="sos-location-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={copyApproximateLocation}
                disabled={!locationSharingApproved}
              >
                <Copy size={16} />
                Copy approximate location
              </button>
              <span style={{ color: "#71817a", fontSize: 12, lineHeight: 1.45 }}>
                {locationCopied
                  ? "Copied for you to paste into a message."
                  : "Nothing is sent or stored by MindSync."}
              </span>
            </div>

            {locationStatus && (
              <p role="status" style={{ margin: "12px 0 0", color: "#51766a", fontSize: 12, lineHeight: 1.5 }}>
                {locationStatus}
              </p>
            )}
          </div>
        )}
      </section>

      {/* SMALL DISCLAIMER */}
      <div
        className="info-box"
        style={{
          marginTop: 16,
          fontSize: 11,
        }}
      >
        <ShieldAlert
          size={14}
          style={{
            verticalAlign: "middle",
            marginRight: 6,
          }}
        />
        MindSync does not automatically contact emergency services.
      </div>
    </main>
  );
}

function formatLocation(location: ApproximateLocation) {
  return `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
}

function formatAccuracy(accuracy: number) {
  return `${Math.round(accuracy)} m`;
}
