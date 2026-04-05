import type { ComponentType } from "react";

interface StatCardProps {
  title: string;
  value: number;
  color: "gold" | "green" | "amber" | "red";
  Icon?: ComponentType<{ className?: string }>;
}

export default function StatCard({
  title,
  value,
  color,
  Icon,
}: StatCardProps) {
  const bg =
    color === "gold"
      ? "bg-gradient-to-r from-gold-dark to-gold-light text-black-deep"
      : color === "green"
        ? "bg-gradient-to-r from-green-600 to-green-500 text-white"
        : color === "amber"
          ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white"
          : "bg-gradient-to-r from-primary-dark to-primary-light text-white";

  return (
    <div className={`${bg} flex items-center gap-4 rounded-2xl p-4 shadow-lg`}>
      {Icon && (
        <div className="rounded-xl bg-white/15 p-3">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div>
        <h3 className="text-sm opacity-80">{title}</h3>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}
