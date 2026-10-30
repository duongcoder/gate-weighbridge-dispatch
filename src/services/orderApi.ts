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

  async deleteOrder(id: number): Promise<{ success: boolean }> {
    const res = await api.delete<{ success: boolean }>(`/orders/${id}`);
    return res.data;
  },
};

