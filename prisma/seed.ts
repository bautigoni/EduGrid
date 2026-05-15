import { PrismaClient, ClassroomType, Role, Term, GenerationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  classrooms,
  courseSubjects,
  courses,
  insights,
  scheduleEntries,
  subjects,
  teachers
} from "../src/lib/demo-data";

const prisma = new PrismaClient();

const typeMap: Record<string, ClassroomType> = {
  REGULAR: ClassroomType.REGULAR,
  LABORATORY: ClassroomType.LABORATORY,
  COMPUTER_ROOM: ClassroomType.COMPUTER_ROOM,
  SPECIAL: ClassroomType.SPECIAL
};

async function main() {
  await prisma.scheduleEntry.deleteMany();
  await prisma.scheduleVersion.deleteMany();
  await prisma.courseSubject.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.teacherAvailability.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.constraintProfile.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.course.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: "admin@horaria.demo",
      name: "Horaria Admin",
      role: Role.ADMIN,
      passwordHash: await bcrypt.hash("horaria-demo", 12)
    }
  });

  for (const subject of subjects) {
    await prisma.subject.create({
      data: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        color: subject.color,
        roomType: typeMap[subject.roomType]
      }
    });
  }

  for (const course of courses) {
    await prisma.course.create({ data: course });
  }

  for (const classroom of classrooms) {
    await prisma.classroom.create({
      data: {
        id: classroom.id,
        name: classroom.name,
        type: typeMap[classroom.type],
        capacity: classroom.capacity,
        restrictions: classroom.restrictions
      }
    });
  }

  for (const teacher of teachers) {
    await prisma.teacher.create({
      data: {
        id: teacher.id,
        fullName: teacher.fullName,
        email: teacher.email,
        weeklyMaxModules: teacher.weeklyMaxModules,
        preferences: teacher.preferences,
        subjects: {
          create: teacher.subjects.map((subjectName) => ({
            subject: { connect: { name: subjectName } }
          }))
        },
        availabilities: {
          create: Array.from({ length: 5 }).flatMap((_, day) =>
            Array.from({ length: 8 }).map((__, slot) => ({
              day,
              slot,
              available: !teacher.blocked.some(([blockedDay, blockedSlot]) => blockedDay === day && blockedSlot === slot)
            }))
          )
        },
        blockedSlots: {
          create: teacher.blocked.map(([day, slot]) => ({
            day,
            slot,
            reason: "Teacher preference"
          }))
        }
      }
    });
  }

  for (const assignment of courseSubjects) {
    await prisma.courseSubject.create({
      data: {
        course: { connect: { label: assignment.course } },
        subject: { connect: { name: assignment.subject } },
        weeklyModules: assignment.weeklyModules,
        preferredDistribution: { pattern: assignment.distribution }
      }
    });
  }

  await prisma.constraintProfile.create({
    data: {
      name: "Balanced academic week",
      maxDailyModulesPerTeacher: 6,
      maxGapsPerTeacherPerWeek: 2,
      preferConsecutiveModules: true,
      avoidLastHourForCore: true
    }
  });

  const version = await prisma.scheduleVersion.create({
    data: {
      name: "Demo schedule",
      term: Term.TRIMESTER_1,
      status: GenerationStatus.SUCCESS,
      score: 94,
      insights
    }
  });

  for (const entry of scheduleEntries) {
    const subject = await prisma.subject.findUniqueOrThrow({ where: { name: entry.subject } });
    const teacher = await prisma.teacher.findFirstOrThrow({ where: { fullName: entry.teacher } });
    const course = await prisma.course.findUniqueOrThrow({ where: { label: entry.course } });
    const classroom = await prisma.classroom.findUniqueOrThrow({ where: { name: entry.classroom } });

    await prisma.scheduleEntry.create({
      data: {
        versionId: version.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        courseId: course.id,
        classroomId: classroom.id,
        day: entry.day,
        slot: entry.slot
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
