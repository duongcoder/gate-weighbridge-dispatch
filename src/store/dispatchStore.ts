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

// Global state container with custom listeners for reactivity without external heavy libraries
class DispatchStoreManager {
  private commands: Command[] = loadStorage(STORAGE_KEYS.COMMANDS, INITIAL_COMMANDS);
  private vehicles: VehicleCard[] = loadStorage(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
  private orders: DispatchOrder[] = loadStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  private trips: OrderTrip[] = loadStorage(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
  private darkMode: boolean = loadStorage(STORAGE_KEYS.DARK_MODE, true);
  private activeTab: 'COMMANDS' | 'VEHICLES' | 'DISPATCH' = 'DISPATCH';
  private searchQuery: string = '';
  
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
    };
  }

  // UI state mutators
  setActiveTab(tab: 'COMMANDS' | 'VEHICLES' | 'DISPATCH') {
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

  // Reset to original rich mock data
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
  // COMMANDS CRUD
  // -------------------------------------------------------------
  addCommand(cmd: Omit<Command, 'id' | 'createdAt' | 'completedWeight'>) {
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
    return newCommand;
  }

  updateCommand(id: string, updates: Partial<Command>) {
    this.commands = this.commands.map((c) => (c.id === id ? { ...c, ...updates } : c));
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();
  }

  deleteCommand(id: string) {
    this.commands = this.commands.filter((c) => c.id !== id);
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();
  }

  bulkDeleteCommands(ids: string[]) {
    const idSet = new Set(ids);
    this.commands = this.commands.filter((c) => !idSet.has(c.id));
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();
  }

  bulkUpdateCommandStatus(ids: string[], status: CommandStatus) {
    const idSet = new Set(ids);
    this.commands = this.commands.map((c) => (idSet.has(c.id) ? { ...c, status } : c));
    saveStorage(STORAGE_KEYS.COMMANDS, this.commands);
    this.notify();
  }

  // -------------------------------------------------------------
  // VEHICLES & RFID CARDS CRUD
  // -------------------------------------------------------------
  addVehicle(veh: Omit<VehicleCard, 'id' | 'lastActiveAt' | 'activeTripId'>) {
    const newId = `veh-${Date.now()}`;
    const newVehicle: VehicleCard = {
      ...veh,
      id: newId,
      plateNumber: veh.plateNumber.trim().toUpperCase(),
      trailerPlate: veh.trailerPlate?.trim().toUpperCase(),
      cardNo: veh.cardNo.trim().toUpperCase(),
      lastActiveAt: new Date().toISOString(),
    };
    this.vehicles = [newVehicle, ...this.vehicles];
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    this.notify();
    return newVehicle;
  }

  updateVehicle(id: string, updates: Partial<VehicleCard>) {
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
  }

  deleteVehicle(id: string) {
    this.vehicles = this.vehicles.filter((v) => v.id !== id);
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    this.notify();
  }

  updateVehicleStatus(id: string, status: VehicleStatus) {
    this.vehicles = this.vehicles.map((v) => (v.id === id ? { ...v, status } : v));
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    this.notify();
  }

  findVehicleByCardOrPlate(identifier: string): VehicleCard | undefined {
    const clean = identifier.trim().toUpperCase();
    return this.vehicles.find(
      (v) => v.cardNo.toUpperCase() === clean || v.plateNumber.toUpperCase() === clean
    );
  }

  // -------------------------------------------------------------
  // DISPATCH ORDERS & MULTI-VEHICLE TRIPS
  // -------------------------------------------------------------
  createDispatchOrder(commandIds: string[], vehicleIds: string[], notes?: string) {
    if (commandIds.length === 0 || vehicleIds.length === 0) return null;

    // Calculate relation type dynamically
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

    // Create independent OrderTrip for each vehicle
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

    // Update vehicle statuses to In-Station & bind activeTripId
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

    // Update command status to 'Đang chạy' if pending
    const cmdIdSet = new Set(commandIds);
    this.commands = this.commands.map((c) => {
      if (cmdIdSet.has(c.id) && c.status === 'Chờ thực hiện') {
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

    return { order: newOrder, trips: newTrips };
  }

  // Operational requirement #1 & #2: Advance truck step independently & directional scale logic
  advanceTripStep(
    tripId: string, 
    targetStep?: GateStep,
    weights?: { firstWeight?: number; secondWeight?: number; netWeight?: number; operator?: string; notes?: string }
  ) {
    const trip = this.trips.find((t) => t.id === tripId);
    if (!trip) return;

    const order = this.orders.find((o) => o.id === trip.orderId);
    // Find primary command to know direction
    const primaryCommand = order?.commandIds.length
      ? this.commands.find((c) => c.id === order.commandIds[0])
      : undefined;
    const isOutbound = primaryCommand?.type === 'Xuất hàng';

    // Auto calculate next step if not explicitly specified
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

    // Handle weighing step captures
    if (weights?.firstWeight !== undefined) {
      updatedTrip.firstWeight = weights.firstWeight;
      updatedTrip.firstWeightTime = nowIso;
    }
    if (weights?.secondWeight !== undefined) {
      updatedTrip.secondWeight = weights.secondWeight;
      updatedTrip.secondWeightTime = nowIso;
    }

    // Calculate Net Weight
    if (weights?.netWeight !== undefined) {
      updatedTrip.netWeight = weights.netWeight;
    } else if (updatedTrip.firstWeight !== undefined && updatedTrip.secondWeight !== undefined) {
      // Inbound: Gross - Tare. Outbound: Gross - Tare. Absolute difference handles both cleanly.
      updatedTrip.netWeight = Math.abs(Number((updatedTrip.firstWeight - updatedTrip.secondWeight).toFixed(2)));
    }

    if (nextStep === 'COMPLETED') {
      updatedTrip.completedTime = nowIso;

      // Release vehicle back to Idle
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

      // Accumulate completed weight to the order's primary command
      if (updatedTrip.netWeight && primaryCommand) {
        this.commands = this.commands.map((cmd) => {
          if (cmd.id === primaryCommand.id) {
            const newCompleted = Number(((cmd.completedWeight || 0) + (updatedTrip.netWeight || 0)).toFixed(2));
            const newStatus = newCompleted >= cmd.targetWeight ? 'Hoàn thành' : cmd.status;
            return {
              ...cmd,
              completedWeight: newCompleted,
              status: newStatus,
            };
          }
          return cmd;
        });
      }
    }

    this.trips = this.trips.map((t) => (t.id === tripId ? updatedTrip : t));

    // Check if all trips for the order are completed
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

  // Detach a single vehicle from an order
  detachVehicleFromOrder(tripId: string) {
    const trip = this.trips.find((t) => t.id === tripId);
    if (!trip) return;

    // Release vehicle
    this.vehicles = this.vehicles.map((v) =>
      v.id === trip.vehicleId ? { ...v, status: 'Rảnh (Idle)', activeTripId: undefined } : v
    );

    // Remove trip
    this.trips = this.trips.filter((t) => t.id !== tripId);

    // Update order's vehicleIds
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
  }

  // Attach an additional vehicle into an existing order (Dynamic 1-N / N-N expansion)
  attachVehicleToOrder(orderId: string, vehicleId: string) {
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

    saveStorage(STORAGE_KEYS.TRIPS, this.trips);
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    saveStorage(STORAGE_KEYS.ORDERS, this.orders);
    this.notify();
  }

  // Complete entire order immediately
  completeOrder(orderId: string) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return;

    const nowIso = new Date().toISOString();
    const orderTrips = this.trips.filter((t) => t.orderId === orderId);
    const tripVehicleIds = new Set(orderTrips.map((t) => t.vehicleId));

    // Mark all trips completed
    this.trips = this.trips.map((t) =>
      t.orderId === orderId ? { ...t, step: 'COMPLETED', completedTime: nowIso } : t
    );

    // Release all vehicles
    this.vehicles = this.vehicles.map((v) =>
      tripVehicleIds.has(v.id) ? { ...v, status: 'Rảnh (Idle)', activeTripId: undefined } : v
    );

    // Mark order completed
    this.orders = this.orders.map((o) =>
      o.id === orderId ? { ...o, status: 'COMPLETED', completedAt: nowIso } : o
    );

    saveStorage(STORAGE_KEYS.TRIPS, this.trips);
    saveStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    saveStorage(STORAGE_KEYS.ORDERS, this.orders);
    this.notify();
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

// React hook for consuming the store
export function useStore() {
  const [state, setState] = useState(dispatchStore.getState());

  useEffect(() => {
    return dispatchStore.subscribe(() => {
      setState(dispatchStore.getState());
    });
  }, []);

  return {
    ...state,
    setActiveTab: (tab: 'COMMANDS' | 'VEHICLES' | 'DISPATCH') => dispatchStore.setActiveTab(tab),
    setSearchQuery: (q: string) => dispatchStore.setSearchQuery(q),
    toggleDarkMode: () => dispatchStore.toggleDarkMode(),
    resetAllData: () => dispatchStore.resetAllData(),
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
