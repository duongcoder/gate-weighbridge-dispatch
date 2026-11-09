import React, { useEffect, useState } from 'react';

interface SyncIndicatorProps {
  /** Thời điểm đồng bộ ngầm gần nhất */
  lastSyncAt: Date | null;
  /** Nhãn mô tả */
  label?: string;
}

/**
 * Chỉ báo nhỏ cho biết hệ thống đang giám sát realtime và lần đồng bộ ngầm gần nhất cách đây bao lâu.
 */
export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ lastSyncAt, label = 'Cập nhật ngầm' }) => {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const tick = () => {
      if (lastSyncAt) {
        setSecondsAgo(Math.max(0, Math.round((Date.now() - lastSyncAt.getTime()) / 1000)));
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [lastSyncAt]);

  return (
    <div
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-industrial-900/95 border border-slate-200 dark:border-industrial-800 shadow-md text-[11px] font-medium text-slate-600 dark:text-slate-300 select-none pointer-events-none print:hidden"
      title="Dữ liệu tự động đồng bộ ngầm mỗi 5 giây"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span>
        {label}: {lastSyncAt ? `${secondsAgo}s trước` : 'đang kết nối...'}
      </span>
    </div>
  );
};

export default SyncIndicator;
