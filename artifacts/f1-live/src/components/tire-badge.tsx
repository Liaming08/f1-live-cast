import { getTireColor, getTireInitial } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface TireBadgeProps {
  compound: string | null | undefined;
  age?: number | null;
  className?: string;
}

export function TireBadge({ compound, age, className }: TireBadgeProps) {
  const initial = getTireInitial(compound);
  const color = getTireColor(compound);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold font-mono leading-none",
        color,
        className
      )}
    >
      {initial}
      {age !== null && age !== undefined && (
        <span className="opacity-70 text-[10px] font-normal ml-0.5">{age}</span>
      )}
    </span>
  );
}
