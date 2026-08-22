import {
  AlertTriangle,
  Camera,
  Check,
  ImagePlus,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { deleteAuthenticatedAccount } from "../../services/accountDeletionService";
import {
  addTrustedContact,
  deleteTrustedContact,
  getTrustedContacts,
  updateTrustedContact,
  type TrustedContact,
} from "../../services/studentService";
import { supabase } from "../../supabaseClient";

import avatar1 from "../../assets/avatars/avatar-1.svg";
import avatar2 from "../../assets/avatars/avatar-2.svg";
import avatar3 from "../../assets/avatars/avatar-3.svg";
import avatar4 from "../../assets/avatars/avatar-4.svg";
import avatar5 from "../../assets/avatars/avatar-5.svg";
import avatar6 from "../../assets/avatars/avatar-6.svg";

const BUILT_IN_AVATARS = [
  { id: "avatar-1", src: avatar1 },
  { id: "avatar-2", src: avatar2 },
  { id: "avatar-3", src: avatar3 },
  { id: "avatar-4", src: avatar4 },
  { id: "avatar-5", src: avatar5 },
  { id: "avatar-6", src: avatar6 },
];

type ContactForm = {
  name: string;
  phone: string;
  relationship: string;
  location: string;
};

const EMPTY_CONTACT_FORM: ContactForm = {
  name: "",
  phone: "",
  relationship: "",
  location: "",
};

export default function Profile() {
  const { profile, user, session, refreshProfile, clearLocalSession } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // -----------------------------------------
  // GENERAL STATE
  // -----------------------------------------

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showAvatars, setShowAvatars] = useState(false);

  // -----------------------------------------
  // EDIT PROFILE
  // -----------------------------------------

  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCollege, setEditCollege] = useState("");

  // -----------------------------------------
  // TRUSTED CONTACTS
  // -----------------------------------------

  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactError, setContactError] = useState("");

  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const [contactForm, setContactForm] =
    useState<ContactForm>(EMPTY_CONTACT_FORM);

  // -----------------------------------------
  // ACCOUNT DELETION
  // -----------------------------------------

  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // -----------------------------------------
  // LOAD TRUSTED CONTACTS
  // -----------------------------------------

  useEffect(() => {
    async function loadTrustedContacts() {
      if (!profile?.id) {
        setTrustedContacts([]);
        setContactsLoading(false);
        return;
      }

      setContactsLoading(true);
      setContactError("");

      try {
        const contacts = await getTrustedContacts(profile.id);
        setTrustedContacts(contacts);
      } catch (error) {
        console.error(error);
        setContactError("Unable to load trusted contacts.");
      } finally {
        setContactsLoading(false);
      }
    }

    void loadTrustedContacts();
  }, [profile?.id]);

  // -----------------------------------------
  // BASIC PROFILE DATA
  // -----------------------------------------

  const name =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Student";

  const email = profile?.email || user?.email || "";

  const college = profile?.college || "Student record not linked";

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarType = profile?.avatarType || "initials";
  const avatarValue = profile?.avatarValue || "";

  // -----------------------------------------
  // PROFILE IMAGE
  // -----------------------------------------

  const photoUrl =
    avatarType === "photo" && avatarValue
      ? supabase.storage.from("profile-photos").getPublicUrl(avatarValue).data
          .publicUrl
      : null;

  const avatarUrl =
    avatarType === "avatar"
      ? BUILT_IN_AVATARS.find((avatar) => avatar.id === avatarValue)?.src ||
        null
      : null;

  const currentImage = photoUrl || avatarUrl;

  // -----------------------------------------
  // SAVE AVATAR / INITIALS
  // -----------------------------------------

  async function saveAvatar(
    type: "initials" | "avatar" | "photo",
    value: string | null,
  ) {
    if (!profile) {
      setMessage("Your student profile is not linked yet.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("students")
        .update({
          avatar_type: type,
          avatar_value: value,
        })
        .eq("id", profile.id);

      if (error) throw error;

      await refreshProfile();

      setShowAvatars(false);
      setMessage("Profile avatar updated.");
    } catch (error) {
      console.error(error);
      setMessage("Could not update your avatar. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // -----------------------------------------
  // PHOTO UPLOAD
  // -----------------------------------------

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !profile || !user) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Please choose an image smaller than 2 MB.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const extension =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "jpg";

      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const oldPath =
        profile.avatarType === "photo" ? profile.avatarValue : null;

      const { error: updateError } = await supabase
        .from("students")
        .update({
          avatar_type: "photo",
          avatar_value: path,
        })
        .eq("id", profile.id);

      if (updateError) {
        await supabase.storage.from("profile-photos").remove([path]);
        throw updateError;
      }

      if (oldPath) {
        await supabase.storage.from("profile-photos").remove([oldPath]);
      }

      await refreshProfile();

      setMessage("Profile photo uploaded successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Could not upload the photo. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // -----------------------------------------
  // REMOVE PHOTO
  // -----------------------------------------

  async function removePhoto() {
    if (!profile || profile.avatarType !== "photo" || !profile.avatarValue) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const oldPath = profile.avatarValue;

      const { error } = await supabase
        .from("students")
        .update({
          avatar_type: "initials",
          avatar_value: null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      await supabase.storage.from("profile-photos").remove([oldPath]);

      await refreshProfile();

      setMessage("Profile photo removed.");
    } catch (error) {
      console.error(error);
      setMessage("Could not remove the photo.");
    } finally {
      setBusy(false);
    }
  }

  // -----------------------------------------
  // EDIT PROFILE
  // -----------------------------------------

  function openEditProfile() {
    setEditName(profile?.name || "");
    setEditCollege(profile?.college || "");
    setMessage("");
    setEditingProfile(true);
  }

  function closeEditProfile() {
    if (busy) return;

    setEditingProfile(false);
    setMessage("");
  }

  async function saveProfileDetails() {
    if (!profile) {
      setMessage("Your student profile is not linked yet.");
      return;
    }

    const trimmedName = editName.trim();
    const trimmedCollege = editCollege.trim();

    if (!trimmedName) {
      setMessage("Please enter your name.");
      return;
    }

    if (!trimmedCollege) {
      setMessage("Please enter your college.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("students")
        .update({
          name: trimmedName,
          college: trimmedCollege,
        })
        .eq("id", profile.id);

      if (error) throw error;

      await refreshProfile();

      setEditingProfile(false);
      setMessage("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Could not update your profile.");
    } finally {
      setBusy(false);
    }
  }

  // -----------------------------------------
  // CONTACT FORM
  // -----------------------------------------

  function openAddContact() {
    setEditingContactId(null);
    setContactForm(EMPTY_CONTACT_FORM);
    setContactError("");
    setShowContactForm(true);
  }

  function openEditContact(contact: TrustedContact) {
    setEditingContactId(contact.id);

    setContactForm({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      location: contact.location || "",
    });

    setContactError("");
    setShowContactForm(true);
  }

  function closeContactForm() {
    if (busy) return;

    setShowContactForm(false);
    setEditingContactId(null);
    setContactForm(EMPTY_CONTACT_FORM);
    setContactError("");
  }

  function updateContactField(field: keyof ContactForm, value: string) {
    setContactForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveTrustedContact() {
    if (!profile) {
      setContactError("Your student profile is not linked yet.");
      return;
    }

    const nameValue = contactForm.name.trim();
    const phoneValue = contactForm.phone.trim();
    const relationshipValue = contactForm.relationship.trim();
    const locationValue = contactForm.location.trim();

    if (!nameValue || !phoneValue || !relationshipValue) {
      setContactError(
        "Please enter the contact name, phone number, and relationship.",
      );
      return;
    }

    setBusy(true);
    setContactError("");

    try {
      if (editingContactId) {
        const updated = await updateTrustedContact(editingContactId, {
          name: nameValue,
          phone: phoneValue,
          relationship: relationshipValue,
          location: locationValue,
        });

        setTrustedContacts((current) =>
          current.map((contact) =>
            contact.id === updated.id ? updated : contact,
          ),
        );
      } else {
        const created = await addTrustedContact(profile.id, {
          name: nameValue,
          phone: phoneValue,
          relationship: relationshipValue,
          location: locationValue,
        });

        setTrustedContacts((current) => [...current, created]);
      }

      closeContactForm();
      setMessage(
        editingContactId
          ? "Trusted contact updated."
          : "Trusted contact added.",
      );
    } catch (error) {
      console.error(error);
      setContactError("Could not save the trusted contact.");
    } finally {
      setBusy(false);
    }
  }

  // -----------------------------------------
  // DELETE CONTACT
  // -----------------------------------------

  async function handleDeleteContact(contactId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this trusted contact?",
    );

    if (!confirmed) return;

    setBusy(true);
    setContactError("");

    try {
      await deleteTrustedContact(contactId);

      setTrustedContacts((current) =>
        current.filter((contact) => contact.id !== contactId),
      );

      setMessage("Trusted contact removed.");
    } catch (error) {
      console.error(error);
      setContactError("Could not remove the trusted contact.");
    } finally {
      setBusy(false);
    }
  }

  // -----------------------------------------
  // ACCOUNT DELETION
  // -----------------------------------------

  function openDeleteAccount() {
    setDeleteConfirmation("");
    setDeleteAccountError("");
    setShowDeleteAccount(true);
  }

  function closeDeleteAccount() {
    if (deletingAccount) return;

    setShowDeleteAccount(false);
    setDeleteConfirmation("");
    setDeleteAccountError("");
  }

  async function confirmAccountDeletion() {
    if (deletingAccount || deleteConfirmation !== "DELETE") return;

    if (!session?.access_token) {
      setDeleteAccountError("Your session has expired. Please sign in again.");
      return;
    }

    setDeletingAccount(true);
    setDeleteAccountError("");

    try {
      await deleteAuthenticatedAccount(session.access_token);

      // The trusted endpoint has confirmed deletion. Clear in-memory page data
      // and the browser's Supabase session before returning to the auth screen.
      setTrustedContacts([]);
      await clearLocalSession();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Account deletion failed:", error);
      setDeleteAccountError(
        error instanceof Error
          ? error.message
          : "Your account could not be deleted. Please try again.",
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  // -----------------------------------------
  // RENDER
  // -----------------------------------------

  return (
    <main className="page">
      <p className="eyebrow">Your personal space</p>

      <h1>My profile</h1>

      <p className="lead">
        Keep your details and support preferences in one calm, secure place.
      </p>

      <section className="profile-layout">
        {/* =====================================
            LEFT PROFILE CARD
        ====================================== */}

        <aside className="surface profile-summary">
          <div
            className="profile-large-avatar"
            style={{
              overflow: "hidden",
              padding: 0,
            }}
          >
            {currentImage ? (
              <img
                src={currentImage}
                alt={`${name}'s profile`}
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
          </div>

          <h2>{name}</h2>

          <p>{college}</p>

          <span className="tag">
            <ShieldCheck
              size={13}
              style={{
                verticalAlign: "middle",
                marginRight: 4,
              }}
            />
            {profile ? `${profile.riskLevel} support need` : "Profile pending"}
          </span>

          {/* Upload */}
          <button
            className="btn btn-outline"
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              marginTop: 24,
            }}
          >
            <Camera size={15} />
            {busy ? "Updating…" : "Upload photo"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            style={{ display: "none" }}
          />

          {/* Avatar */}
          <button
            className="btn btn-outline"
            type="button"
            disabled={busy}
            onClick={() => setShowAvatars((current) => !current)}
            style={{
              width: "100%",
              marginTop: 10,
            }}
          >
            <ImagePlus size={15} />
            Choose MindSync avatar
          </button>

          {/* Remove photo */}
          {avatarType === "photo" && (
            <button
              className="btn btn-outline"
              type="button"
              disabled={busy}
              onClick={removePhoto}
              style={{
                width: "100%",
                marginTop: 10,
              }}
            >
              <Trash2 size={15} />
              Remove photo
            </button>
          )}

          {/* Avatar picker */}
          {showAvatars && (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                border: "1px solid #dce7df",
                borderRadius: 16,
                background: "#f8fbf8",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <strong style={{ fontSize: 14 }}>Choose your avatar</strong>

                <button
                  type="button"
                  onClick={() => setShowAvatars(false)}
                  style={{
                    border: 0,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <X size={17} />
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                }}
              >
                {BUILT_IN_AVATARS.map((avatar) => {
                  const selected =
                    avatarType === "avatar" && avatarValue === avatar.id;

                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      disabled={busy}
                      onClick={() => saveAvatar("avatar", avatar.id)}
                      style={{
                        position: "relative",
                        padding: 3,
                        border: selected
                          ? "3px solid #286557"
                          : "1px solid #dce7df",
                        borderRadius: 14,
                        background: "#fff",
                        cursor: busy ? "wait" : "pointer",
                      }}
                    >
                      <img
                        src={avatar.src}
                        alt="MindSync avatar"
                        style={{
                          width: "100%",
                          display: "block",
                          borderRadius: 10,
                        }}
                      />

                      {selected && (
                        <span
                          style={{
                            position: "absolute",
                            top: 3,
                            right: 3,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "#286557",
                            color: "#fff",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <Check size={14} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {message && (
            <p
              role="status"
              style={{
                margin: "12px 0 0",
                fontSize: 13,
                color: "#4c705f",
                lineHeight: 1.45,
              }}
            >
              {message}
            </p>
          )}

          {/* Edit */}
          <button
            className="btn btn-outline"
            type="button"
            disabled={busy}
            onClick={openEditProfile}
            style={{
              width: "100%",
              marginTop: 12,
            }}
          >
            <Pencil size={15} />
            Edit profile
          </button>
        </aside>

        {/* =====================================
            RIGHT SIDE
        ====================================== */}

        <div>
          {/* ACCOUNT DETAILS */}

          <article className="surface details-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 5,
              }}
            >
              <h2>Account details</h2>

              <UserRound color="#4c8c64" size={21} />
            </div>

            <div className="detail-row">
              <span>Name</span>
              <strong>{name}</strong>
            </div>

            <div className="detail-row">
              <span>Email</span>

              <strong>
                <Mail
                  size={14}
                  style={{
                    verticalAlign: "middle",
                    marginRight: 6,
                  }}
                />
                {email}
              </strong>
            </div>

            <div className="detail-row">
              <span>College</span>

              <strong>
                <MapPin
                  size={14}
                  style={{
                    verticalAlign: "middle",
                    marginRight: 6,
                  }}
                />
                {college}
              </strong>
            </div>

            <div className="detail-row">
              <span>Member since</span>

              <strong>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </strong>
            </div>
          </article>

          {/* =====================================
              TRUSTED CONTACTS
          ====================================== */}

          <article
            className="surface details-card"
            style={{
              marginTop: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                  }}
                >
                  <UserRoundPlus size={22} color="#4c8c64" />

                  <h2 style={{ margin: 0 }}>Trusted contacts</h2>
                </div>

                <p
                  style={{
                    margin: "8px 0 0",
                  }}
                >
                  People you trust for support and emergency situations.
                </p>
              </div>

              <button
                className="btn btn-primary"
                type="button"
                disabled={busy}
                onClick={openAddContact}
              >
                <Plus size={16} />
                Add contact
              </button>
            </div>

            {contactError && (
              <p
                role="alert"
                style={{
                  margin: "0 0 16px",
                  padding: 12,
                  borderRadius: 10,
                  background: "#fff3f0",
                  color: "#a3483c",
                  fontSize: 13,
                }}
              >
                {contactError}
              </p>
            )}

            {contactsLoading ? (
              <div className="empty-state">Loading trusted contacts…</div>
            ) : trustedContacts.length === 0 ? (
              <div
                className="empty-state"
                style={{
                  padding: "34px 20px",
                }}
              >
                <UserRoundPlus
                  size={30}
                  style={{
                    marginBottom: 10,
                    opacity: 0.55,
                  }}
                />

                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 5,
                  }}
                >
                  No trusted contact yet
                </div>

                <div>
                  Add someone you trust so they can be part of your support
                  network.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                }}
              >
                {trustedContacts.map((contact) => (
                  <div
                    key={contact.id}
                    style={{
                      border: "1px solid #dce7df",
                      borderRadius: 16,
                      padding: 18,
                      background: "#fbfdfb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: "0 0 5px",
                          }}
                        >
                          {contact.name}
                        </h3>

                        <span
                          className="tag"
                          style={{
                            display: "inline-flex",
                          }}
                        >
                          {contact.relationship}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          aria-label={`Edit ${contact.name}`}
                          onClick={() => openEditContact(contact)}
                          disabled={busy}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border: "1px solid #dce7df",
                            background: "#fff",
                            cursor: "pointer",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          aria-label={`Delete ${contact.name}`}
                          onClick={() => handleDeleteContact(contact.id)}
                          disabled={busy}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border: "1px solid #ead8d5",
                            background: "#fff",
                            color: "#a3483c",
                            cursor: "pointer",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 10,
                        marginTop: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 14,
                        }}
                      >
                        <Phone size={15} />
                        <span>{contact.phone}</span>
                      </div>

                      {contact.location && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 14,
                          }}
                        >
                          <MapPin size={15} />
                          <span>{contact.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="danger-zone" aria-labelledby="danger-zone-title">
        <div>
          <p className="danger-zone-label">Danger Zone</p>
          <h2 id="danger-zone-title">Delete your MindSync account</h2>
          <p>
            Your account and associated personal data will be permanently
            removed. This action cannot be undone.
          </p>
        </div>

        <button
          className="btn btn-danger-outline"
          type="button"
          onClick={openDeleteAccount}
          disabled={busy}
        >
          <Trash2 size={16} />
          Delete account
        </button>
      </section>

      {/* =========================================
          EDIT PROFILE MODAL
      ========================================== */}

      {editingProfile && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditProfile();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(18, 43, 36, 0.38)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            style={{
              width: "min(560px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 24,
              boxShadow: "0 24px 70px rgba(20, 55, 45, 0.22)",
              border: "1px solid #dce7df",
            }}
          >
            <div
              style={{
                padding: "24px 28px",
                borderBottom: "1px solid #e4ece7",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <p className="eyebrow" style={{ marginBottom: 6 }}>
                  Personal details
                </p>

                <h2
                  id="edit-profile-title"
                  style={{
                    margin: 0,
                    fontSize: 28,
                  }}
                >
                  Edit profile
                </h2>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#668077",
                  }}
                >
                  Keep your personal information up to date.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditProfile}
                disabled={busy}
                aria-label="Close edit profile"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: "1px solid #dce7df",
                  background: "#f8fbf8",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <X size={19} />
              </button>
            </div>

            <div
              style={{
                padding: 28,
              }}
            >
              <label
                htmlFor="profile-name"
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Name
              </label>

              <input
                id="profile-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                disabled={busy}
                placeholder="Your name"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 15px",
                  border: "1px solid #cfded5",
                  borderRadius: 12,
                  marginBottom: 20,
                  font: "inherit",
                  outline: "none",
                }}
              />

              <label
                htmlFor="profile-college"
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                College
              </label>

              <input
                id="profile-college"
                value={editCollege}
                onChange={(event) => setEditCollege(event.target.value)}
                disabled={busy}
                placeholder="Your college"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 15px",
                  border: "1px solid #cfded5",
                  borderRadius: 12,
                  marginBottom: 24,
                  font: "inherit",
                  outline: "none",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={closeEditProfile}
                  disabled={busy}
                >
                  <X size={16} />
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={saveProfileDetails}
                  disabled={busy}
                >
                  <Save size={16} />
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          TRUSTED CONTACT MODAL
      ========================================== */}

      {showContactForm && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeContactForm();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1001,
            background: "rgba(18, 43, 36, 0.38)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trusted-contact-title"
            style={{
              width: "min(560px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 24,
              boxShadow: "0 24px 70px rgba(20, 55, 45, 0.22)",
              border: "1px solid #dce7df",
            }}
          >
            <div
              style={{
                padding: "24px 28px",
                borderBottom: "1px solid #e4ece7",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <p className="eyebrow" style={{ marginBottom: 6 }}>
                  Your support network
                </p>

                <h2
                  id="trusted-contact-title"
                  style={{
                    margin: 0,
                    fontSize: 28,
                  }}
                >
                  {editingContactId
                    ? "Edit trusted contact"
                    : "Add trusted contact"}
                </h2>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#668077",
                  }}
                >
                  Someone you trust for support and emergency situations.
                </p>
              </div>

              <button
                type="button"
                onClick={closeContactForm}
                disabled={busy}
                aria-label="Close trusted contact form"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: "1px solid #dce7df",
                  background: "#f8fbf8",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <X size={19} />
              </button>
            </div>

            <div style={{ padding: 28 }}>
              {contactError && (
                <p
                  role="alert"
                  style={{
                    margin: "0 0 18px",
                    padding: 12,
                    borderRadius: 10,
                    background: "#fff3f0",
                    color: "#a3483c",
                    fontSize: 13,
                  }}
                >
                  {contactError}
                </p>
              )}

              <label
                htmlFor="contact-name"
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Name
              </label>

              <input
                id="contact-name"
                value={contactForm.name}
                onChange={(event) =>
                  updateContactField("name", event.target.value)
                }
                disabled={busy}
                placeholder="e.g. Vishwas"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  border: "1px solid #cfded5",
                  borderRadius: 12,
                  marginBottom: 18,
                  font: "inherit",
                }}
              />

              <label
                htmlFor="contact-phone"
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Phone number
              </label>

              <input
                id="contact-phone"
                type="tel"
                value={contactForm.phone}
                onChange={(event) =>
                  updateContactField("phone", event.target.value)
                }
                disabled={busy}
                placeholder="e.g. 92639 67547"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  border: "1px solid #cfded5",
                  borderRadius: 12,
                  marginBottom: 18,
                  font: "inherit",
                }}
              />

              <label
                htmlFor="contact-relationship"
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Relationship
              </label>

              <input
                id="contact-relationship"
                value={contactForm.relationship}
                onChange={(event) =>
                  updateContactField("relationship", event.target.value)
                }
                disabled={busy}
                placeholder="e.g. Friend, Parent, Sibling"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  border: "1px solid #cfded5",
                  borderRadius: 12,
                  marginBottom: 18,
                  font: "inherit",
                }}
              />

              <label
                htmlFor="contact-location"
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Location
              </label>

              <input
                id="contact-location"
                value={contactForm.location}
                onChange={(event) =>
                  updateContactField("location", event.target.value)
                }
                disabled={busy}
                placeholder="e.g. Bengaluru"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  border: "1px solid #cfded5",
                  borderRadius: 12,
                  marginBottom: 24,
                  font: "inherit",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={closeContactForm}
                  disabled={busy}
                >
                  <X size={16} />
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={saveTrustedContact}
                  disabled={busy}
                >
                  <Save size={16} />
                  {busy
                    ? "Saving…"
                    : editingContactId
                      ? "Save changes"
                      : "Add contact"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteAccount && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteAccount();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1002,
            background: "rgba(18, 43, 36, 0.38)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            style={{
              width: "min(520px, 100%)",
              borderRadius: 20,
              background: "#fff",
              boxShadow: "0 24px 80px rgba(20, 48, 39, 0.22)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "28px 28px 24px" }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 12,
                  color: "#a3483c",
                  background: "#fff1ed",
                }}
              >
                <AlertTriangle size={21} />
              </div>

              <p className="danger-zone-label" style={{ marginTop: 18 }}>
                Permanent action
              </p>
              <h2 id="delete-account-title" style={{ margin: "4px 0 10px", fontSize: 25 }}>
                Delete your account?
              </h2>
              <p style={{ margin: 0, color: "#6c7873", lineHeight: 1.6, fontSize: 14 }}>
                This permanently removes your MindSync account and associated
                personal data. Type <strong style={{ color: "#324b42" }}>DELETE</strong>{" "}
                below to confirm.
              </p>

              <label
                htmlFor="delete-account-confirmation"
                style={{ display: "block", marginTop: 22, color: "#466058", fontSize: 13, fontWeight: 700 }}
              >
                Confirmation
              </label>
              <input
                id="delete-account-confirmation"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder="Type DELETE"
                autoComplete="off"
                disabled={deletingAccount}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "12px 13px",
                  border: "1px solid #d8e2dc",
                  borderRadius: 9,
                  color: "#2d493f",
                  outline: "none",
                }}
              />

              {deleteAccountError && (
                <p role="alert" style={{ margin: "12px 0 0", color: "#a3483c", fontSize: 13, lineHeight: 1.5 }}>
                  {deleteAccountError}
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                padding: "18px 28px",
                borderTop: "1px solid #edf1ee",
                background: "#fbfdfb",
              }}
            >
              <button className="btn btn-outline" type="button" onClick={closeDeleteAccount} disabled={deletingAccount}>
                Cancel
              </button>
              <button
                className="btn btn-danger-solid"
                type="button"
                onClick={confirmAccountDeletion}
                disabled={deleteConfirmation !== "DELETE" || deletingAccount}
              >
                <Trash2 size={16} />
                {deletingAccount ? "Deleting account…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
