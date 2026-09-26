/**
 * Vietnamese Industrial Logistics formatting utilities
 */

export function formatWeight(tons?: number, unit: 'TẤN' | 'KG' = 'TẤN'): string {
  if (tons === undefined || tons === null || isNaN(tons)) return '---';
  if (unit === 'KG') {
    return `${Math.round(tons * 1000).toLocaleString('vi-VN')} kg`;
  }
  return `${tons.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Tấn`;
}

export function formatPlate(plate: string): string {
  if (!plate) return '';
  return plate.trim().toUpperCase();
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '---';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins}:${secs} ${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString?: string): string {
  if (!isoString) return '---';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

export function formatTimeOnly(isoString?: string): string {
  if (!isoString) return '---';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  } catch {
    return isoString;
  }
}

export function getGateStepMeta(step: string) {
  switch (step) {
    case 'GATE_IN':
      return {
        label: 'Chờ vào cổng',
        shortLabel: 'Vào cổng',
        badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800',
        dotColor: 'bg-sky-500',
        stepIndex: 1,
      };
    case 'SCALE_1':
      return {
        label: 'Cân lần 1',
        shortLabel: 'Cân #1',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        dotColor: 'bg-amber-500',
        stepIndex: 2,
      };
    case 'LOADING_UNLOADING':
      return {
        label: 'Đang bốc dỡ hàng',
        shortLabel: 'Bốc dỡ',
        badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800',
        dotColor: 'bg-purple-500',
        stepIndex: 3,
      };
    case 'SCALE_2':
      return {
        label: 'Cân lần 2',
        shortLabel: 'Cân #2',
        badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
        dotColor: 'bg-indigo-500',
        stepIndex: 4,
      };
    case 'GATE_OUT':
      return {
        label: 'Chờ kiểm tra cổng ra',
        shortLabel: 'Cổng ra',
        badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800',
        dotColor: 'bg-teal-500',
        stepIndex: 5,
      };
    case 'COMPLETED':
      return {
        label: 'Hoàn tất chuyến',
        shortLabel: 'Hoàn tất',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        dotColor: 'bg-emerald-500',
        stepIndex: 6,
      };
    default:
      return {
        label: step,
        shortLabel: step,
        badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
        dotColor: 'bg-slate-400',
        stepIndex: 0,
      };
  }
}
