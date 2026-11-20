import { api } from './api';
import { Command, CommandStatus, CommandType } from '../types';

export interface BackendCommandItem {
  id: number;
  gate_Id: number;
  code: string;
  name?: string;
  type: string;
  sort_weigh?: number;
  customer: string;
  seller?: string;
  depot?: string;
  material: string;
  targetWeight: number;
  completedWeight: number;
  weighMax?: number;
  weigh?: number;
  status: string;
  statusCode?: number;
  price?: number;
  rate?: number;
  /** Cờ tín hiệu thay đổi lệnh (1 = có thay đổi, 0 = không) do Backend quản lý — KHÔNG phải đơn vị tính */
  unit?: number;
  /** Tổng khối lượng ĐÃ CÂN thực tế (tổng hàng ròng Net từ dbo.Weighing) — đơn vị Tấn */
  weighedTons?: number;
  notes?: string;
  createdAt?: string;
}

export interface CreateCommandPayload {
  code?: string;
  name?: string;
  type?: string;
  sort_weigh?: number;
  customer?: string;
  seller?: string;
  depot?: string;
  material?: string;
  targetWeight?: number;
  completedWeight?: number;
  price?: number;
  rate?: number;
  status?: string;
  statusCode?: number;
  notes?: string;
  gate_Id?: number;
}

export function mapBackendCommandToFrontend(item: BackendCommandItem): Command {
  return {
    id: item.id.toString(),
    code: item.code || (item.name ? item.name : `CMD-${item.id}`),
    type: (item.type as CommandType) || 'Nhập hàng',
    customer: item.customer || 'Khách hàng vãng lai',
    seller: item.seller || undefined,
    material: item.material || 'Hàng tổng hợp',
    targetWeight: item.targetWeight ?? 0,
    // Khối lượng ĐÃ CÂN: lấy giá trị LỚN HƠN giữa dbo.command.Weigh và tổng hàng ròng Net
    // thực tế từ dbo.Weighing (cùng công thức với tab Điều Phối Ghép Lệnh).
    completedWeight: Math.max(item.completedWeight ?? 0, item.weighedTons ?? 0),
    status: (item.status as CommandStatus) || 'Không kích hoạt',
    notes: item.notes || '',
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

export const commandApi = {
  async getCommands(params?: { search?: string; status?: string; type?: string }): Promise<Command[]> {
    const res = await api.get<BackendCommandItem[]>('/commands', { params });
    return res.data.map(mapBackendCommandToFrontend);
  },

  async getCommandById(id: number | string): Promise<Command> {
    const res = await api.get<BackendCommandItem>(`/commands/${id}`);
    return mapBackendCommandToFrontend(res.data);
  },

  async createCommand(cmd: Partial<Command>): Promise<Command> {
    const payload: CreateCommandPayload = {
      code: cmd.code,
      name: cmd.code,
      type: cmd.type,
      customer: cmd.customer,
      seller: cmd.seller,
      material: cmd.material,
      targetWeight: cmd.targetWeight,
      status: cmd.status,
      notes: cmd.notes,
    };
    const res = await api.post<BackendCommandItem>('/commands', payload);
    return mapBackendCommandToFrontend(res.data);
  },

  async updateCommand(id: number | string, updates: Partial<Command>): Promise<Command> {
    const payload: Partial<CreateCommandPayload> = {
      code: updates.code,
      name: updates.code,
      type: updates.type,
      customer: updates.customer,
      seller: updates.seller,
      material: updates.material,
      targetWeight: updates.targetWeight,
      completedWeight: updates.completedWeight,
      status: updates.status,
      notes: updates.notes,
    };
    const res = await api.put<BackendCommandItem>(`/commands/${id}`, payload);
    return mapBackendCommandToFrontend(res.data);
  },

  async updateCommandStatus(id: number | string, status: CommandStatus): Promise<Command> {
    const res = await api.put<BackendCommandItem>(`/commands/${id}/status`, { status });
    return mapBackendCommandToFrontend(res.data);
  },

  async deleteCommand(id: number | string): Promise<void> {
    await api.delete(`/commands/${id}`);
  },

  async bulkDeleteCommands(ids: (number | string)[]): Promise<void> {
    const numIds = ids.map((i) => Number(i)).filter((n) => !isNaN(n));
    await api.post('/commands/bulk-delete', numIds);
  },

  async bulkUpdateCommandStatus(ids: (number | string)[], status: CommandStatus): Promise<void> {
    const numIds = ids.map((i) => Number(i)).filter((n) => !isNaN(n));
    await api.post('/commands/bulk-status', { ids: numIds, status });
  },
};
