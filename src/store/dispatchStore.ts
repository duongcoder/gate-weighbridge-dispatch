import { useState, useEffect } from 'react';
import { 
  Command, 
  VehicleCard, 
  DispatchOrder, 
  OrderTrip, 
  GateStep, 
  RelationType, 
  CommandStatus,
  VehicleStatus,
  ScaleReading 
} from '../types';
import { 
  INITIAL_COMMANDS, 
  INITIAL_VEHICLES, 
  INITIAL_ORDERS, 
  INITIAL_TRIPS 
} from './mockData';
import { commandApi } from '../services/commandApi';
import { vehicleApi } from '../services/vehicleApi';
import { orderApi } from '../services/orderApi';

const STORAGE_KEYS = {
  COMMANDS: 'gw_commands_v1',
  VEHICLES: 'gw_vehicles_v1',
  ORDERS: 'gw_orders_v1',
  TRIPS: 'gw_trips_v1',
  DARK_MODE: 'gw_dark_mode_v1',
};

function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

class DispatchStoreManager {
  private commands: Command[] = loadStorage(STORAGE_KEYS.COMMANDS, INITIAL_COMMANDS);
  private vehicles: VehicleCard[] = loadStorage(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
  private orders: DispatchOrder[] = loadStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  private trips: OrderTrip[] = loadStorage(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
  private darkMode: boolean = loadStorage(STORAGE_KEYS.DARK_MODE, true);
  private activeTab: 'COMMANDS' | 'VEHICLES' | 'DISPATCH' | 'REPORT' = 'DISPATCH';
  private searchQuery: string = '';
  private isLoadedFromBackend: boolean = false;
  
  // Hardware Scale Simulation State
  private scaleReading: ScaleReading = {
    currentWeight: 0.00,
    isStable: true,
    isZero: true,
    scaleId: 'SCALE-01',
    scaleName: 'Cân Bàn Điện Tử 80 Tấn (Làn 1)',
    unit: 'TẤN',
    lastUpdated: new Date().toISOString(),
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    // Synchronize HTML element dark class on init
    if (typeof window !== 'undefined') {
      if (this.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Auto fetch initial data from backend database
    this.fetchInitialData();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // Getters
  getState() {
    return {
      commands: this.commands,
      vehicles: this.vehicles,
      orders: this.orders,
      trips: this.trips,
      darkMode: this.darkMode,
      activeTab: this.activeTab,
      searchQuery: this.searchQuery,
      scaleReading: this.scaleReading,
      isLoadedFromBackend: this.isLoadedFromBackend,
    };
  }

  // UI state mutators
  setActiveTab(tab: 'COMMANDS' | 'VEHICLES' | 'DISPATCH' | 'REPORT') {
    this.activeTab = tab;
    this.notify();
  }

  setSearchQuery(q: string) {
    this.searchQuery = q;
    this.notify();
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    saveStorage(STORAGE_KEYS.DARK_MODE, this.darkMode);
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.notify();
  }

  // Reset to original mock data
  resetAllData() {
    this.commands = [...INITIAL_COMMANDS];
    this.vehicles = [...INITIAL_VEHICLES];
    this.orders = [...INITIAL_ORDERS];
    this.trips = [...INITIAL_TRIPS];
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    saveStorage(STORAGE_KEYS.ORDERS, this.orders);
    saveStorage(STORAGE_KEYS.TRIPS, this.trips);
    this.notify();
  }

  // -------------------------------------------------------------
  // FETCH FROM REAL DATABASE (QLKhoHang_BA)
  // -------------------------------------------------------------
  async fetchInitialData(options: { preserveProgress?: boolean } = {}) {
    try {
      const [remoteCmds, remoteVehs, remoteOrders] = await Promise.all([
        commandApi.getCommands().catch((err) => {
          console.warn('Lỗi tải commands từ API:', err);
          return null;
        }),
        vehicleApi.getVehicles().catch((err) => {
          console.warn('Lỗi tải vehicles từ API:', err);
          return null;
        }),
        orderApi.getOrders().catch((err) => {
          console.warn('Lỗi tải orders từ API:', err);
          return null;
        }),
      ]);

      if (remoteCmds && remoteCmds.length > 0) {
        this.commands = remoteCmds;
        saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
      }

      if (remoteVehs && remoteVehs.length > 0) {
        this.vehicles = remoteVehs;
        saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
      }

      // Áp dụng khi fetch THÀNH CÔNG (kể cả danh sách RỖNG) để phản ánh ngay việc thêm/xóa
      // dòng dbo.Order trực tiếp trong SQL Server mà không cần F5.
      if (remoteOrders) {
        // Group orders by commandId
        const orderMap = new Map<number, typeof remoteOrders>();
        for (const o of remoteOrders) {
          const cmdId = o.commandId;
          if (!orderMap.has(cmdId)) {
            orderMap.set(cmdId, []);
          }
          orderMap.get(cmdId)!.push(o);
        }

        const newOrders: DispatchOrder[] = [];
        const newTrips: OrderTrip[] = [];

        // Bản đồ dữ liệu hiện có để GIỮ NGUYÊN tiến trình khi polling ngầm (silent refresh)
        const existingTripsById = new Map(this.trips.map((t) => [t.id, t]));
        const existingOrdersById = new Map(this.orders.map((o) => [o.id, o]));

        // LỊCH SỬ THEO LƯỢT: Id dòng dbo.Order LỚN NHẤT của mỗi cặp (CommandId, CardId) = LƯỢT HIỆN TẠI;
        // các dòng cũ hơn cùng cặp = LƯỢT LỊCH SỬ (đã kết thúc) ⇒ luôn hiển thị là đã hoàn thành.
        const latestRowIdByPair = new Map<string, number>();
        for (const o of remoteOrders) {
          const pairKey = `${o.commandId}::${o.idCard}`;
          const prev = latestRowIdByPair.get(pairKey);
          if (prev === undefined || o.id > prev) latestRowIdByPair.set(pairKey, o.id);
        }

        orderMap.forEach((group, cmdId) => {
          const matchedCmd = this.commands.find((c) => c.id === cmdId.toString());
          const orderId = `dsp-cmd-${cmdId}`;
          const orderCode = `DSP-${matchedCmd?.code || cmdId}`;
          // Loại bỏ trùng: mỗi xe chỉ xuất hiện MỘT lần trong nhóm lệnh
          const vehicleIds = [...new Set(group.map((g) => g.idCard.toString()))];

          let relationType: RelationType = '1-1';
          if (vehicleIds.length > 1) relationType = '1-N';

          const existingOrder = options.preserveProgress ? existingOrdersById.get(orderId) : undefined;

          // ĐỒNG BỘ 2 CHIỀU (chiều DB ➔ Web): trạng thái lệnh điều phối lấy TRỰC TIẾP từ
          // dbo.command.Status do Backend trả về:
          //   Status = 2 (Hoàn thành)       → 'Đã hoàn thành' (không treo ở "Đang điều phối")
          //   Status = 1 (Đang chạy)/khác   → 'Đang điều phối'
          const cmdStatusCode = group[0]?.commandStatus;
          const isCompleted =
            cmdStatusCode === 2 ||
            group[0]?.commandStatusText === 'Hoàn thành' ||
            matchedCmd?.status === 'Hoàn thành';

          newOrders.push({
            id: orderId,
            code: orderCode,
            commandIds: [cmdId.toString()],
            vehicleIds,
            relationType,
            status: isCompleted ? 'COMPLETED' : 'ACTIVE',
            createdAt: existingOrder?.createdAt ?? new Date().toISOString(),
            completedAt: isCompleted ? (existingOrder?.completedAt ?? new Date().toISOString()) : undefined,
            notes: existingOrder?.notes ?? `Ghép lệnh ${orderCode}`,
          });

          for (const item of group) {
            const vId = item.idCard.toString();
            const veh = this.vehicles.find((v) => v.id === vId);
            const tripId = `trip-${item.id}`;
            const existingTrip = options.preserveProgress ? existingTripsById.get(tripId) : undefined;

            // LỊCH SỬ THEO LƯỢT: mỗi dòng dbo.Order = 1 LƯỢT ghép. Lượt có Id LỚN NHẤT của mỗi cặp
            // (CardId, CommandId) là LƯỢT HIỆN TẠI; các dòng cũ hơn là LƯỢT LỊCH SỬ.
            const isHistoricalRound = latestRowIdByPair.get(`${cmdId}::${item.idCard}`) !== item.id;

            const baseTrip: OrderTrip = existingTrip ?? {
              id: tripId,
              orderId,
              vehicleId: vId,
              plateNumber: item.bsx || veh?.plateNumber || 'UNKNOWN',
              driverName: item.nameUser || veh?.driverName || 'Tài xế vãng lai',
              driverPhone: veh?.driverPhone,
              transportCompany: item.sortCar || veh?.transportCompany || 'Đội xe nội bộ',
              step: 'GATE_IN',
              notes: `Chuyến ghép xe ${item.bsx} vào lệnh ${orderCode}`,
            };

            // Object MỚI (spread) — không sửa trực tiếp chuyến đang có trong store
            const trip: OrderTrip = { ...baseTrip, orderRowId: item.id, isHistoricalRound };

            if (isHistoricalRound) {
              // LƯỢT LỊCH SỬ (đã bị lượt mới hơn thay thế) ⇒ LUÔN HOÀN TẤT
              trip.step = 'COMPLETED';
              trip.completedTime = trip.completedTime ?? new Date().toISOString();
            } else if (item.cardStatus === true) {
              // Lượt hiện tại: xe đã rời trạm (Rảnh - Sẵn sàng) ⇒ HOÀN TẤT
              trip.step = 'COMPLETED';
              trip.completedTime = trip.completedTime ?? new Date().toISOString();
            } else if (existingTrip && existingTrip.step !== 'COMPLETED') {
              // Xe đang vận hành (chuyến chưa hoàn tất) → giữ nguyên tiến trình & khối lượng cân
              trip.step = existingTrip.step;
            } else if (existingTrip && item.cardStatus !== false) {
              // Không có tín hiệu rõ ràng từ DB (xe vãng lai / thiếu dòng dbo.Card) → giữ nguyên
              trip.step = existingTrip.step;
            } else {
              // Xe ĐANG TRONG TRẠM (Card.Status = false) nhưng chuyến cũ đã COMPLETED
              // ⇒ GHÉP LẠI một xe đã từng chạy ở lệnh này: khởi tạo LƯỢT MỚI đang vận hành
              //    và XÓA dữ liệu cân của lần chạy trước.
              trip.step = 'GATE_IN';
              trip.completedTime = undefined;
              trip.firstWeight = undefined;
              trip.firstWeightTime = undefined;
              trip.secondWeight = undefined;
              trip.secondWeightTime = undefined;
              trip.netWeight = undefined;
              trip.notes = `Ghép lại xe ${item.bsx} vào lệnh ${orderCode}`;
            }

            newTrips.push(trip);
          }
        });

        // LỊCH SỬ THEO LƯỢT: GIỮ NGUYÊN tất cả các chuyến — mỗi dòng dbo.Order là 1 lượt,
        // trip.id = `trip-{Order.Id}` nên KHÔNG trùng key giữa các lượt khác nhau.
        // Luôn gán (kể cả rỗng) để phản ánh đúng dữ liệu dbo.Order hiện có trong CSDL.
        this.orders = newOrders;
        this.trips = newTrips;
        saveStorage(STORAGE_KEYS.ORDERS, this.orders);
        saveStorage(STORAGE_KEYS.TRIPS, this.trips);
      }

      this.isLoadedFromBackend = true;
      this.notify();
    } catch (err) {
      console.warn('Backend chưa sẵn sàng hoặc gặp lỗi mạng:', err);
    }
  }

  // -------------------------------------------------------------
  // COMMANDS CRUD
  // -------------------------------------------------------------
  addCommand(cmd: Omit<Command, 'id' | 'createdAt' | 'completedWeight'>): Command {
    const newId = `cmd-${Date.now()}`;
    const newCommand: Command = {
      ...cmd,
      id: newId,
      completedWeight: 0,
      createdAt: new Date().toISOString(),
    };
    this.commands = [newCommand, ...this.commands];
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();

    // Async sync to backend
    commandApi.createCommand(cmd)
      .then((created) => {
        this.commands = this.commands.map((c) => (c.id === newId ? created : c));
        saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
        this.notify();
      })
      .catch((err) => {
        console.warn('Lỗi đồng bộ tạo lệnh lên CSDL:', err);
      });

    return newCommand;
  }

  async updateCommand(id: string, updates: Partial<Command>) {
    this.commands = this.commands.map((c) => (c.id === id ? { ...c, ...updates } : c));
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();

    try {
      await commandApi.updateCommand(id, updates);
      // ĐỒNG BỘ 2 CHIỀU: sau khi sửa lệnh (kể cả đổi trạng thái) → nạp lại cả commands & orders
      // để tab Điều Phối Ghép Lệnh luôn khớp với tab Quản Lý Lệnh.
      await this.fetchInitialData({ preserveProgress: true });
    } catch (error) {
      console.warn('Lỗi gọi API updateCommand:', error);
    }
  }

  async deleteCommand(id: string) {
    this.commands = this.commands.filter((c) => c.id !== id);
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();

    try {
      await commandApi.deleteCommand(id);
    } catch (error) {
      console.warn('Lỗi gọi API deleteCommand:', error);
    }
  }

  async bulkDeleteCommands(ids: string[]) {
    const idSet = new Set(ids);
    this.commands = this.commands.filter((c) => !idSet.has(c.id));
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();

    try {
      await commandApi.bulkDeleteCommands(ids);
    } catch (error) {
      console.warn('Lỗi gọi API bulkDeleteCommands:', error);
    }
  }

  async bulkUpdateCommandStatus(ids: string[], status: CommandStatus) {
    const idSet = new Set(ids);
    this.commands = this.commands.map((c) => (idSet.has(c.id) ? { ...c, status } : c));
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();

    try {
      await commandApi.bulkUpdateCommandStatus(ids, status);
      // ĐỒNG BỘ 2 CHIỀU: trạng thái lệnh vừa đổi ở tab Quản Lý Lệnh → nạp lại ngay để
      // tab Điều Phối Ghép Lệnh cập nhật "Đã hoàn thành"/"Đang điều phối" tương ứng.
      await this.fetchInitialData({ preserveProgress: true });
    } catch (error) {
      console.warn('Lỗi gọi API bulkUpdateCommandStatus:', error);
    }
  }

  // -------------------------------------------------------------
  // VEHICLES CRUD
  // -------------------------------------------------------------
  addVehicle(veh: Omit<VehicleCard, 'id' | 'lastActiveAt' | 'activeTripId'>): VehicleCard {
    const newId = `veh-${Date.now()}`;
    const cleanPlate = veh.plateNumber.trim().toUpperCase();
    const autoCardNo = veh.cardNo?.trim().toUpperCase() || `XE-${cleanPlate.replace(/[^A-Z0-9]/g, '')}`;
    const newVehicle: VehicleCard = {
      ...veh,
      id: newId,
      plateNumber: cleanPlate,
      trailerPlate: veh.trailerPlate?.trim().toUpperCase(),
      cardNo: autoCardNo,
      lastActiveAt: new Date().toISOString(),
    };
    this.vehicles = [newVehicle, ...this.vehicles];
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    this.notify();

    // Async sync to backend
    vehicleApi.createVehicle(newVehicle)
      .then((created) => {
        this.vehicles = this.vehicles.map((v) => (v.id === newId ? created : v));
        saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
        this.notify();
      })
      .catch((err) => {
        console.warn('Lỗi đồng bộ thêm xe lên CSDL:', err);
      });

    return newVehicle;
  }

  async updateVehicle(id: string, updates: Partial<VehicleCard>) {
    this.vehicles = this.vehicles.map((v) => {
      if (v.id === id) {
        return {
          ...v,
          ...updates,
          plateNumber: updates.plateNumber ? updates.plateNumber.trim().toUpperCase() : v.plateNumber,
          trailerPlate: updates.trailerPlate !== undefined ? updates.trailerPlate.trim().toUpperCase() : v.trailerPlate,
          cardNo: updates.cardNo ? updates.cardNo.trim().toUpperCase() : v.cardNo,
        };
      }
      return v;
    });
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    this.notify();

    try {
      await vehicleApi.updateVehicle(id, updates);
    } catch (error) {
      console.warn('Lỗi gọi API updateVehicle:', error);
    }
  }

  async deleteVehicle(id: string) {
    this.vehicles = this.vehicles.filter((v) => v.id !== id);
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    this.notify();

    try {
      await vehicleApi.deleteVehicle(id);
    } catch (error) {
      console.warn('Lỗi gọi API deleteVehicle:', error);
    }
  }

  async updateVehicleStatus(id: string, status: VehicleStatus) {
    this.vehicles = this.vehicles.map((v) => (v.id === id ? { ...v, status } : v));
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    this.notify();

    try {
      await vehicleApi.updateVehicleStatus(id, status);
    } catch (error) {
      console.warn('Lỗi gọi API updateVehicleStatus:', error);
    }
  }

  findVehicleByCardOrPlate(identifier: string): VehicleCard | undefined {
    const clean = identifier.trim().toUpperCase();
    return this.vehicles.find(
      (v) => v.cardNo.toUpperCase() === clean || v.plateNumber.toUpperCase() === clean
    );
  }

  // -------------------------------------------------------------
  // DISPATCH ORDERS & GHÉP LỆNH (Map dbo.Order)
  // -------------------------------------------------------------
  createDispatchOrder(commandIds: string[], vehicleIds: string[], notes?: string): { order: DispatchOrder; trips: OrderTrip[] } | null {
    if (commandIds.length === 0 || vehicleIds.length === 0) return null;

    let relationType: RelationType = '1-1';
    if (commandIds.length === 1 && vehicleIds.length === 1) {
      relationType = '1-1';
    } else if (commandIds.length === 1 && vehicleIds.length > 1) {
      relationType = '1-N';
    } else if (commandIds.length > 1 && vehicleIds.length === 1) {
      relationType = 'N-1';
    } else {
      relationType = 'N-N';
    }

    const orderId = `dsp-${Date.now()}`;
    const orderCode = `DSP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: DispatchOrder = {
      id: orderId,
      code: orderCode,
      commandIds,
      vehicleIds,
      relationType,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      notes,
    };

    const newTrips: OrderTrip[] = vehicleIds.map((vId, idx) => {
      const veh = this.vehicles.find((v) => v.id === vId);
      return {
        id: `trip-${Date.now()}-${idx}`,
        orderId,
        vehicleId: vId,
        plateNumber: veh ? veh.plateNumber : 'UNKNOWN',
        driverName: veh ? veh.driverName : 'Chưa có tên',
        driverPhone: veh?.driverPhone,
        transportCompany: veh?.transportCompany,
        step: 'GATE_IN',
        notes: notes || `Chuyến theo lệnh ${orderCode}`,
      };
    });

    const vIdToTripIdMap = new Map(newTrips.map((t) => [t.vehicleId, t.id]));
    this.vehicles = this.vehicles.map((v) => {
      if (vIdToTripIdMap.has(v.id)) {
        return {
          ...v,
          status: 'Đang trong trạm (In-Station)',
          activeTripId: vIdToTripIdMap.get(v.id),
          lastActiveAt: new Date().toISOString(),
        };
      }
      return v;
    });

    const cmdIdSet = new Set(commandIds);
    this.commands = this.commands.map((c) => {
      if (cmdIdSet.has(c.id) && c.status === 'Không kích hoạt') {
        return { ...c, status: 'Đang chạy' };
      }
      return c;
    });

    this.orders = [newOrder, ...this.orders];
    this.trips = [...newTrips, ...this.trips];

    saveStorage(STORAGE_KEYS.ORDERS, this.orders);
    saveStorage(STORAGE_KEYS.TRIPS, this.trips);
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();

    // Đồng bộ vào dbo.Order qua API BatchDispatch
    try {
      const numCmds = commandIds.map(Number).filter((n) => !isNaN(n));
      const numVehs = vehicleIds.map(Number).filter((n) => !isNaN(n));
      if (numCmds.length > 0 && numVehs.length > 0) {
        orderApi.batchDispatch({
          commandIds: numCmds,
          vehicleIds: numVehs,
          notes,
        })
          // ĐỒNG BỘ 2 CHIỀU: sau khi ghi dbo.Order, nạp lại để tab Quản Lý Lệnh nhận ngay
          // trạng thái "Đang chạy" (Status = 1, Unit = 1) do Backend đồng bộ.
          .then(() => this.fetchInitialData({ preserveProgress: true }))
          .catch((err) => console.warn('Lỗi gọi API batchDispatch:', err));
      }
    } catch (error) {
      console.warn('Lỗi khởi tạo batchDispatch:', error);
    }

    return { order: newOrder, trips: newTrips };
  }

  // Advance truck step independently & directional scale logic
  advanceTripStep(
    tripId: string, 
    targetStep?: GateStep,
    weights?: { firstWeight?: number; secondWeight?: number; netWeight?: number; operator?: string; notes?: string }
  ) {
    const trip = this.trips.find((t) => t.id === tripId);
    if (!trip) return;

    const order = this.orders.find((o) => o.id === trip.orderId);
    const primaryCommand = order?.commandIds.length
      ? this.commands.find((c) => c.id === order.commandIds[0])
      : undefined;

    const stepFlow: GateStep[] = ['GATE_IN', 'SCALE_1', 'LOADING_UNLOADING', 'SCALE_2', 'GATE_OUT', 'COMPLETED'];
    let nextStep: GateStep = targetStep || 'GATE_IN';
    if (!targetStep) {
      const currIdx = stepFlow.indexOf(trip.step);
      nextStep = currIdx < stepFlow.length - 1 ? stepFlow[currIdx + 1] : 'COMPLETED';
    }

    const nowIso = new Date().toISOString();
    const updatedTrip: OrderTrip = {
      ...trip,
      step: nextStep,
      notes: weights?.notes !== undefined ? weights.notes : trip.notes,
      scaleOperator: weights?.operator || trip.scaleOperator,
    };

    if (weights?.firstWeight !== undefined) {
      updatedTrip.firstWeight = weights.firstWeight;
      updatedTrip.firstWeightTime = nowIso;
    }
    if (weights?.secondWeight !== undefined) {
      updatedTrip.secondWeight = weights.secondWeight;
      updatedTrip.secondWeightTime = nowIso;
    }

    if (weights?.netWeight !== undefined) {
      updatedTrip.netWeight = weights.netWeight;
    } else if (updatedTrip.firstWeight !== undefined && updatedTrip.secondWeight !== undefined) {
      updatedTrip.netWeight = Math.abs(Number((updatedTrip.firstWeight - updatedTrip.secondWeight).toFixed(2)));
    }

    if (nextStep === 'COMPLETED') {
      updatedTrip.completedTime = nowIso;

      this.vehicles = this.vehicles.map((v) => {
        if (v.id === updatedTrip.vehicleId) {
          return {
            ...v,
            status: 'Rảnh (Idle)',
            activeTripId: undefined,
            lastActiveAt: nowIso,
          };
        }
        return v;
      });

      if (updatedTrip.netWeight && primaryCommand) {
        let reachedCommandId: string | null = null;

        this.commands = this.commands.map((cmd) => {
          if (cmd.id === primaryCommand.id) {
            const newCompleted = Number(((cmd.completedWeight || 0) + (updatedTrip.netWeight || 0)).toFixed(2));
            // Đạt chỉ tiêu khối lượng (chỉ tiêu > 0) → tự động chuyển "Hoàn thành"
            const isReached = cmd.targetWeight > 0 && newCompleted >= cmd.targetWeight;
            const newStatus = isReached ? 'Hoàn thành' : cmd.status;

            if (isReached && cmd.status !== 'Hoàn thành') {
              reachedCommandId = cmd.id;
            }

            return {
              ...cmd,
              completedWeight: newCompleted,
              status: newStatus,
            };
          }
          return cmd;
        });

        // ĐỒNG BỘ 2 CHIỀU (chiều Web ➔ DB): chốt cân đạt chỉ tiêu → dbo.command.Status = 2 + Unit = 1
        // để tab Quản Lý Lệnh chuyển badge xanh ngay, không cần F5.
        if (reachedCommandId) {
          commandApi
            .updateCommandStatus(reachedCommandId, 'Hoàn thành')
            .catch((err) => console.warn('Lỗi đồng bộ hoàn thành lệnh theo khối lượng:', err));
        }
      }

      // PERSIST: giải phóng xe trên Backend để polling ngầm (2s) không ghi đè trạng thái về "Trong trạm".
      // Hỗ trợ XE VÃNG LAI: gửi kèm biển số làm dự phòng khi CardId là ID tạm / không khớp dbo.Card.
      const releasedCardNum = Number(updatedTrip.vehicleId);
      const cardIdToSend = isNaN(releasedCardNum) ? 0 : releasedCardNum;
      const releasedPlate =
        updatedTrip.plateNumber || this.vehicles.find((v) => v.id === updatedTrip.vehicleId)?.plateNumber;
      if (cardIdToSend > 0 || releasedPlate) {
        orderApi.completeVehicle(cardIdToSend, releasedPlate).catch((err) =>
          console.warn('Lỗi gọi API completeVehicle (giải phóng xe):', err)
        );
      }
    }

    this.trips = this.trips.map((t) => (t.id === tripId ? updatedTrip : t));

    if (order) {
      const allOrderTrips = this.trips.filter((t) => t.orderId === order.id);
      const allDone = allOrderTrips.every((t) => t.step === 'COMPLETED');
      if (allDone) {
        this.orders = this.orders.map((o) =>
          o.id === order.id ? { ...o, status: 'COMPLETED', completedAt: nowIso } : o
        );
      }
    }

    saveStorage(STORAGE_KEYS.TRIPS, this.trips);
    saveStorage(STORAGE_KEYS.ORDERS, this.orders);
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();
  }

  // Detach a single vehicle from an order (Map DELETE dbo.Order)
  async detachVehicleFromOrder(tripId: string) {
    const trip = this.trips.find((t) => t.id === tripId);
    if (!trip) return;

    const order = this.orders.find((o) => o.id === trip.orderId);
    const primaryCmdId = order?.commandIds[0];

    this.vehicles = this.vehicles.map((v) =>
      v.id === trip.vehicleId ? { ...v, status: 'Rảnh (Idle)', activeTripId: undefined } : v
    );

    this.trips = this.trips.filter((t) => t.id !== tripId);

    this.orders = this.orders.map((o) => {
      if (o.id === trip.orderId) {
        const remainingVehs = o.vehicleIds.filter((vId) => vId !== trip.vehicleId);
        return { ...o, vehicleIds: remainingVehs };
      }
      return o;
    });

    saveStorage(STORAGE_KEYS.TRIPS, this.trips);
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    saveStorage(STORAGE_KEYS.ORDERS, this.orders);
    this.notify();

    // Gọi API xóa khỏi dbo.Order
    if (primaryCmdId) {
      try {
        const cardNum = Number(trip.vehicleId);
        const cmdNum = Number(primaryCmdId);
        if (!isNaN(cardNum) && !isNaN(cmdNum)) {
          // TÁCH THEO LƯỢT: chỉ xoá ĐÚNG LƯỢT đang thao tác (theo dbo.Order.Id),
          // GIỮ NGUYÊN các lượt lịch sử khác của cùng cặp xe–lệnh.
          await orderApi.detachVehicle({ cardId: cardNum, commandId: cmdNum, orderId: trip.orderRowId });
        }
      } catch (err) {
        console.warn('Lỗi gọi API detachVehicle:', err);
      }
    }
  }

  // Attach an additional vehicle into an existing order (Map INSERT dbo.Order)
  async attachVehicleToOrder(orderId: string, vehicleId: string) {
    const order = this.orders.find((o) => o.id === orderId);
    const vehicle = this.vehicles.find((v) => v.id === vehicleId);
    if (!order || !vehicle) return;

    const newTrip: OrderTrip = {
      id: `trip-${Date.now()}`,
      orderId,
      vehicleId,
      plateNumber: vehicle.plateNumber,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      transportCompany: vehicle.transportCompany,
      step: 'GATE_IN',
      notes: `Bổ sung xe vào lệnh ${order.code}`,
    };

    this.vehicles = this.vehicles.map((v) =>
      v.id === vehicleId
        ? {
            ...v,
            status: 'Đang trong trạm (In-Station)',
            activeTripId: newTrip.id,
            lastActiveAt: new Date().toISOString(),
          }
        : v
    );

    this.orders = this.orders.map((o) => {
      if (o.id === orderId) {
        const updatedVehs = [...o.vehicleIds, vehicleId];
        let relType = o.relationType;
        if (o.commandIds.length === 1 && updatedVehs.length > 1) relType = '1-N';
        if (o.commandIds.length > 1 && updatedVehs.length > 1) relType = 'N-N';
        return { ...o, vehicleIds: updatedVehs, relationType: relType };
      }
      return o;
    });

    this.trips = [newTrip, ...this.trips];

    // ĐỒNG BỘ 2 CHIỀU: bổ sung xe vào lệnh → lệnh chuyển sang "Đang chạy"
    // (khớp dbo.command.Status = 1 do Backend đồng bộ).
    const orderCmdIdSet = new Set(order.commandIds);
    this.commands = this.commands.map((c) =>
      orderCmdIdSet.has(c.id) && c.status === 'Không kích hoạt' ? { ...c, status: 'Đang chạy' } : c
    );

    saveStorage(STORAGE_KEYS.TRIPS, this.trips);
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    saveStorage(STORAGE_KEYS.ORDERS, this.orders);
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();

    // Gọi API lưu vào dbo.Order
    const primaryCmdId = order.commandIds[0];
    if (primaryCmdId) {
      try {
        const cardNum = Number(vehicleId);
        const cmdNum = Number(primaryCmdId);
        if (!isNaN(cardNum) && !isNaN(cmdNum)) {
          await orderApi.attachVehicle({ cardId: cardNum, commandId: cmdNum });
          // Nạp lại sau khi ghi để cả 2 tab khớp dữ liệu tức thì
          await this.fetchInitialData({ preserveProgress: true });
        }
      } catch (err) {
        console.warn('Lỗi gọi API attachVehicle:', err);
      }
    }
  }

  completeOrder(orderId: string) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return;

    const nowIso = new Date().toISOString();
    const orderTrips = this.trips.filter((t) => t.orderId === orderId);
    const tripVehicleIds = new Set(orderTrips.map((t) => t.vehicleId));

    this.trips = this.trips.map((t) =>
      t.orderId === orderId ? { ...t, step: 'COMPLETED', completedTime: nowIso } : t
    );

    this.vehicles = this.vehicles.map((v) =>
      tripVehicleIds.has(v.id) ? { ...v, status: 'Rảnh (Idle)', activeTripId: undefined } : v
    );

    this.orders = this.orders.map((o) =>
      o.id === orderId ? { ...o, status: 'COMPLETED', completedAt: nowIso } : o
    );

    // ĐỒNG BỘ 2 CHIỀU (chiều Web ➔ DB): TOÀN BỘ dbo.command thuộc lệnh điều phối → "Hoàn thành"
    // ⇒ tab Quản Lý Lệnh chuyển badge xanh ngay lập tức (và dbo.command.Status = 2 trong CSDL).
    const orderCmdIdSet = new Set(order.commandIds);
    this.commands = this.commands.map((c) =>
      orderCmdIdSet.has(c.id) ? { ...c, status: 'Hoàn thành' as CommandStatus } : c
    );

    saveStorage(STORAGE_KEYS.TRIPS, this.trips);
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    saveStorage(STORAGE_KEYS.ORDERS, this.orders);
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();

    // PERSIST 1: dbo.command.Status = 2 + Unit = 1 và giải phóng xe theo lệnh điều phối
    // (một transaction ở Backend: POST /api/orders/complete-order).
    const numCmds = order.commandIds.map(Number).filter((n) => !isNaN(n));
    const numCards = order.vehicleIds.map(Number).filter((n) => !isNaN(n));
    const persistOrderSync =
      numCmds.length > 0
        ? orderApi
            .completeOrder({ commandIds: numCmds, cardIds: numCards, releaseVehicles: true })
            .catch((err) => {
              console.warn('Lỗi gọi API completeOrder (đồng bộ dbo.command.Status = 2):', err);
              return null;
            })
        : Promise.resolve(null);

    // PERSIST 2: giải phóng tất cả xe của lệnh trên Backend (chống polling ngầm ghi đè trạng thái).
    // Gửi kèm biển số để hỗ trợ cả XE VÃNG LAI (CardId có thể là ID tạm / không khớp dbo.Card).
    tripVehicleIds.forEach((vId) => {
      const cardNum = Number(vId);
      const cardIdToSend = isNaN(cardNum) ? 0 : cardNum;
      const plate =
        this.vehicles.find((v) => v.id === vId)?.plateNumber ||
        this.trips.find((t) => t.vehicleId === vId)?.plateNumber;
      if (cardIdToSend > 0 || plate) {
        orderApi.completeVehicle(cardIdToSend, plate).catch((err) =>
          console.warn('Lỗi gọi API completeVehicle (completeOrder):', err)
        );
      }
    });

    // ĐỒNG BỘ LẠI sau khi ghi thành công để 2 tab khớp dữ liệu tức thì
    // (chỉ nạp lại khi API thành công, tránh ghi đè trạng thái vừa hoàn tất khi backend lỗi).
    persistOrderSync.then((result) => {
      if (result) {
        this.fetchInitialData({ preserveProgress: true }).catch((err) =>
          console.warn('Lỗi đồng bộ lại sau khi hoàn tất lệnh:', err)
        );
      }
    });
  }

  // -------------------------------------------------------------
  // SCALE HARDWARE SIMULATION
  // -------------------------------------------------------------
  setSimulatedScaleWeight(weightTons: number, isStable = true) {
    this.scaleReading = {
      ...this.scaleReading,
      currentWeight: Number(weightTons.toFixed(2)),
      isStable,
      isZero: weightTons === 0,
      lastUpdated: new Date().toISOString(),
    };
    this.notify();
  }

  zeroScale() {
    this.setSimulatedScaleWeight(0.00, true);
  }
}

export const dispatchStore = new DispatchStoreManager();

export function useStore() {
  const [state, setState] = useState(dispatchStore.getState());

  useEffect(() => {
    return dispatchStore.subscribe(() => {
      setState(dispatchStore.getState());
    });
  }, []);

  return {
    ...state,
    setActiveTab: (tab: 'COMMANDS' | 'VEHICLES' | 'DISPATCH' | 'REPORT') => dispatchStore.setActiveTab(tab),
    setSearchQuery: (q: string) => dispatchStore.setSearchQuery(q),
    toggleDarkMode: () => dispatchStore.toggleDarkMode(),
    resetAllData: () => dispatchStore.resetAllData(),
    fetchInitialData: (options?: { preserveProgress?: boolean }) => dispatchStore.fetchInitialData(options),
    // Commands
    addCommand: (cmd: Omit<Command, 'id' | 'createdAt' | 'completedWeight'>) => dispatchStore.addCommand(cmd),
    updateCommand: (id: string, updates: Partial<Command>) => dispatchStore.updateCommand(id, updates),
    deleteCommand: (id: string) => dispatchStore.deleteCommand(id),
    bulkDeleteCommands: (ids: string[]) => dispatchStore.bulkDeleteCommands(ids),
    bulkUpdateCommandStatus: (ids: string[], status: CommandStatus) => dispatchStore.bulkUpdateCommandStatus(ids, status),
    // Vehicles
    addVehicle: (veh: Omit<VehicleCard, 'id' | 'lastActiveAt' | 'activeTripId'>) => dispatchStore.addVehicle(veh),
    updateVehicle: (id: string, updates: Partial<VehicleCard>) => dispatchStore.updateVehicle(id, updates),
    deleteVehicle: (id: string) => dispatchStore.deleteVehicle(id),
    updateVehicleStatus: (id: string, status: VehicleStatus) => dispatchStore.updateVehicleStatus(id, status),
    findVehicleByCardOrPlate: (q: string) => dispatchStore.findVehicleByCardOrPlate(q),
    // Dispatch & Trips
    createDispatchOrder: (cIds: string[], vIds: string[], notes?: string) => dispatchStore.createDispatchOrder(cIds, vIds, notes),
    advanceTripStep: (tId: string, step?: GateStep, weights?: { firstWeight?: number; secondWeight?: number; netWeight?: number; operator?: string; notes?: string }) => dispatchStore.advanceTripStep(tId, step, weights),
    detachVehicleFromOrder: (tId: string) => dispatchStore.detachVehicleFromOrder(tId),
    attachVehicleToOrder: (oId: string, vId: string) => dispatchStore.attachVehicleToOrder(oId, vId),
    completeOrder: (oId: string) => dispatchStore.completeOrder(oId),
    // Scale Hardware Sim
    setSimulatedScaleWeight: (w: number, stable?: boolean) => dispatchStore.setSimulatedScaleWeight(w, stable),
    zeroScale: () => dispatchStore.zeroScale(),
  };
}
