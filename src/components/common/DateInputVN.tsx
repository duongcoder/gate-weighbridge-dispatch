import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputVNProps {
  /** Giá trị ISO YYYY-MM-DD (bind state dùng cho lọc/API) */
  value: string;
  /** Trả về giá trị ISO YYYY-MM-DD */
  onChange: (isoValue: string) => void;
  className?: string;
  title?: string;
}

/** Chuyển ISO (YYYY-MM-DD) -> chuỗi hiển thị dd/mm/yyyy */
export function isoToVnDate(iso?: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return '';
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

/**
 * Ô chọn ngày hiển thị chuẩn Việt Nam dd/mm/yyyy, KHÔNG phụ thuộc locale trình duyệt.
 * Bên dưới vẫn giữ <input type="date"> native (phủ trong suốt) để mở lịch;
 * giá trị bind ra ngoài luôn là ISO YYYY-MM-DD.
 */
export const DateInputVN: React.FC<DateInputVNProps> = ({
  value,
  onChange,
  className = '',
  title,
}) => {
  const display = isoToVnDate(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mở lịch native khi click vào BẤT KỲ vị trí nào trong ô (chữ số, khoảng trắng, icon lịch)
  const openPicker = () => {
    const el = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
      } catch {
        // Một số trình duyệt chặn showPicker ngoài ngữ cảnh hợp lệ — bỏ qua an toàn
      }
    } else {
      // Fallback cho trình duyệt cũ: focus để người dùng thao tác trên ô ngày
      inputRef.current?.focus();
    }
  };

  return (
    <div
      className={`relative inline-block rounded-lg focus-within:ring-2 focus-within:ring-amber-500 ${className}`}
      title={title || 'Chọn ngày'}
      onClick={openPicker}
    >
      {/* Khung hiển thị cố định dd/mm/yyyy — pointer-events-none để click xuyên xuống input */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-950 text-industrial-900 dark:text-white font-mono pointer-events-none select-none whitespace-nowrap">
        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className={display ? '' : 'text-slate-400'}>{display || 'dd/mm/yyyy'}</span>
      </div>

      {/* Input date native trong suốt phủ kín toàn bộ ô để bắt mọi cú click */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={title || 'Chọn ngày'}
        className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
};

export default DateInputVN;