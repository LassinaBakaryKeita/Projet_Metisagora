import React from 'react';

export const StatisticsCard = ({
  title,
  value,
  subtitle,
  trend,
  trendType = 'positive', // 'positive' | 'negative' | 'neutral'
  icon: Icon,
  badgeText
}) => {
  return (
    <div className="relative overflow-hidden bg-[#121313] border border-[#252629] rounded-2xl p-6 transition-all duration-300 hover:border-[#13F2F8]/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
      {/* Subtle top cyan ambient glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#13F2F8]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">{title}</span>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[#13F2F8]">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
        {badgeText && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">
            {badgeText}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-medium ${
                trendType === 'positive'
                  ? 'text-emerald-400'
                  : trendType === 'negative'
                  ? 'text-rose-400'
                  : 'text-white/60'
              }`}
            >
              {trend}
            </span>
          )}
          {subtitle && <span className="text-white/40">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

