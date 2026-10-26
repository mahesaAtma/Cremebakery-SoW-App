import type { TaskPriority, TaskStatus, TaskType } from "@/db/schema";

export const STATUS_ORDER: TaskStatus[] = ["in_progress", "waiting", "planned", "backlog", "done"];

export const STATUS: Record<
  TaskStatus,
  { label: string; dot: string; bar: string; chip: string }
> = {
  backlog: {
    label: "Backlog",
    dot: "bg-stone-300",
    bar: "bg-stone-100 border border-stone-300",
    chip: "bg-stone-100 text-stone-700",
  },
  planned: {
    label: "Direncanakan",
    dot: "bg-stone-400",
    bar: "bg-stone-100 border border-stone-400",
    chip: "bg-stone-100 text-stone-700",
  },
  in_progress: {
    label: "Sedang dikerjakan",
    dot: "bg-blue-600",
    bar: "bg-blue-600 border border-blue-600",
    chip: "bg-blue-50 text-blue-800",
  },
  waiting: {
    label: "Menunggu",
    dot: "bg-amber-600",
    bar: "bg-amber-100 border-[1.5px] border-dashed border-amber-600",
    chip: "bg-amber-50 text-amber-900",
  },
  done: {
    label: "Selesai",
    dot: "bg-green-700",
    bar: "bg-green-200 border border-green-500",
    chip: "bg-green-50 text-green-800",
  },
};

export const TYPE: Record<TaskType, string> = {
  feature: "Fitur",
  maintenance: "Perawatan",
  bug: "Bug",
  research: "Riset",
};

export const PRIORITY: Record<TaskPriority, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
};

export const STATUS_VALUES = Object.keys(STATUS) as TaskStatus[];
export const TYPE_VALUES = Object.keys(TYPE) as TaskType[];
export const PRIORITY_VALUES = Object.keys(PRIORITY) as TaskPriority[];
