import { defineLesson } from "../lesson-helpers";
import plans from "./continuity-guide.json";
import type { Lesson } from "../../types/curriculum";

export const joseonLessons: readonly Lesson[] = plans.map(plan => defineLesson({
  ...plan,
  assessment: { ...plan.assessment, method: "산출물" },
  classroomMode: plan.id === 1 ? "teacher-led" : plan.id <= 4 ? "worksheet" : "student",
  activities: plan.activities as Lesson["activities"],
}));
