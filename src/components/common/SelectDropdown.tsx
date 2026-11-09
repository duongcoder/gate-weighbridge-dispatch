import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** Class bổ sung cho nút trigger */
  triggerClassName?: string;
}

/**
 * Ô chọn (select) tùy chỉnh — danh sách option cố định, không cho gõ tự do.
 * Dùng chung chuẩn CSS/bố cục với ComboboxInput (h-10, rounded-lg, ChevronDown xoay, popup shadow-lg).
 */
export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = '-- Chọn --',
  triggerClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const selected = options.find((o) => o.value === value);

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`relative w-full h-10 pl-3 pr-9 text-left text-sm rounded-lg border border-slate-300 dark:border-industrial-700 bg-white dark:bg-industrial-950 text-industrial-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors ${triggerClassName}`}
      >
        <span className={`block truncate ${selected ? '' : 'text-slate-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-industrial-700 bg-white dark:bg-industrial-900 shadow-lg text-sm animate-in fade-in duration-100"
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(opt.value)}
              className={`px-3 py-2 cursor-pointer text-left transition-colors ${
                opt.value === value
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-semibold'
                  : 'text-industrial-900 dark:text-white hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SelectDropdown;