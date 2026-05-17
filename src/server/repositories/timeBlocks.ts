import { getDb, newId, nowIso } from "@/lib/db";

export type TimeBlock = {
  id: string;
  campus_id: string;
  day_of_week: number;
  block_index: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  block_value: number;
  label: string;
  type: "CLASS" | "BREAK" | "MINI_BREAK" | "LUNCH";
  is_assignable: number;
};

export const defaultBlocks: Array<{
  block_index: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  type: TimeBlock["type"];
  is_assignable: boolean;
}> = [
  { block_index: 1, start_time: "08:15", end_time: "09:15", duration_minutes: 60, type: "CLASS", is_assignable: true },
  { block_index: 2, start_time: "09:15", end_time: "10:15", duration_minutes: 60, type: "CLASS", is_assignable: true },
  { block_index: 100, start_time: "10:15", end_time: "10:30", duration_minutes: 15, type: "BREAK", is_assignable: false },
  { block_index: 3, start_time: "10:30", end_time: "11:35", duration_minutes: 65, type: "CLASS", is_assignable: true },
  { block_index: 101, start_time: "11:35", end_time: "11:40", duration_minutes: 5, type: "MINI_BREAK", is_assignable: false },
  { block_index: 4, start_time: "11:40", end_time: "12:40", duration_minutes: 60, type: "CLASS", is_assignable: true },
  { block_index: 102, start_time: "12:40", end_time: "13:25", duration_minutes: 45, type: "LUNCH", is_assignable: false },
  { block_index: 5, start_time: "13:25", end_time: "14:15", duration_minutes: 50, type: "CLASS", is_assignable: true },
  { block_index: 6, start_time: "14:15", end_time: "15:15", duration_minutes: 60, type: "CLASS", is_assignable: true },
  { block_index: 103, start_time: "15:15", end_time: "15:30", duration_minutes: 15, type: "BREAK", is_assignable: false },
  { block_index: 7, start_time: "15:30", end_time: "16:30", duration_minutes: 60, type: "CLASS", is_assignable: true }
];

export function seedDefaultTimeBlocksForCampus(campusId: string) {
  const db = getDb();
  const insert = db.prepare(`INSERT OR IGNORE INTO time_blocks
    (id, campus_id, day_of_week, block_index, start_time, end_time, duration_minutes, block_value, label, type, is_assignable, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const now = nowIso();
  for (let day = 0; day < 5; day += 1) {
    for (const b of defaultBlocks) {
      insert.run(newId("tb"), campusId, day, b.block_index, b.start_time, b.end_time, b.duration_minutes,
        b.is_assignable ? 1 : 0, `${b.start_time} - ${b.end_time}`, b.type, b.is_assignable ? 1 : 0, now, now);
    }
  }
}

export function getTimeBlocksForCampus(campusId: string): TimeBlock[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM time_blocks WHERE campus_id = ? ORDER BY day_of_week, start_time`).all(campusId) as TimeBlock[];
}

export function getAssignableBlocksForCampus(campusId: string): TimeBlock[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM time_blocks WHERE campus_id = ? AND is_assignable = 1 ORDER BY day_of_week, start_time`).all(campusId) as TimeBlock[];
}
