import React from 'react';
import { useStore } from '../../store/dispatchStore';
import { useAuthStore } from '../../store/authStore';
import { FileText, Truck, Share2, Zap, BarChart3 } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenQuickCheckin: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenQuickCheckin,
}) => {
  const { activeTab, setActiveTab, trips } = useStore();
  const { hasPermission } = useAuthStore();
  const activeTripsCount = trips.filter(t => t.step !== 'COMPLETED').length;

  const canViewCommands = hasPermission('Frm_Command', 'xem');
  const canViewVehicles = hasPermission('Frm_CardVehicle', 'xem');
  const canViewDispatch = hasPermission('Frm_DispatchOrder', 'xem');
  const canViewReports = hasPermission('Frm_Reports', 'baoCao') || hasPermission('Frm_Reports', 'xem') || hasPermission('Frm_WeighingTicket', 'baoCao');
  const canAddCheckin = hasPermission('Frm_QuickCheckin', 'them');

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-industrial-900/95 backdrop-blur border-t border-slate-200 dark:border-industrial-800 pb-safe shadow-lg">
      <div className="flex items-center justify-around px-2 py-1">
        {/* Commands Tab */}
        {canViewCommands && (
          <button
            type="button"
            onClick={() => setActiveTab('COMMANDS')}
            className={`flex flex-col items-center justify-center py-2 px-2 text-[11px] font-medium transition ${
              activeTab === 'COMMANDS'
                ? 'text-amber-500 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span>Lệnh</span>
          </button>
        )}

        {/* Vehicles Tab */}
        {canViewVehicles && (
          <button
            type="button"
            onClick={() => setActiveTab('VEHICLES')}
            className={`flex flex-col items-center justify-center py-2 px-2 text-[11px] font-medium transition ${
              activeTab === 'VEHICLES'
                ? 'text-amber-500 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Truck className="w-5 h-5 mb-0.5" />
            <span>Phương Tiện</span>
          </button>
        )}

        {/* Center Floating Action Button (Quick Check-in) */}
        {canAddCheckin && (
          <div className="flex items-center justify-center -mt-6">
            <button
              type="button"
              onClick={onOpenQuickCheckin}
              className="w-13 h-13 p-3 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-white shadow-lg shadow-amber-500/40 border-4 border-white dark:border-industrial-900 active:scale-95 transition flex items-center justify-center"
              title="Khai Báo Nhanh / Quick Check-in"
            >
              <Zap className="w-6 h-6 fill-white" />
            </button>
          </div>
        )}

        {/* Dispatch Orders Tab */}
        {canViewDispatch && (
          <button
            type="button"
            onClick={() => setActiveTab('DISPATCH')}
            className={`flex flex-col items-center justify-center py-2 px-2 text-[11px] font-medium transition relative ${
              activeTab === 'DISPATCH'
                ? 'text-amber-500 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className="relative">
              <Share2 className="w-5 h-5 mb-0.5" />
              {activeTripsCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-full">
                  {activeTripsCount}
                </span>
              )}
            </div>
            <span>Ghép Lệnh</span>
          </button>
        )}

        {/* Reports Tab */}
        {canViewReports && (
          <button
            type="button"
            onClick={() => setActiveTab('REPORT')}
            className={`flex flex-col items-center justify-center py-2 px-2 text-[11px] font-medium transition ${
              activeTab === 'REPORT'
                ? 'text-amber-500 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span>Báo Cáo</span>
          </button>
        )}
      </div>
    </div>
  );
};
