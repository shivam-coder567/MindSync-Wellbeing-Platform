import type { Student } from "../types/student";
import type { CheckIn } from "../types/checkIn";
import type { Professional } from "../types/professional";
import type { ChatMessage, Conversation } from "../types/chat";
import type { RecoveryRecord } from "../types/recovery";
import type { SOSEvent } from "../types/sos";

export const demoStudent: Student = {
  id: "student-001",
  name: "Demo Student",
  email: "student@mindsync.demo",
  college: "MindSync Demo University",
  riskLevel: "low",
  trustedContacts: [
    {
      id: "contact-001",
      name: "Demo Parent",
      phone: "0000000000",
      relationship: "Parent",
      location: "",
    },
  ],
  createdAt: "2026-08-15T08:00:00Z",
};

export const demoCheckIn: CheckIn = {
  id: "checkin-001",
  studentId: "student-001",
  mood: 3,
  stressLevel: 2,
  anxietyLevel: 2,
  note: "Feeling a little stressed today.",
  status: "completed",
  createdAt: "2026-08-15T08:00:00Z",
};

export const demoProfessional: Professional = {
  id: "professional-001",
  name: "Dr. Demo Professional",
  role: "psychologist",
  specialization: "Student Mental Health",
  verificationStatus: "verified",
  city: "Bengaluru",
  available: true,
  createdAt: "2026-08-01T08:00:00Z",
};

export const demoConversation: Conversation = {
  id: "conversation-001",
  studentId: "student-001",
  professionalId: "professional-001",
  lastMessageAt: "2026-08-15T08:10:00Z",
  createdAt: "2026-08-15T08:00:00Z",
};

export const demoMessage: ChatMessage = {
  id: "message-001",
  conversationId: "conversation-001",
  senderId: "student-001",
  senderType: "student",
  message: "I have been feeling stressed lately.",
  createdAt: "2026-08-15T08:10:00Z",
};

export const demoRecovery: RecoveryRecord = {
  id: "recovery-001",
  studentId: "student-001",
  status: "in_progress",
  moodAverage: 3.4,
  checkInCount: 5,
  goals: [
    {
      id: "goal-001",
      title: "Complete weekly check-in",
      completed: true,
    },
    {
      id: "goal-002",
      title: "Attend professional consultation",
      completed: false,
    },
  ],
  lastUpdatedAt: "2026-08-15T08:15:00Z",
};

export const demoSOSEvent: SOSEvent = {
  id: "sos-001",
  studentId: "student-001",
  status: "resolved",
  supportType: "trusted_contact",
  triggeredAt: "2026-08-14T18:30:00Z",
  resolvedAt: "2026-08-14T18:45:00Z",
};
