import { useEffect, useRef } from 'react';
import { soundFx } from '../utils/audio';

interface UseRfidKeyboardWedgeOptions {
  onScan: (scannedCode: string) => void;
  minChars?: number;
  maxIntervalMs?: number;
  enabled?: boolean;
}

/**
 * Global Keyboard Wedge hook that intercepts high-speed buffered keystrokes from
 * physical USB / Bluetooth RFID badge readers & barcode scanners.
 * 
 * Barcode & RFID readers input characters at superhuman speed (< 40ms interval)
 * followed by an Enter key.
 */
export function useRfidKeyboardWedge({
  onScan,
  minChars = 4,
  maxIntervalMs = 50,
  enabled = true,
}: UseRfidKeyboardWedgeOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys alone
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
        return;
      }

      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If user is typing inside an active editable input, only allow wedge if it is high-speed scan
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable);

      if (e.key === 'Enter') {
        const scannedString = bufferRef.current.trim();
        bufferRef.current = '';

        if (scannedString.length >= minChars) {
          // If input was focused and user was just pressing Enter normally on slow typing, don't hijack unless it was rapid
          e.preventDefault();
          e.stopPropagation();
          soundFx.playRfidBeep();
          onScanRef.current(scannedString);
        }
        return;
      }

      // If keystrokes are too slow (> maxIntervalMs), reset buffer
      if (bufferRef.current.length > 0 && interval > maxIntervalMs) {
        bufferRef.current = '';
      }

      // Buffer single printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [minChars, maxIntervalMs, enabled]);
}
