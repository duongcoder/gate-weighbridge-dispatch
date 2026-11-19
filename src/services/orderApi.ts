import { api } from './api';

export interface BackendOrderItem {
  id: number;
  gate_Id: number;
  commandId: number;
  commandName?: string;
  goodName?: string;
  customer?: string;
  idCard: number;
  bsx?: string;
  bsContainer?: string;
  nameUser?: string;
  sortCar?: string;
  /** Trạng thái lệnh trong dbo.command: 0 = Không kích hoạt, 1 = Đang chạy, 2 = Hoàn thành */
  commandStatus?: number;
  /**
   * Trạng thái THỰC TẾ của phương tiện trong dbo.Card:
   *   true  = Rảnh (Sẵn sàng) — xe đã rời trạm ⇒ chuyến đã HOÀN TẤT
   *   false = Đang trong trạm (In-Station) — xe đang vận hành
   */
  cardStatus?: boolean;
  /** Nhãn trạng thái tương ứng (đồng bộ với tab Quản Lý Lệnh) */
  commandStatusText?: string;
}

/** Payload hoàn tất lệnh điều phối (POST /api/orders/complete-order) */
export interface CompleteOrderPayload {
  commandIds: number[];
  cardIds?: number[];
  releaseVehicles?: boolean;
  cleanupOrderRows?: boolean;
  gateId?: number;
}

export interface CompleteOrderResult {
  success: boolean;
  completedCommands: number;
  releasedCards: number;
  removedOrderRows: number;
  message: string;
}

export interface AttachPayload {
  cardId: number;
  commandId: number;
  gateId?: number;
}

export interface DetachPayload {
  cardId: number;
  commandId: number;
}

export interface BatchDispatchPayload {
  commandIds: number[];
  vehicleIds: number[];
  notes?: string;
  gateId?: number;
}

export const orderApi = {
  async getOrders(params?: { commandId?: number; cardId?: number }): Promise<BackendOrderItem[]> {
    const res = await api.get<BackendOrderItem[]>('/orders', { params });
    return res.data;
  },

  async attachVehicle(data: AttachPayload): Promise<{ success: boolean; id: number }> {
    const res = await api.post<{ success: boolean; id: number }>('/orders/attach', data);
    return res.data;
  },

  async detachVehicle(data: DetachPayload): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string }>('/orders/detach', data);
    return res.data;
  },

  async batchDispatch(data: BatchDispatchPayload): Promise<{ success: boolean; createdCount: number }> {
    const res = await api.post<{ success: boolean; createdCount: number }>('/orders/batch', data);
    return res.data;
  },

  // HOÀN TẤT LỆNH ĐIỀU PHỐI (nút "Hoàn tất lệnh"): Backend đồng bộ dbo.command.Status = 2 + Unit = 1
  // và giải phóng xe dbo.Card.Status = true — tất cả trong MỘT transaction.
  async completeOrder(data: CompleteOrderPayload): Promise<CompleteOrderResult> {
    const res = await api.post<CompleteOrderResult>('/orders/complete-order', data);
    return res.data;
  },

  async deleteOrder(id: number): Promise<{ success: boolean }> {
    const res = await api.delete<{ success: boolean }>(`/orders/${id}`);
    return res.data;
  },

  // Hoàn tất chuyến: giải phóng xe về trạng thái Rảnh (persist lên backend).
  // Hỗ trợ xe vãng lai: gửi kèm biển số (licensePlate) làm DỰ PHÒNG khi CardId không khớp dbo.Card.
  async completeVehicle(
    cardId: number,
    licensePlate?: string,
    gateId?: number,
  ): Promise<{ success: boolean; cardId: number; licensePlate?: string; status: string; message: string }> {
    const res = await api.post<{ success: boolean; cardId: number; licensePlate?: string; status: string; message: string }>(
      '/orders/complete-vehicle',
      { cardId, licensePlate, gateId },
    );
    return res.data;
  },
};

