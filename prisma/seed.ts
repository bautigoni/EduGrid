import {
  PrismaClient,
  ClassroomType,
  ConditionOperator,
  ConditionType,
  EntityType,
  GenerationStatus,
  ImportStatus,
  ImportType,
  Priority,
  ProgramBlockType,
  RequestStatus,
  Role,
  Term,
  UserStatus
} from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  campuses,
  courseSubjects,
  courses,
  customConditions,
  demoUsers,
  importBatches,
  insights,
  programBlocks,
  registrationRequests,
  scheduleEntries,
  subjects,
  teachers,
  classrooms
} from "../src/lib/demo-data";

const prisma = new PrismaClient();

const roomTypeMap: Record<string, ClassroomType> = {
  REGULAR: ClassroomType.REGULAR,
  LABORATORY: ClassroomType.LABORATORY,
  COMPUTER_ROOM: ClassroomType.COMPUTER_ROOM,
  SPECIAL: ClassroomType.SPECIAL,
  WORKSHOP: ClassroomType.WORKSHOP,
  MAKER_ROOM: ClassroomType.MAKER_ROOM
};

async function main() {
  await prisma.importRow.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.scheduleEntry.deleteMany();
  await prisma.scheduleVersion.deleteMany();
  await prisma.programBlockTeacher.deleteMany();
  await prisma.programBlockCourse.deleteMany();
  await prisma.programBlock.deleteMany();
  await prisma.customCondition.deleteMany();
  await prisma.campusTransitionRule.deleteMany();
  await prisma.courseSubject.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.teacherAvailability.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.constraintProfile.deleteMany();
  await prisma.registrationRequest.deleteMany();
  await prisma.userCampus.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.course.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();
  await prisma.campus.deleteMany();

  for (const campus of campuses) {
    await prisma.campus.create({ data: campus });
  }

  for (const user of demoUsers) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: await bcrypt.hash("horaria-demo", 12),
        role: user.role as Role,
        status: user.status as UserStatus,
        selectedCampusId: user.selectedCampusId,
        campuses: {
          create: user.campusIds.map((campusId) => ({
            campusId,
            role: user.role as Role,
            canApproveUsers: user.role === "SUPERADMIN" || user.role === "CAMPUS_ADMIN"
          }))
        }
      }
    });
  }

  for (const request of registrationRequests) {
    const existingUser = await prisma.user.findUnique({ where: { id: request.userId } });
    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          id: request.userId,
          email: request.email,
          name: request.fullName,
          passwordHash: await bcrypt.hash("horaria-demo", 12),
          role: request.requestedRole as Role,
          status: UserStatus.PENDING_APPROVAL,
          selectedCampusId: request.campusId
        }
      }));

    await prisma.registrationRequest.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        id: request.id,
        userId: user.id,
        campusId: request.campusId,
        fullName: request.fullName,
        email: request.email,
        institutionName: request.institutionName,
        requestedCampus: request.requestedCampus,
        requestedRole: request.requestedRole as Role,
        message: request.message,
        status: request.status as RequestStatus
      }
    });
  }

  for (const subject of subjects) {
    await prisma.subject.create({
      data: {
        id: subject.id,
        campusId: subject.campusId,
        name: subject.name,
        code: subject.code,
        color: subject.color,
        roomType: roomTypeMap[subject.roomType],
        isGlobal: subject.isGlobal
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
        campusId: classroom.campusId,
        name: classroom.name,
        type: roomTypeMap[classroom.type],
        capacity: classroom.capacity,
        restrictions: classroom.restrictions
      }
    });
  }

  for (const teacher of teachers) {
    await prisma.teacher.create({
      data: {
        id: teacher.id,
        campusId: teacher.campusId,
        fullName: teacher.fullName,
        email: teacher.email,
        weeklyMaxModules: teacher.weeklyMaxModules,
        preferences: teacher.preferences,
        subjects: {
          create: teacher.subjects.map((subjectName) => ({
            subject: { connect: { id: subjects.find((subject) => subject.name === subjectName)!.id } }
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
            campusId: teacher.campusId,
            day,
            slot,
            reason: "Preferencia docente"
          }))
        }
      }
    });
  }

  for (const assignment of courseSubjects) {
    const course = courses.find((item) => item.campusId === assignment.campusId && item.label === assignment.course)!;
    const subject = subjects.find((item) => item.name === assignment.subject)!;
    await prisma.courseSubject.create({
      data: {
        campusId: assignment.campusId,
        courseId: course.id,
        subjectId: subject.id,
        weeklyModules: assignment.weeklyModules,
        preferredDistribution: { pattern: assignment.distribution }
      }
    });
  }

  for (const campus of campuses) {
    await prisma.constraintProfile.create({
      data: {
        campusId: campus.id,
        name: "Semana academica balanceada",
        maxDailyModulesPerTeacher: 6,
        maxGapsPerTeacherPerWeek: 2,
        preferConsecutiveModules: true,
        avoidLastHourForCore: true
      }
    });
  }

  for (const block of programBlocks) {
    const classroom = classrooms.find((room) => room.campusId === block.campusId && room.name === block.preferredClassroom);
    await prisma.programBlock.create({
      data: {
        id: block.id,
        campusId: block.campusId,
        name: block.name,
        type: block.type as ProgramBlockType,
        description: block.description,
        requiredRoomType: roomTypeMap[block.requiredRoomType],
        preferredClassroomId: classroom?.id,
        weeklyModules: block.weeklyModules,
        requiresSameTimeTeachers: block.requiresSameTimeTeachers,
        requiresSameTimeCourses: block.requiresSameTimeCourses,
        fixedDay: block.fixedDay,
        fixedTimeSlot: block.fixedTimeSlot,
        priority: block.priority as Priority,
        notes: block.notes,
        requiredTeachers: {
          create: block.requiredTeachers
            .map((teacherName) => teachers.find((teacher) => teacher.campusId === block.campusId && teacher.fullName === teacherName))
            .filter(Boolean)
            .map((teacher) => ({ teacherId: teacher!.id }))
        },
        involvedCourses: {
          create: block.involvedCourses
            .map((label) => courses.find((course) => course.campusId === block.campusId && course.label === label))
            .filter(Boolean)
            .map((course) => ({ courseId: course!.id }))
        }
      }
    });
  }

  for (const condition of customConditions) {
    await prisma.customCondition.create({
      data: {
        id: condition.id,
        campusId: condition.campusId,
        entityType: condition.entityType as EntityType,
        entityId: condition.entityId,
        conditionType: condition.conditionType as ConditionType,
        operator: condition.operator as ConditionOperator,
        value: condition.value,
        priority: condition.priority as Priority,
        isHardConstraint: condition.isHardConstraint,
        description: condition.description
      }
    });
  }

  await prisma.campusTransitionRule.create({
    data: {
      fromCampusId: "campus-nordelta",
      toCampusId: "campus-puertos",
      minimumMinutes: 45
    }
  });

  for (const batch of importBatches) {
    await prisma.importBatch.create({
      data: {
        id: batch.id,
        campusId: batch.campusId,
        type: batch.type as ImportType,
        status: batch.status as ImportStatus,
        filename: batch.filename,
        summary: { rows: batch.rows, validRows: batch.validRows, errors: batch.errors }
      }
    });
  }

  const versions = new Map<string, string>();
  for (const campus of campuses) {
    const version = await prisma.scheduleVersion.create({
      data: {
        campusId: campus.id,
        name: `Demo ${campus.name}`,
        term: Term.TRIMESTER_1,
        status: GenerationStatus.SUCCESS,
        score: campus.id === "campus-nordelta" ? 88 : 92,
        insights
      }
    });
    versions.set(campus.id, version.id);
  }

  for (const entry of scheduleEntries) {
    const classroom = classrooms.find((room) => room.campusId === entry.campusId && room.name === entry.classroom)!;
    const course = courses.find((item) => item.campusId === entry.campusId && item.label === entry.course);
    const subject = subjects.find((item) => item.name === entry.subject);
    const teacher = teachers.find((item) => entry.teacher.includes(item.fullName));
    const programBlock = programBlocks.find((item) => item.campusId === entry.campusId && item.name === entry.subject);

    await prisma.scheduleEntry.create({
      data: {
        versionId: versions.get(entry.campusId)!,
        courseId: course?.id,
        subjectId: subject?.id,
        teacherId: teacher?.id,
        classroomId: classroom.id,
        programBlockId: programBlock?.id,
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
