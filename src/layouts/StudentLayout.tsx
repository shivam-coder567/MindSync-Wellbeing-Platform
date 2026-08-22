import {
  HeartHandshake,
  House,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserRound,
  ClipboardCheck,
  ChartNoAxesCombined,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../supabaseClient";

import avatar1 from "../assets/avatars/avatar-1.svg";
import avatar2 from "../assets/avatars/avatar-2.svg";
import avatar3 from "../assets/avatars/avatar-3.svg";
import avatar4 from "../assets/avatars/avatar-4.svg";
import avatar5 from "../assets/avatars/avatar-5.svg";
import avatar6 from "../assets/avatars/avatar-6.svg";

const navItems = [
  {
    label: "Overview",
    path: "/student",
    icon: House,
    end: true,
  },
  {
    label: "AI Companion",
    path: "/student/ai",
    icon: Sparkles,
  },
  {
    label: "Daily check-in",
    path: "/student/check-in",
    icon: ClipboardCheck,
  },
  {
    label: "Professionals",
    path: "/student/professionals",
    icon: Stethoscope,
  },
  {
    label: "Messages",
    path: "/student/chat",
    icon: MessageCircle,
  },
  {
    label: "Recovery",
    path: "/student/recovery",
    icon: ChartNoAxesCombined,
  },
  {
    label: "My profile",
    path: "/student/profile",
    icon: UserRound,
  },
];

const titles: Record<string, string> = {
  "/student": "Overview",
  "/student/ai": "AI Companion",
  "/student/check-in": "Daily check-in",
  "/student/professionals": "Professionals",
  "/student/chat": "Messages",
  "/student/recovery": "Recovery",
  "/student/sos": "Get support now",
  "/student/profile": "My profile",
};

const BUILT_IN_AVATARS = [
  { id: "avatar-1", src: avatar1 },
  { id: "avatar-2", src: avatar2 },
  { id: "avatar-3", src: avatar3 },
  { id: "avatar-4", src: avatar4 },
  { id: "avatar-5", src: avatar5 },
  { id: "avatar-6", src: avatar6 },
];

export default function StudentLayout() {
  const location = useLocation();

  const title = titles[location.pathname] ?? "MindSync";

  const { profile, user, signOut } = useAuth();

  const displayName =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Student";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /*
   * Avatar information comes from the student's profile.
   *
   * avatarType:
   * - photo
   * - avatar
   * - initials
   *
   * avatarValue:
   * - storage path for uploaded photo
   * - avatar-1 ... avatar-6 for built-in avatars
   */

  const avatarType =
    (
      profile as
        | (typeof profile & {
            avatarType?: string | null;
            avatarValue?: string | null;
          })
        | null
    )?.avatarType || "initials";

  const avatarValue =
    (
      profile as
        | (typeof profile & {
            avatarType?: string | null;
            avatarValue?: string | null;
          })
        | null
    )?.avatarValue || "";

  let profileImage: string | null = null;

  // Uploaded photo
  if (avatarType === "photo" && avatarValue) {
    profileImage = supabase.storage
      .from("profile-photos")
      .getPublicUrl(avatarValue).data.publicUrl;
  }

  // Built-in MindSync avatar
  if (avatarType === "avatar" && avatarValue) {
    profileImage =
      BUILT_IN_AVATARS.find((avatar) => avatar.id === avatarValue)?.src || null;
  }

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <NavLink className="brand" to="/student">
          <span className="brand-mark">
            <HeartHandshake size={20} />
          </span>

          <span>
            <strong>MindSync</strong>
            <small>Your wellbeing space</small>
          </span>
        </NavLink>

        <span className="nav-label">Your space</span>

        <nav className="nav-list" aria-label="Student navigation">
          {navItems.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              end={end}
              to={path}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <p className="support-note">
            Need immediate support?
            <br />
            You do not have to go through it alone.
          </p>

          <NavLink className="sos-link" to="/student/sos">
            <ShieldAlert size={16} />
            Get help now
            <ChevronRight size={14} />
          </NavLink>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="content-shell">
        <header className="topbar">
          {/* Breadcrumb */}
          <div className="crumb">
            MindSync
            <span> / </span>
            <strong>{title}</strong>
          </div>

          {/* RIGHT SIDE */}
          <div
            className="topbar-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Student identity */}
            <NavLink
              to="/student/profile"
              aria-label="Open my profile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "6px 10px 6px 7px",
                borderRadius: 16,
                textDecoration: "none",
                color: "inherit",
                border: "1px solid rgba(52, 103, 87, 0.10)",
                background: "rgba(255, 255, 255, 0.72)",
                boxShadow: "0 3px 14px rgba(35, 82, 68, 0.06)",
                transition: "all 0.2s ease",
              }}
            >
              {/* Avatar */}
              <span
                style={{
                  position: "relative",
                  width: 42,
                  height: 42,
                  minWidth: 42,
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #dff0e5, #c8e4d0)",
                  color: "#286557",
                  fontSize: 14,
                  fontWeight: 800,
                  border: "2px solid rgba(255,255,255,0.95)",
                  boxShadow: "0 4px 12px rgba(35, 82, 68, 0.12)",
                }}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${displayName}'s profile`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  initials
                )}

                {/* Active indicator */}
                <span
                  style={{
                    position: "absolute",
                    right: 1,
                    bottom: 1,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#4fa36b",
                    border: "2px solid white",
                  }}
                />
              </span>

              {/* Name + role */}
              <span
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: 1.15,
                  minWidth: 70,
                }}
              >
                <strong
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#24483e",
                    maxWidth: 150,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName}
                </strong>

                <span
                  style={{
                    marginTop: 3,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    color: "#789088",
                    textTransform: "uppercase",
                  }}
                >
                  Student
                </span>
              </span>

              <ChevronRight
                size={15}
                style={{
                  color: "#789088",
                  marginLeft: 2,
                }}
              />
            </NavLink>

            {/* Sign out */}
            <button
              className="signout-button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              title="Sign out"
              style={{
                width: 42,
                height: 42,
                display: "grid",
                placeItems: "center",
                borderRadius: 13,
                border: "1px solid rgba(52, 103, 87, 0.12)",
                background: "rgba(255, 255, 255, 0.72)",
                color: "#52756a",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
