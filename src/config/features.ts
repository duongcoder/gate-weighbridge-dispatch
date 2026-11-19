/**
 * ============================================================================
 * FEATURE FLAGS (Frontend) — Bật/tắt tính năng KHÔNG cần sửa logic
 * ============================================================================
 * Đổi giá trị các hằng số dưới đây rồi build lại để áp dụng.
 */

/**
 * Bật/tắt cột "TIẾN TRÌNH 5 BƯỚC (MINI STEPPER)" ở tab Điều Phối Ghép Lệnh.
 *
 * - `false` (mặc định hiện tại): ẨN cột/khối stepper trên bảng danh sách xe.
 *   LƯU Ý: Toàn bộ logic chuyển bước (`advanceTripStep`), hoàn tất (`complete-vehicle`),
 *   in phiếu, xem chi tiết, giải phóng xe... VẪN HOẠT ĐỘNG BÌNH THƯỜNG.
 * - `true`: Hiển thị lại đầy đủ — dành cho khách hàng cần theo dõi quy trình 5 bước.
 */
export const SHOW_FIVE_STEP_PROGRESS = false;
