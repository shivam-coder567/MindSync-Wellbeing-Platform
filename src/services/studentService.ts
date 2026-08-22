import { supabase } from "../supabaseClient";
import type { StudentProfile } from "../types/auth";

type StudentRow = {
  id: string;
  name: string | null;
  email: string | null;
  college: string | null;
  risk_level: "low" | "medium" | "high" | null;
  created_at: string | null;
  avatar_type: "initials" | "avatar" | "photo" | null;
  avatar_value: string | null;
};

export type TrustedContact = {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  location: string | null;
};

export async function getStudentProfileForAuthUser(
  authUserId: string,
): Promise<StudentProfile | null> {
  const { data: link, error: linkError } = await supabase
    .from("student_auth_accounts")
    .select("student_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (linkError) throw linkError;

  if (!link) return null;

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select(
      "id, name, email, college, risk_level, created_at, avatar_type, avatar_value",
    )
    .eq("id", link.student_id)
    .maybeSingle();

  if (studentError) throw studentError;

  if (!student) return null;

  const row = student as StudentRow;

  return {
    id: row.id,
    name: row.name || "",
    email: row.email || "",
    college: row.college || "",
    riskLevel: row.risk_level || "low",
    createdAt: row.created_at || "",
    avatarType: row.avatar_type || "initials",
    avatarValue: row.avatar_value || null,
  };
}

/**
 * Creates the signed-in Auth user's students row and mapping when missing.
 * Does not build a profile locally: callers must re-read via
 * getStudentProfileForAuthUser after this returns.
 */
export async function ensureStudentProfileForAuthUser(): Promise<void> {
  const { error } = await supabase.rpc("ensure_student_profile");

  if (error) throw error;
}

export async function getTrustedContacts(
  studentId: string,
): Promise<TrustedContact[]> {
  const { data, error } = await supabase
    .from("trusted_contacts")
    .select("id, name, phone, relationship, location")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []) as TrustedContact[];
}

export async function addTrustedContact(
  studentId: string,
  contact: {
    name: string;
    phone: string;
    relationship: string;
    location?: string;
  },
): Promise<TrustedContact> {
  const { data, error } = await supabase
    .from("trusted_contacts")
    .insert({
      student_id: studentId,
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      location: contact.location || null,
    })
    .select("id, name, phone, relationship, location")
    .single();

  if (error) throw error;

  return data as TrustedContact;
}

export async function updateTrustedContact(
  contactId: string,
  contact: {
    name: string;
    phone: string;
    relationship: string;
    location?: string;
  },
): Promise<TrustedContact> {
  const { data, error } = await supabase
    .from("trusted_contacts")
    .update({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      location: contact.location || null,
    })
    .eq("id", contactId)
    .select("id, name, phone, relationship, location")
    .single();

  if (error) throw error;

  return data as TrustedContact;
}

export async function deleteTrustedContact(contactId: string): Promise<void> {
  const { error } = await supabase
    .from("trusted_contacts")
    .delete()
    .eq("id", contactId);

  if (error) throw error;
}
