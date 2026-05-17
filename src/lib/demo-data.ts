/**
 * Slim shim for UI components that still import constants from `demo-data`.
 * The source of truth for everything operational is the SQLite database (see
 * src/lib/db.ts and src/server/repositories). These exports only provide
 * presentational defaults for the time-block layout used by static grids.
 */

export const days = ["Lun", "Mar", "Mié", "Jue", "Vie"];
export const daysEn = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export type TimeBlockType = "CLASS" | "BREAK" | "MINI_BREAK" | "LUNCH";

export type TimeBlock = {
  blockIndex: number | null;
  label: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type: TimeBlockType;
  isAssignable: boolean;
  breakLabel?: string;
};

export const timeBlocks: TimeBlock[] = [
  { blockIndex: 1, label: "08:15 - 09:15", startTime: "08:15", endTime: "09:15", durationMinutes: 60, type: "CLASS", isAssignable: true },
  { blockIndex: 2, label: "09:15 - 10:15", startTime: "09:15", endTime: "10:15", durationMinutes: 60, type: "CLASS", isAssignable: true },
  { blockIndex: null, label: "10:15 - 10:30", startTime: "10:15", endTime: "10:30", durationMinutes: 15, type: "BREAK", isAssignable: false, breakLabel: "Recreo" },
  { blockIndex: 3, label: "10:30 - 11:35", startTime: "10:30", endTime: "11:35", durationMinutes: 65, type: "CLASS", isAssignable: true },
  { blockIndex: null, label: "11:35 - 11:40", startTime: "11:35", endTime: "11:40", durationMinutes: 5, type: "MINI_BREAK", isAssignable: false, breakLabel: "Mini break" },
  { blockIndex: 4, label: "11:40 - 12:40", startTime: "11:40", endTime: "12:40", durationMinutes: 60, type: "CLASS", isAssignable: true },
  { blockIndex: null, label: "12:40 - 13:25", startTime: "12:40", endTime: "13:25", durationMinutes: 45, type: "LUNCH", isAssignable: false, breakLabel: "Comida y recreo" },
  { blockIndex: 5, label: "13:25 - 14:15", startTime: "13:25", endTime: "14:15", durationMinutes: 50, type: "CLASS", isAssignable: true },
  { blockIndex: 6, label: "14:15 - 15:15", startTime: "14:15", endTime: "15:15", durationMinutes: 60, type: "CLASS", isAssignable: true },
  { blockIndex: null, label: "15:15 - 15:30", startTime: "15:15", endTime: "15:30", durationMinutes: 15, type: "BREAK", isAssignable: false, breakLabel: "Recreo" },
  { blockIndex: 7, label: "15:30 - 16:30", startTime: "15:30", endTime: "16:30", durationMinutes: 60, type: "CLASS", isAssignable: true }
];

export const assignableBlocks = timeBlocks.filter((block) => block.isAssignable);
export const slots = assignableBlocks.map((block) => block.startTime);
export const totalAssignableMinutesPerDay = assignableBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);

export function formatHoursAndMinutes(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "0 h";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes.toString().padStart(2, "0")} min`;
}

// Legacy stubs (empty) — left for any older page that still imports them.
export const campuses: Array<{ id: string; name: string; code: string; address?: string; city?: string; province?: string; isActive: boolean }> = [];
export const demoUsers: Array<{ id: string; email: string; name: string; role: string; status: string; campusIds: string[]; selectedCampusId: string | null; createdAt: string }> = [];
export const registrationRequests: Array<{ id: string; campusId: string; fullName: string; email: string; institutionName: string; requestedCampus: string; requestedRole: string; status: string; createdAt: string; message?: string }> = [];
export const importBatches: Array<{ id: string; campusId: string; type: string; status: string; filename: string; rows: number; validRows: number; errors: number; createdAt: string }> = [];
export const invitationCodes: Array<{ id: string; code: string; campusId: string | null; role: string; label: string; isActive: boolean; expiresAt: string | null; maxUses: number | null; usedCount: number; requiresApproval: boolean; createdAt: string }> = [];
export const scheduleEntries: Array<{ id: string; campusId: string; day: number; blockIndex: number; course: string; subject: string; teacher: string; classroom: string; color: string; kind: string }> = [];
export const defaultCampusId = "";
