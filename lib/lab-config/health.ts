import { Task } from "@/types/common";

export function calculateProjectHealth(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  
  const verifiedCount = tasks.filter(
    t => t.status === 'Verified' || t.status === 'Review'
  ).length;
  
  return Math.round((verifiedCount / tasks.length) * 100);
}
