import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useStore } from './store/dispatchStore';
import { useAuthStore } from './store/authStore';
import { useRfidKeyboardWedge } from './hooks/useRfidKeyboardWedge';
import { Command, VehicleCard, OrderTrip } from './types';

// Layout & Navigation
import { Topbar } from './components/layout/Topbar';
import { ScaleIndicator } from './components/layout/ScaleIndicator';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

// Tab 1: Commands
import { CommandTable } from './components/commands/CommandTable';
import { CommandModal } from './components/commands/CommandModal';

// Tab 2: Vehicles & RFID
import { VehicleTable } from './components/vehicles/VehicleTable';
import { VehicleModal } from './components/vehicles/VehicleModal';
import { RfidScanModal } from './components/vehicles/RfidScanModal';

// Tab 3: Dispatch & Weighing Mapping
import { DispatchKanban } from './components/dispatch/DispatchKanban';
import { DispatchWizard } from './components/dispatch/DispatchWizard';
import { WeighingModal } from './components/dispatch/WeighingModal';
import { WeighingTicketModal } from './components/dispatch/WeighingTicketModal';
import { AttachVehicleModal } from './components/dispatch/AttachVehicleModal';

// Quick Check-in
import { QuickCheckinModal } from './components/quickCheckin/QuickCheckinModal';

// RBAC Permission Matrix Modal
import { PermissionMatrixModal } from './components/admin/PermissionMatrixModal';

// Real Database Auth Modals
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';

