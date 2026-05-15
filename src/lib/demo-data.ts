export const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const slots = [
  "08:00",
  "08:45",
  "09:40",
  "10:25",
  "11:20",
  "12:05",
  "13:10",
  "13:55"
];

export const subjects = [
  { id: "math", name: "Mathematics", code: "MAT", color: "#27d3bf", roomType: "REGULAR" },
  { id: "literature", name: "Literature", code: "LIT", color: "#f472b6", roomType: "REGULAR" },
  { id: "physics", name: "Physics", code: "PHY", color: "#60a5fa", roomType: "LABORATORY" },
  { id: "history", name: "History", code: "HIS", color: "#f59e0b", roomType: "REGULAR" },
  { id: "biology", name: "Biology", code: "BIO", color: "#84cc16", roomType: "LABORATORY" },
  { id: "computer-science", name: "Computer Science", code: "CS", color: "#a78bfa", roomType: "COMPUTER_ROOM" },
  { id: "english", name: "English", code: "ENG", color: "#fb7185", roomType: "REGULAR" },
  { id: "art", name: "Art", code: "ART", color: "#22c55e", roomType: "SPECIAL" }
];

export const teachers = [
  {
    id: "t-ana",
    fullName: "Ana Martinez",
    email: "ana@horaria.demo",
    subjects: ["Mathematics", "Physics"],
    weeklyMaxModules: 26,
    preferences: "Prefers double modules before lunch.",
    blocked: [
      [2, 6],
      [2, 7]
    ]
  },
  {
    id: "t-bruno",
    fullName: "Bruno Alvarez",
    email: "bruno@horaria.demo",
    subjects: ["Literature", "English"],
    weeklyMaxModules: 24,
    preferences: "Avoids first slot on Mondays.",
    blocked: [[0, 0]]
  },
  {
    id: "t-camila",
    fullName: "Camila Torres",
    email: "camila@horaria.demo",
    subjects: ["Biology", "Physics"],
    weeklyMaxModules: 22,
    preferences: "Lab classes grouped by course.",
    blocked: [[4, 7]]
  },
  {
    id: "t-diego",
    fullName: "Diego Herrera",
    email: "diego@horaria.demo",
    subjects: ["History", "Art"],
    weeklyMaxModules: 20,
    preferences: "Best availability Tuesday to Friday.",
    blocked: [
      [0, 5],
      [0, 6],
      [0, 7]
    ]
  },
  {
    id: "t-elena",
    fullName: "Elena Ruiz",
    email: "elena@horaria.demo",
    subjects: ["Computer Science", "Mathematics"],
    weeklyMaxModules: 25,
    preferences: "Computer room only for practical modules.",
    blocked: [[3, 0]]
  }
];

export const courses = [
  { id: "1a", label: "1A", year: 1, division: "A", studentCount: 28 },
  { id: "1b", label: "1B", year: 1, division: "B", studentCount: 31 },
  { id: "2a", label: "2A", year: 2, division: "A", studentCount: 26 },
  { id: "2b", label: "2B", year: 2, division: "B", studentCount: 29 }
];

export const courseSubjects = [
  { course: "1A", subject: "Mathematics", weeklyModules: 5, distribution: "2 + 2 + 1" },
  { course: "1A", subject: "Literature", weeklyModules: 4, distribution: "2 + 1 + 1" },
  { course: "1A", subject: "Biology", weeklyModules: 3, distribution: "2 + 1" },
  { course: "1B", subject: "Mathematics", weeklyModules: 5, distribution: "2 + 2 + 1" },
  { course: "1B", subject: "English", weeklyModules: 3, distribution: "1 + 1 + 1" },
  { course: "1B", subject: "History", weeklyModules: 3, distribution: "2 + 1" },
  { course: "2A", subject: "Physics", weeklyModules: 4, distribution: "2 + 2" },
  { course: "2A", subject: "Computer Science", weeklyModules: 3, distribution: "2 + 1" },
  { course: "2A", subject: "Mathematics", weeklyModules: 5, distribution: "2 + 2 + 1" },
  { course: "2B", subject: "Literature", weeklyModules: 4, distribution: "2 + 1 + 1" },
  { course: "2B", subject: "History", weeklyModules: 3, distribution: "2 + 1" },
  { course: "2B", subject: "Art", weeklyModules: 2, distribution: "2" }
];

export const classrooms = [
  { id: "r101", name: "Room 101", type: "REGULAR", capacity: 32, restrictions: "General purpose" },
  { id: "r204", name: "Room 204", type: "REGULAR", capacity: 36, restrictions: "Near science wing" },
  { id: "lab-a", name: "Lab A", type: "LABORATORY", capacity: 24, restrictions: "Science subjects only" },
  { id: "comp-1", name: "Computer 1", type: "COMPUTER_ROOM", capacity: 30, restrictions: "Requires booking" },
  { id: "studio", name: "Creative Studio", type: "SPECIAL", capacity: 22, restrictions: "Art and workshops" }
];

export const scheduleEntries = [
  { id: "s1", day: 0, slot: 0, course: "1A", subject: "Mathematics", teacher: "Ana Martinez", classroom: "Room 101", color: "#27d3bf" },
  { id: "s2", day: 0, slot: 1, course: "1A", subject: "Mathematics", teacher: "Ana Martinez", classroom: "Room 101", color: "#27d3bf" },
  { id: "s3", day: 0, slot: 2, course: "1B", subject: "English", teacher: "Bruno Alvarez", classroom: "Room 204", color: "#fb7185" },
  { id: "s4", day: 1, slot: 1, course: "2A", subject: "Physics", teacher: "Camila Torres", classroom: "Lab A", color: "#60a5fa" },
  { id: "s5", day: 1, slot: 2, course: "2A", subject: "Physics", teacher: "Camila Torres", classroom: "Lab A", color: "#60a5fa" },
  { id: "s6", day: 2, slot: 3, course: "2B", subject: "History", teacher: "Diego Herrera", classroom: "Room 204", color: "#f59e0b" },
  { id: "s7", day: 3, slot: 0, course: "2A", subject: "Computer Science", teacher: "Elena Ruiz", classroom: "Computer 1", color: "#a78bfa" },
  { id: "s8", day: 4, slot: 4, course: "2B", subject: "Art", teacher: "Diego Herrera", classroom: "Creative Studio", color: "#22c55e" }
];

export const insights = [
  "Move Mathematics for 2A from Tuesday slot 5 to Thursday slot 2 to eliminate a teacher gap.",
  "Lab A is saturated on Tuesday morning. Biology can move to Friday slot 3 without conflicts.",
  "Bruno Alvarez has isolated English modules. Grouping two modules improves continuity for 1B."
];
