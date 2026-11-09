import { useEffect, useRef } from 'react';

/**
 * Chu kỳ polling mặc định (ms) — cấu hình tập trung tại đây để dễ quản lý.
 * Rút ngắn xuống 2 giây để tăng độ nhạy cho các thao tác cân xe tại trạm.
 */
export const DEFAULT_POLL_INTERVAL_MS = 2000;

/**
 * Gọi callback định kỳ mỗi `intervalMs` (mặc định 2 giây) — dùng cho giám sát realtime.
 * - Tự động dọn dẹp timer khi unmount / khi thay đổi phụ thuộc (tránh memory leak).
 * - Luôn gọi phiên bản callback mới nhất (lưu qua useRef) nên không cần re-create interval
 *   mỗi khi callback đổi identity.
 * - Có thể bật/tắt bằng tham số `enabled`.
 */
export function usePolling(
  callback: () => void,
  intervalMs: number = DEFAULT_POLL_INTERVAL_MS,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);

  // Luôn giữ callback mới nhất
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    if (intervalMs <= 0) return;

    const intervalId = setInterval(() => {
      savedCallback.current();
    }, intervalMs);

    // Cleanup: hủy timer khi unmount hoặc khi intervalMs/enabled thay đổi
    return () => clearInterval(intervalId);
  }, [intervalMs, enabled]);
}

export default usePolling;