export function App() {
  const { 
    activeTab, 
    setActiveTab, 
    commands, 
    vehicles, 
    trips, 
    addCommand, 
    updateCommand, 
    addVehicle, 
    updateVehicle, 
    findVehicleByCardOrPlate 
  } = useStore();

  const { currentUser, hasPermission, initAuthFromToken } = useAuthStore();

  // Modal visibility states
  const [commandModalOpen, setCommandModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleCard | null>(null);

  const [rfidSimModalOpen, setRfidSimModalOpen] = useState(false);
  const [quickCheckinOpen, setQuickCheckinOpen] = useState(false);
  const [permissionMatrixOpen, setPermissionMatrixOpen] = useState(false);

  // Real Database Authentication Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const [dispatchWizardOpen, setDispatchWizardOpen] = useState(false);
  const [preselectedCmdId, setPreselectedCmdId] = useState<string | null>(null);
  const [preselectedVehId, setPreselectedVehId] = useState<string | null>(null);

  const [activeWeighingTrip, setActiveWeighingTrip] = useState<OrderTrip | null>(null);
  const [activeTicketTrip, setActiveTicketTrip] = useState<OrderTrip | null>(null);
  const [attachVehicleOrderId, setAttachVehicleOrderId] = useState<string | null>(null);

  // Global toast notification (Auto-dismiss 3s, Bottom-Right)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000); // Tự động biến mất sau đúng 3 giây
  };

  // -------------------------------------------------------------
  // OPERATIONAL REQUIREMENT: INITIALIZE AUTH FROM TOKEN ON STARTUP
  // -------------------------------------------------------------
  useEffect(() => {
    initAuthFromToken().then((restored) => {
      if (restored) {
        showToast('🔒 Đã khôi phục phiên đăng nhập SQL Server!');
      }
    });
  }, [initAuthFromToken]);

  // -------------------------------------------------------------
  // OPERATIONAL REQUIREMENT: ACTIVE TAB AUTO-FALLBACK ON USER SWITCH
  // -------------------------------------------------------------
  useEffect(() => {
    const validTabs: ('COMMANDS' | 'VEHICLES' | 'DISPATCH')[] = [];
    if (hasPermission('Frm_Command', 'xem')) validTabs.push('COMMANDS');
    if (hasPermission('Frm_CardVehicle', 'xem')) validTabs.push('VEHICLES');
    if (hasPermission('Frm_DispatchOrder', 'xem')) validTabs.push('DISPATCH');

    if (validTabs.length > 0 && !validTabs.includes(activeTab)) {
      setActiveTab(validTabs[0]);
    }
  }, [currentUser, activeTab, hasPermission, setActiveTab]);

  // -------------------------------------------------------------
  // OPERATIONAL REQUIREMENT #3: HARDWARE RFID KEYBOARD WEDGE HOOK
  // -------------------------------------------------------------
  useRfidKeyboardWedge({
    onScan: (code) => {
      const matched = findVehicleByCardOrPlate(code);
      if (matched) {
        showToast(`⚡ ĐÃ NHẬN DIỆN THẺ RFID: ${matched.cardNo} (Xe ${matched.plateNumber})`);
        if (matched.activeTripId) {
          const t = trips.find((item) => item.id === matched.activeTripId);
          if (t && (t.step === 'SCALE_1' || t.step === 'SCALE_2')) {
            setActiveWeighingTrip(t);
            return;
          }
        }
        if (hasPermission('Frm_CardVehicle', 'xem')) {
          setActiveTab('VEHICLES');
        }
      } else {
        const canCreate = hasPermission('Frm_CardVehicle', 'them') || hasPermission('Frm_QuickCheckin', 'them');
        if (canCreate) {
          showToast(`❓ THẺ LẠ: ${code} - Mở cửa sổ đăng ký xe mới...`);
          setVehicleModalOpen(true);
        } else {
          showToast(`❓ THẺ LẠ: ${code} - Chưa có hồ sơ trên hệ thống.`);
        }
      }
    },
  });

  // -------------------------------------------------------------
  // OPERATIONAL REQUIREMENT: KEYBOARD SHORTCUTS GUARD
  // F3: Only if hasPermission('Frm_DispatchOrder', 'them')
  // F2: Only if hasPermission('Frm_QuickCheckin', 'them') || hasPermission('Frm_CardVehicle', 'them')
  // -------------------------------------------------------------
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        const canScan = hasPermission('Frm_QuickCheckin', 'them') || hasPermission('Frm_CardVehicle', 'them');
        if (canScan) {
          setRfidSimModalOpen(true);
        } else {
          showToast('⛔ Bạn không có quyền quét thẻ RFID hoặc khai báo xe.');
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        const canDispatch = hasPermission('Frm_DispatchOrder', 'them');
        if (canDispatch) {
          setPreselectedCmdId(null);
          setPreselectedVehId(null);
          setDispatchWizardOpen(true);
        } else {
          showToast('⛔ Bạn không có quyền lập lệnh điều phối ghép xe.');
        }
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [hasPermission]);

  // Celebration animation when a trip completes
  const handleTripCompleted = (_tripId: string) => {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.6 },
    });
    showToast('🎉 Chuyến xe hoàn tất! Hàng ròng đã được cập nhật vào lệnh.');
  };

  // Handlers for cross-module actions
  const handleDispatchWithCommand = (cmdId: string) => {
    setPreselectedCmdId(cmdId);
    setPreselectedVehId(null);
    setDispatchWizardOpen(true);
  };

  const handleDispatchWithVehicle = (vehId: string) => {
    setPreselectedVehId(vehId);
    setPreselectedCmdId(null);
    setDispatchWizardOpen(true);
  };

  return (
    <div className="min-h-screen bg-industrial-50 dark:bg-industrial-950 text-industrial-900 dark:text-industrial-50 pb-20 sm:pb-12 transition-colors">
      {/* 1. Global Station Header & Tab Switcher */}
      <Topbar
        onOpenQuickCheckin={() => setQuickCheckinOpen(true)}
        onOpenRfidSimulator={() => setRfidSimModalOpen(true)}
        onOpenPermissionMatrix={() => setPermissionMatrixOpen(true)}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {/* 2. Live Weighbridge Digital Scale Indicator Bar */}
      <ScaleIndicator />

      {/* 3. Global Floating Toast Banner (Cố định ở Bottom-Right, auto-dismiss 3s, không che Topbar) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 dark:bg-industrial-800/95 text-white font-medium text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 dark:border-industrial-600 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 max-w-md">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="flex-1 leading-snug">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white transition p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. Main Body Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'COMMANDS' && hasPermission('Frm_Command', 'xem') && (
          <CommandTable
            onOpenCreateModal={() => {
              setEditingCommand(null);
              setCommandModalOpen(true);
            }}
            onEditCommand={(cmd) => {
              setEditingCommand(cmd);
              setCommandModalOpen(true);
            }}
            onDispatchWithCommand={handleDispatchWithCommand}
          />
        )}

        {activeTab === 'VEHICLES' && hasPermission('Frm_CardVehicle', 'xem') && (
          <VehicleTable
            onOpenCreateModal={() => {
              setEditingVehicle(null);
              setVehicleModalOpen(true);
            }}
            onEditVehicle={(veh) => {
              setEditingVehicle(veh);
              setVehicleModalOpen(true);
            }}
            onDispatchWithVehicle={handleDispatchWithVehicle}
            onOpenRfidSimulator={() => setRfidSimModalOpen(true)}
          />
        )}

        {activeTab === 'DISPATCH' && hasPermission('Frm_DispatchOrder', 'xem') && (
          <DispatchKanban
            onOpenWizard={() => {
              setPreselectedCmdId(null);
              setPreselectedVehId(null);
              setDispatchWizardOpen(true);
            }}
            onOpenWeighing={(trip) => setActiveWeighingTrip(trip)}
            onOpenTicket={(trip) => setActiveTicketTrip(trip)}
            onAttachVehicle={(orderId) => setAttachVehicleOrderId(orderId)}
          />
        )}
      </main>

      {/* 5. Mobile Bottom Navigation Dock */}
      <MobileBottomNav
        onOpenQuickCheckin={() => setQuickCheckinOpen(true)}
        onOpenRfidSimulator={() => setRfidSimModalOpen(true)}
      />

      {/* =========================================================================
          APPLICATION MODALS
          ========================================================================= */}
      
      {/* Real Database Authentication Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onOpenRegister={() => setRegisterModalOpen(true)}
        onLoginSuccess={() => showToast('🎉 Đăng nhập thành công với quyền hạn cơ sở dữ liệu!')}
      />

      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {/* Command Modal */}
      <CommandModal
        isOpen={commandModalOpen}
        onClose={() => {
          setCommandModalOpen(false);
          setEditingCommand(null);
        }}
        onSave={addCommand}
        onUpdate={updateCommand}
        initialData={editingCommand}
        existingCount={commands.length}
      />

      {/* Vehicle Modal */}
      <VehicleModal
        isOpen={vehicleModalOpen}
        onClose={() => {
          setVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
        onSave={addVehicle}
        onUpdate={updateVehicle}
        initialData={editingVehicle}
      />

      {/* RFID Simulator Modal */}
      <RfidScanModal
        isOpen={rfidSimModalOpen}
        onClose={() => setRfidSimModalOpen(false)}
        onSelectVehicleForAction={(veh) => {
          if (veh.status === 'Rảnh (Idle)') {
            handleDispatchWithVehicle(veh.id);
          } else if (veh.activeTripId) {
            const tr = trips.find((t) => t.id === veh.activeTripId);
            if (tr) setActiveWeighingTrip(tr);
          }
        }}
      />

      {/* Quick Check-in Modal */}
      <QuickCheckinModal
        isOpen={quickCheckinOpen}
        onClose={() => setQuickCheckinOpen(false)}
      />

      {/* 3-Step Dispatch Wizard (1-1, 1-N, N-1, N-N) */}
      <DispatchWizard
        isOpen={dispatchWizardOpen}
        onClose={() => {
          setDispatchWizardOpen(false);
          setPreselectedCmdId(null);
          setPreselectedVehId(null);
        }}
        preselectedCommandId={preselectedCmdId}
        preselectedVehicleId={preselectedVehId}
      />

      {/* Directional Weighbridge Scale Modal */}
      <WeighingModal
        isOpen={!!activeWeighingTrip}
        onClose={() => setActiveWeighingTrip(null)}
        trip={activeWeighingTrip}
        onTripCompleted={handleTripCompleted}
      />

      {/* Official Weighbridge Ticket & Gate Pass Modal (A5 & 80mm) */}
      <WeighingTicketModal
        isOpen={!!activeTicketTrip}
        onClose={() => setActiveTicketTrip(null)}
        trip={activeTicketTrip}
      />

      {/* Attach Vehicle to Existing Order Modal */}
      <AttachVehicleModal
        isOpen={!!attachVehicleOrderId}
        onClose={() => setAttachVehicleOrderId(null)}
        orderId={attachVehicleOrderId}
      />

      {/* Permission Matrix Admin Modal */}
      <PermissionMatrixModal
        isOpen={permissionMatrixOpen}
        onClose={() => setPermissionMatrixOpen(false)}
      />
    </div>
  );
}

export default App;
