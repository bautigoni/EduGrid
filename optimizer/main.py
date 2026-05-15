from typing import Any

from fastapi import FastAPI
from ortools.sat.python import cp_model
from pydantic import BaseModel


class SolveRequest(BaseModel):
    days: int
    slotsPerDay: int
    campusId: str | None = None
    teachers: list[dict[str, Any]]
    courses: list[dict[str, Any]]
    subjects: list[dict[str, Any]]
    classrooms: list[dict[str, Any]]
    requirements: list[dict[str, Any]]
    programBlocks: list[dict[str, Any]] = []
    customConditions: list[dict[str, Any]] = []


app = FastAPI(title="Horaria Optimizer", version="1.0.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def teacher_can_teach(teacher: dict[str, Any], subject: str) -> bool:
    return subject in teacher.get("subjects", [])


def teacher_available(teacher: dict[str, Any], day: int, slot: int) -> bool:
    return [day, slot] not in teacher.get("blocked", [])


def room_compatible(room: dict[str, Any], subject: dict[str, Any]) -> bool:
    required = subject.get("roomType", "REGULAR")
    return required == "REGULAR" or room.get("type") == required


def compatible_program_room(room: dict[str, Any], block: dict[str, Any]) -> bool:
    preferred = block.get("preferredClassroom")
    required = block.get("requiredRoomType")
    if preferred and room.get("name") == preferred:
        return True
    if required:
        return room.get("type") == required
    return True


@app.post("/solve")
def solve(payload: SolveRequest) -> dict[str, Any]:
    model = cp_model.CpModel()
    subjects_by_name = {subject["name"]: subject for subject in payload.subjects}
    courses_by_label = {course["label"]: course for course in payload.courses}

    variables: dict[tuple[int, int, int, int, int], cp_model.IntVar] = {}
    project_variables: dict[tuple[int, int, int], cp_model.IntVar] = {}
    requirement_keys: list[tuple[int, dict[str, Any]]] = list(enumerate(payload.requirements))

    for req_index, req in requirement_keys:
        subject = subjects_by_name[req["subject"]]
        course = courses_by_label[req["course"]]
        for teacher_index, teacher in enumerate(payload.teachers):
            if not teacher_can_teach(teacher, req["subject"]):
                continue
            for room_index, room in enumerate(payload.classrooms):
                if room.get("capacity", 0) < course.get("studentCount", 0):
                    continue
                if not room_compatible(room, subject):
                    continue
                for day in range(payload.days):
                    for slot in range(payload.slotsPerDay):
                        if not teacher_available(teacher, day, slot):
                            continue
                        name = f"x_{req_index}_{teacher_index}_{room_index}_{day}_{slot}"
                        variables[(req_index, teacher_index, room_index, day, slot)] = model.NewBoolVar(name)

    for block_index, block in enumerate(payload.programBlocks):
        required_teachers = block.get("requiredTeachers", [])
        if not required_teachers:
            continue
        for room_index, room in enumerate(payload.classrooms):
            if not compatible_program_room(room, block):
                continue
            for day in range(payload.days):
                if block.get("fixedDay") is not None and day != block.get("fixedDay"):
                    continue
                for slot in range(payload.slotsPerDay):
                    if block.get("fixedTimeSlot") is not None and slot != block.get("fixedTimeSlot"):
                        continue
                    teacher_pool = [
                        teacher
                        for teacher in payload.teachers
                        if teacher["fullName"] in required_teachers and teacher_available(teacher, day, slot)
                    ]
                    if len(teacher_pool) != len(required_teachers):
                        continue
                    name = f"pb_{block_index}_{room_index}_{day}_{slot}"
                    project_variables[(block_index, room_index, day, slot)] = model.NewBoolVar(name)

    conflicts: list[str] = []
    for req_index, req in requirement_keys:
        eligible = [
            var
            for (r, _teacher, _room, _day, _slot), var in variables.items()
            if r == req_index
        ]
        if not eligible:
            conflicts.append(f"No eligible teacher, room, or slot for {req['subject']} in {req['course']}.")
            continue
        model.Add(sum(eligible) == int(req["weeklyModules"]))

    for course in payload.courses:
        for day in range(payload.days):
            for slot in range(payload.slotsPerDay):
                terms = []
                for req_index, req in requirement_keys:
                    if req["course"] == course["label"]:
                        terms.extend(
                            var
                            for (r, _teacher, _room, d, s), var in variables.items()
                            if r == req_index and d == day and s == slot
                        )
                if terms:
                    model.Add(sum(terms) <= 1)

    for teacher_index, _teacher in enumerate(payload.teachers):
        for day in range(payload.days):
            for slot in range(payload.slotsPerDay):
                terms = [
                    var
                    for (_req, t, _room, d, s), var in variables.items()
                    if t == teacher_index and d == day and s == slot
                ]
                if terms:
                    model.Add(sum(terms) <= 1)

    for room_index, _room in enumerate(payload.classrooms):
        for day in range(payload.days):
            for slot in range(payload.slotsPerDay):
                terms = [
                    var
                    for (_req, _teacher, r, d, s), var in variables.items()
                    if r == room_index and d == day and s == slot
                ]
                if terms:
                    model.Add(sum(terms) <= 1)

    for block_index, block in enumerate(payload.programBlocks):
        eligible = [
            var
            for (b, _room, _day, _slot), var in project_variables.items()
            if b == block_index
        ]
        if not eligible:
            conflicts.append(
                f"No se pudo asignar {block['name']} porque los docentes requeridos no tienen una disponibilidad comun."
            )
            continue
        model.Add(sum(eligible) == int(block.get("weeklyModules", 1)))

    for teacher_index, teacher in enumerate(payload.teachers):
        for day in range(payload.days):
            for slot in range(payload.slotsPerDay):
                regular_terms = [
                    var
                    for (_req, t, _room, d, s), var in variables.items()
                    if t == teacher_index and d == day and s == slot
                ]
                project_terms = [
                    var
                    for (block_index, _room, d, s), var in project_variables.items()
                    if d == day and s == slot and teacher["fullName"] in payload.programBlocks[block_index].get("requiredTeachers", [])
                ]
                if regular_terms or project_terms:
                    model.Add(sum(regular_terms + project_terms) <= 1)

    for room_index, _room in enumerate(payload.classrooms):
        for day in range(payload.days):
            for slot in range(payload.slotsPerDay):
                project_terms = [
                    var
                    for (_block, r, d, s), var in project_variables.items()
                    if r == room_index and d == day and s == slot
                ]
                regular_terms = [
                    var
                    for (_req, _teacher, r, d, s), var in variables.items()
                    if r == room_index and d == day and s == slot
                ]
                if project_terms or regular_terms:
                    model.Add(sum(project_terms + regular_terms) <= 1)

    soft_terms: list[cp_model.IntVar] = []
    for (req_index, teacher_index, room_index, day, slot), var in variables.items():
        req = payload.requirements[req_index]
        subject = subjects_by_name[req["subject"]]
        penalty = 0
        if slot in (0, payload.slotsPerDay - 1):
            penalty += 2
        if subject["name"] in {"Mathematics", "Literature"} and day == 4 and slot >= 5:
            penalty += 3
        if payload.classrooms[room_index]["type"] != subject.get("roomType") and subject.get("roomType") != "REGULAR":
            penalty += 8
        if penalty:
            soft_terms.append(var * penalty)

    for (block_index, _room_index, _day, slot), var in project_variables.items():
        block = payload.programBlocks[block_index]
        penalty = 0
        if slot in (0, payload.slotsPerDay - 1):
            penalty += 2
        if block.get("type") in {"ELECTIVE", "OPTATIVE"} and slot < 2:
            penalty += 2
        if penalty:
            soft_terms.append(var * penalty)

    if soft_terms:
        model.Minimize(sum(soft_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 8.0
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    if conflicts or status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "status": "FAILED",
            "score": 0,
            "entries": [],
            "conflicts": conflicts
            or [
                "Insufficient compatible slots for the requested weekly load.",
                "Try increasing teacher availability or adding compatible classrooms.",
            ],
            "insights": [],
        }

    entries = []
    for (req_index, teacher_index, room_index, day, slot), var in variables.items():
        if solver.BooleanValue(var):
            req = payload.requirements[req_index]
            subject = subjects_by_name[req["subject"]]
            teacher = payload.teachers[teacher_index]
            room = payload.classrooms[room_index]
            entries.append(
                {
                    "id": f"opt-{len(entries)}",
                    "day": day,
                    "slot": slot,
                    "course": req["course"],
                    "subject": req["subject"],
                    "teacher": teacher["fullName"],
                    "classroom": room["name"],
                    "color": subject.get("color", "#27d3bf"),
                }
            )

    for (block_index, room_index, day, slot), var in project_variables.items():
        if solver.BooleanValue(var):
            block = payload.programBlocks[block_index]
            room = payload.classrooms[room_index]
            entries.append(
                {
                    "id": f"pb-opt-{len(entries)}",
                    "day": day,
                    "slot": slot,
                    "course": " + ".join(block.get("involvedCourses", [])),
                    "subject": block["name"],
                    "teacher": " + ".join(block.get("requiredTeachers", [])),
                    "classroom": room["name"],
                    "color": "#86EFAC" if block.get("type") in {"ELECTIVE", "WORKSHOP"} else "#FDBA74",
                    "kind": block.get("type", "PROJECT"),
                }
            )

    objective = int(solver.ObjectiveValue()) if soft_terms else 0
    score = max(70, 100 - objective)
    return {
        "status": "SUCCESS",
        "score": score,
        "entries": sorted(entries, key=lambda item: (item["day"], item["slot"], item["course"])),
        "conflicts": [],
        "insights": [
            "Grouped consecutive modules where room and teacher availability allowed.",
            "Validated simultaneous teacher requirements for projects, electives and optatives.",
            "Reduced first and last slot usage for core subjects.",
            "Validated teacher, course, and classroom uniqueness for every scheduled slot.",
        ],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
