import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  /** Class cho thẻ input (giữ nguyên style của app) */
  inputClassName?: string;
  /** Số gợi ý tối đa hiển thị */
  maxItems?: number;
}

/**
 * Ô nhập liệu vừa cho phép gõ tự do, vừa cho chọn nhanh từ danh sách gợi ý
 * (Custom Autocomplete / Combobox) — thay thế cho <datalist> mặc định.
 */
export const ComboboxInput: React.FC<ComboboxInputProps> = ({
  value,
  onChange,
  options,
  placeholder,
  required,
  autoFocus,
  inputClassName = '',
  maxItems = 50,
}) => {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lọc gợi ý theo nội dung đang gõ (không phân biệt hoa/thường, loại trùng khít)
  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const base = q
      ? options.filter((o) => o.toLowerCase().includes(q) && o.toLowerCase() !== q)
      : options;
    return base.slice(0, maxItems);
  }, [options, value, maxItems]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectOption = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && highlightIndex >= 0 && filtered[highlightIndex]) {
        e.preventDefault();
        selectOption(filtered[highlightIndex]);
      } else {
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        required={required}
        autoFocus={autoFocus}
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlightIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={`${inputClassName} pr-9`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen((o) => !o)}
        aria-label="Mở danh sách gợi ý"
        className="absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-industrial-700 bg-white dark:bg-industrial-900 shadow-lg text-sm animate-in fade-in duration-100">
          {filtered.map((opt, idx) => (
            <li
              key={opt}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectOption(opt)}
              onMouseEnter={() => setHighlightIndex(idx)}
              title={opt}
              className={`px-3 py-2 cursor-pointer text-left truncate transition-colors ${
                idx === highlightIndex
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200'
                  : 'text-industrial-900 dark:text-white hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ComboboxInput;