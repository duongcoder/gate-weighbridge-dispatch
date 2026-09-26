export type CommandType = 'Nhập hàng' | 'Xuất hàng' | 'Vận chuyển nội bộ' | 'Cân dịch vụ';

export type CommandStatus = 'Chờ thực hiện' | 'Đang chạy' | 'Hoàn thành' | 'Đã hủy';

export interface Command {
  id: string;
  code: string;
  type: CommandType;
  customer: string;
  material: string;
  targetWeight: number; // in Metric Tons (Tấn)
  completedWeight: number; // in Metric Tons (Tấn)
  status: CommandStatus;
  notes?: string;
  createdAt: string;
}

export type VehicleStatus = 'Rảnh (Idle)' | 'Đang trong trạm (In-Station)' | 'Tạm khóa (Blocked)';

export interface VehicleCard {
  id: string;
  cardNo: string; // e.g. "RFID-8831"
  plateNumber: string; // e.g. "29H-123.45"
  trailerPlate?: string; // e.g. "29R-012.34"
  driverName: string;
  driverPhone: string;
  transportCompany: string;
  defaultTareWeight: number; // in Metric Tons
  status: VehicleStatus;
  activeTripId?: string;
  lastActiveAt?: string;
}

export type GateStep = 
  | 'GATE_IN'           // Chờ vào cổng / Check-in
  | 'SCALE_1'           // Cân lần 1 (Gross nếu Nhập, Tare nếu Xuất)
  | 'LOADING_UNLOADING' // Đang bốc dỡ hàng tại kho bãi
  | 'SCALE_2'           // Cân lần 2 (Tare nếu Nhập, Gross nếu Xuất)
  | 'GATE_OUT'          // Kiểm tra cổng ra / In phiếu
  | 'COMPLETED';        // Hoàn tất

export type RelationType = '1-1' | '1-N' | 'N-1' | 'N-N';

export interface OrderTrip {
  id: string;
  orderId: string;
  vehicleId: string;
  plateNumber: string;
  driverName: string;
  driverPhone?: string;
  transportCompany?: string;
  step: GateStep;
  // Directional scale measurements:
  firstWeight?: number;        // Gross if Inbound, Tare if Outbound
  secondWeight?: number;       // Tare if Inbound, Gross if Outbound
  netWeight?: number;          // Cargo Net Weight = |Gross - Tare|
  firstWeightTime?: string;
  secondWeightTime?: string;
  completedTime?: string;
  scaleOperator?: string;
  lane?: string;
  notes?: string;
}

export interface DispatchOrder {
  id: string;
  code: string; // e.g. "DSP-1001"
  commandIds: string[];
  vehicleIds: string[];
  relationType: RelationType;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface ScaleReading {
  currentWeight: number; // Tấn
  isStable: boolean;
  isZero: boolean;
  scaleId: string;
  scaleName: string;
  unit: 'TẤN' | 'KG';
  lastUpdated: string;
}

export interface FilterState {
  searchQuery: string;
  commandType?: string;
  commandStatus?: string;
  vehicleStatus?: string;
  gateStep?: string;
}
