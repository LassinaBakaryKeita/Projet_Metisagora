import React from 'react';

export const NotificationBadge = ({ count, className = '' }) => {
  if (!count || count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-[#13F2F8] text-[#0B0F10] shadow-[0_0_10px_rgba(19,242,248,0.4)] ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

