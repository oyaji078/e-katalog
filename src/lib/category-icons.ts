import {
  Camera,
  Cpu,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  Monitor,
  Mouse,
  Printer,
  Search,
  Wifi,
} from "lucide-react";
import type { ComponentType } from "react";

export const CATEGORY_ICONS = [
  { value: "Laptop", label: "Laptop", icon: Laptop },
  { value: "PcRakitan", label: "PC Rakitan", icon: Cpu },
  { value: "Monitor", label: "Monitor", icon: Monitor },
  { value: "Keyboard", label: "Keyboard", icon: Keyboard },
  { value: "Mouse", label: "Mouse", icon: Mouse },
  { value: "Printer", label: "Printer", icon: Printer },
  { value: "Networking", label: "Networking", icon: Wifi },
  { value: "CCTV", label: "CCTV", icon: Camera },
  { value: "Storage", label: "Storage", icon: HardDrive },
  { value: "Aksesoris", label: "Aksesoris", icon: Headphones },
] as const;

const iconMap = new Map<string, ComponentType<{ className?: string }>>(
  CATEGORY_ICONS.map((entry) => [entry.value, entry.icon]),
);

export function getCategoryIcon(icon: string | null): ComponentType<{ className?: string }> {
  if (!icon) return Search;
  return iconMap.get(icon) ?? Search;
}

export function getCategoryIconLabel(icon: string | null): string {
  if (!icon) return "Lainnya";
  const entry = CATEGORY_ICONS.find((e) => e.value === icon);
  return entry?.label ?? "Lainnya";
}
