import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    text: string;
    positive?: boolean;
  };
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8F7F70] dark:text-[#9E8E80] truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF] mt-1.5 font-mono tabular-nums">
            {value}
          </p>
        </div>

        {Icon && (
          <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] text-[#9E7246] dark:text-[#D6A670] shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-[#7A6C60] dark:text-[#A69788] truncate font-normal">
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              className={`font-mono text-[11px] font-medium ml-auto ${
                trend.positive
                  ? 'text-[#845A32] dark:text-[#D6A670]'
                  : 'text-[#8F7F70] dark:text-[#9E8E80]'
              }`}
            >
              {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
