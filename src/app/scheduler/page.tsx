import { redirect } from "next/navigation";

export default function SchedulerPage() {
  // The dedicated scheduler view has been merged into /planner.
  redirect("/planner");
}
