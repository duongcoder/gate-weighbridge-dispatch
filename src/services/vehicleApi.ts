import { api } from './api';
import { VehicleCard, VehicleStatus } from '../types';

export interface BackendVehicleItem {
  id: string;
  idCard: number;
  gate_Id: number;
  cardNo: string;
  plateNumber: string;
  trailerPlate?: string;
  driverName: string;
  driverPhone?: string;
  transportCompany: string;
  defaultTareWeight: number;
  status: string;
  statusCode?: boolean;
  lastActiveAt?: string;
}

export interface CreateVehiclePayload {
  plateNumber: string;
  trailerPlate?: string;
  driverName?: string;
  driverPhone?: string;
  transportCompany?: string;
  cardNo?: string;
  defaultTareWeight?: number;
  status?: string;
  statusCode?: boolean;
  gate_Id?: number;
}

export function mapBackendVehicleToFrontend(item: BackendVehicleItem): VehicleCard {
  return {
    id: item.idCard ? item.idCard.toString() : item.id,
    cardNo: item.cardNo || `XE-${item.plateNumber.replace(/[^A-Z0-9]/gi, '')}`,
    plateNumber: item.plateNumber,
    trailerPlate: item.trailerPlate || undefined,
    driverName: item.driverName || 'Tài xế vãng lai',
    driverPhone: item.driverPhone || '098-XXX-XXXX',
    transportCompany: item.transportCompany || 'Đội xe nội bộ',
    defaultTareWeight: item.defaultTareWeight || 14.5,
    status: (item.status as VehicleStatus) || (item.statusCode ? 'Rảnh (Idle)' : 'Đang trong trạm (In-Station)'),
    lastActiveAt: item.lastActiveAt || new Date().toISOString(),
  };
}

export const vehicleApi = {
  async getVehicles(params?: { search?: string; status?: string }): Promise<VehicleCard[]> {
    const res = await api.get<BackendVehicleItem[]>('/vehicles', { params });
    return res.data.map(mapBackendVehicleToFrontend);
  },

  async getVehicleById(idCard: number | string): Promise<VehicleCard> {
    const res = await api.get<BackendVehicleItem>(`/vehicles/${idCard}`);
    return mapBackendVehicleToFrontend(res.data);
  },

  async createVehicle(veh: Partial<VehicleCard>): Promise<VehicleCard> {
    const payload: CreateVehiclePayload = {
      plateNumber: veh.plateNumber || '',
      trailerPlate: veh.trailerPlate,
      driverName: veh.driverName,
      driverPhone: veh.driverPhone,
      transportCompany: veh.transportCompany,
      cardNo: veh.cardNo,
      defaultTareWeight: veh.defaultTareWeight,
      status: veh.status,
    };
    const res = await api.post<BackendVehicleItem>('/vehicles', payload);
    return mapBackendVehicleToFrontend(res.data);
  },

  async updateVehicle(idCard: number | string, updates: Partial<VehicleCard>): Promise<VehicleCard> {
    const payload: Partial<CreateVehiclePayload> = {
      plateNumber: updates.plateNumber,
      trailerPlate: updates.trailerPlate,
      driverName: updates.driverName,
      driverPhone: updates.driverPhone,
      transportCompany: updates.transportCompany,
      cardNo: updates.cardNo,
      defaultTareWeight: updates.defaultTareWeight,
      status: updates.status,
    };
    const res = await api.put<BackendVehicleItem>(`/vehicles/${idCard}`, payload);
    return mapBackendVehicleToFrontend(res.data);
  },

  async updateVehicleStatus(idCard: number | string, status: VehicleStatus): Promise<VehicleCard> {
    const res = await api.put<BackendVehicleItem>(`/vehicles/${idCard}/status`, { status });
    return mapBackendVehicleToFrontend(res.data);
  },

  async deleteVehicle(idCard: number | string): Promise<void> {
    await api.delete(`/vehicles/${idCard}`);
  },
};

