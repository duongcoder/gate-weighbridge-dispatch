import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/dispatchStore';
import { useAuthStore } from '../../store/authStore';
import { 
  Truck, 
  FileText, 
  CreditCard, 
  Share2, 
  Search, 
  Sun, 
  Moon, 
  Clock, 
  Zap, 
  RotateCcw,
  ScanLine,
  ChevronDown,
  Check,
  ShieldCheck,
  LogIn,
  LogOut,
  Database,
  Radio,
  Settings
} from 'lucide-react';
import { Authorize } from '../common/Authorize';

interface TopbarProps {
  onOpenQuickCheckin: () => void;
  onOpenRfidSimulator: () => void;
  onOpenPermissionMatrix: () => void;
  onOpenLogin: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenQuickCheckin,
  onOpenRfidSimulator,
  onOpenPermissionMatrix,
  onOpenLogin,
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    searchQuery, 
    setSearchQuery, 
    darkMode, 
    toggleDarkMode, 
    resetAllData,
    commands,
    vehicles,
    trips
  } = useStore();

  const { 
    currentUser, 
    currentRole, 
    users, 
    roles, 
    permissions,
    setCurrentUser, 
    hasPermission,
    authMode,
    isAuthenticated,
    logout
  } = useAuthStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time digital clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeTripsCount = trips.filter(t => t.step !== 'COMPLETED').length;

  // Tab permissions
  const canViewCommands = hasPermission('Frm_Command', 'xem');
  const canViewVehicles = hasPermission('Frm_CardVehicle', 'xem');
  const canViewDispatch = hasPermission('Frm_DispatchOrder', 'xem');
  const canManagePermissions = hasPermission('Frm_UserPermission', 'xem') || currentUser.VaiTroId === 'ROLE_ADMIN';

  // Handle switching user with active tab auto-fallback
  const handleSwitchUser = (userId: string) => {
    setCurrentUser(userId);
    setUserDropdownOpen(false);

    const targetUser = users.find(u => u.Id === userId);
    if (targetUser) {
      const canCmd = permissions.some(p => p.VaiTroId === targetUser.VaiTroId && p.MaChucNang === 'Frm_Command' && p.Xem);
      const canVeh = permissions.some(p => p.VaiTroId === targetUser.VaiTroId && p.MaChucNang === 'Frm_CardVehicle' && p.Xem);
      const canDsp = permissions.some(p => p.VaiTroId === targetUser.VaiTroId && p.MaChucNang === 'Frm_DispatchOrder' && p.Xem);

      const validTabs: ('COMMANDS' | 'VEHICLES' | 'DISPATCH')[] = [];
      if (canCmd) validTabs.push('COMMANDS');
      if (canVeh) validTabs.push('VEHICLES');
      if (canDsp) validTabs.push('DISPATCH');

      if (validTabs.length > 0 && !validTabs.includes(activeTab)) {
        setActiveTab(validTabs[0]);
      }
    }
  };

  const roleBadgeColors: Record<string, string> = {
    ROLE_ADMIN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    ROLE_SCALE: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    ROLE_GUARD: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800',
    ROLE_DISPATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-industrial-900/95 backdrop-blur border-b border-slate-200 dark:border-industrial-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Station Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-400/30 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-industrial-900 dark:text-white uppercase">
                  TRẠM CÂN & KIỂM SOÁT CỔNG
                </h1>
                
                {/* Database Connection Status Badge */}
                {authMode === 'LIVE' && isAuthenticated ? (
                  <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <Database className="w-3 h-3 text-emerald-500" />
                    <span>SQL Server Live</span>
                  </span>
                ) : (
                  <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <Radio className="w-3 h-3 text-amber-500 animate-pulse" />
                    <span>Offline Demo</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-industrial-400 hidden sm:block">
                Hệ thống điều phối xe & tự động hóa trạm cân công nghiệp
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time Clock */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-100 dark:bg-industrial-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-industrial-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* User Profile Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-industrial-800 dark:hover:bg-industrial-700 border border-slate-200 dark:border-industrial-700 transition"
                title="Tài khoản đang đăng nhập / Chuyển đổi vai trò & menu quản trị"
              >
                <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs ring-1 ring-amber-500/30">
                  {currentUser.Avatar || currentUser.HoTen.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight flex items-center gap-1.5">
                    <span>{currentUser.HoTen}</span>
                    {authMode === 'LIVE' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã kết nối SQL Server qua JWT" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${roleBadgeColors[currentUser.VaiTroId] || 'bg-slate-100 text-slate-700'}`}>
                      {currentRole?.TenVaiTro}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu (Tối ưu gọn gàng, chứa Ma trận Phân quyền & Đăng xuất viền đỏ) */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-industrial-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-industrial-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* Status header */}
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-industrial-800 flex items-center justify-between">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>{authMode === 'LIVE' ? 'Tài Khoản SQL Server' : 'Chuyển Đổi Demo'}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${authMode === 'LIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                      {authMode === 'LIVE' ? 'LIVE DB' : 'OFFLINE'}
                    </span>
                  </div>

                  {/* Quick role switches (demo) */}
                  <div className="py-1">
                    <div className="px-3.5 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                      4 Vai Trò Tiêu Chuẩn:
                    </div>
                    {users.map((user) => {
                      const isCurrent = user.Id === currentUser.Id;
                      const r = roles.find((rl) => rl.Id === user.VaiTroId);
                      return (
                        <button
                          key={user.Id}
                          type="button"
                          onClick={() => handleSwitchUser(user.Id)}
                          className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-industrial-800 transition ${
                            isCurrent && authMode === 'DEMO' ? 'bg-amber-50/60 dark:bg-amber-950/30' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                              isCurrent && authMode === 'DEMO'
                                ? 'bg-amber-500 text-white shadow-sm' 
                                : 'bg-slate-200 dark:bg-industrial-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {user.Avatar || user.HoTen.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {user.HoTen}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {r?.TenVaiTro} ({user.TenDangNhap})
                              </div>
                            </div>
                          </div>
                          {isCurrent && authMode === 'DEMO' && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* System & Tools Section inside User Dropdown */}
                  <div className="px-2 pt-2 pb-1 border-t border-slate-100 dark:border-industrial-800 space-y-1">
                    {/* ⚙ Ma Trận Phân Quyền (Chỉ render nếu user có quyền Admin) */}
                    {canManagePermissions && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenPermissionMatrix();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>⚙ Ma Trận Phân Quyền (RBAC)</span>
                      </button>
                    )}

                    {/* Quét Thẻ RFID (F2) shortcut option inside dropdown */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenRfidSimulator();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-industrial-800 transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <ScanLine className="w-4 h-4 text-amber-500" />
                        <span>Quét Thẻ RFID</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-industrial-700 text-slate-600 dark:text-slate-400">
                        F2
                      </span>
                    </button>
                  </div>

                  {/* Bottom Action: Đăng Xuất Viền Đỏ ở dưới đáy dropdown */}
                  <div className="px-2 pt-2 pb-1.5 border-t border-slate-100 dark:border-industrial-800">
                    {isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-rose-400 dark:border-rose-700 bg-rose-50/80 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Đăng Xuất</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenLogin();
                        }}
                        className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Đăng Nhập SQL Server</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RFID Scanner button (Ẩn trên màn hình nhỏ/vừa, chỉ hiện trên màn hình rất lớn xl+) */}
            <Authorize form="Frm_QuickCheckin" action="them" fallback={null}>
              <button
                type="button"
                onClick={onOpenRfidSimulator}
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-industrial-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-industrial-700 border border-slate-200 dark:border-industrial-700 transition shadow-sm"
                title="Mô phỏng quét thẻ RFID / Barcode (Phím tắt F2)"
              >
                <ScanLine className="w-4 h-4 text-amber-500" />
                <span>Quét RFID (F2)</span>
              </button>
            </Authorize>

            {/* Quick Check-in Button */}
            <Authorize form="Frm_QuickCheckin" action="them" fallback={null}>
              <button
                type="button"
                onClick={onOpenQuickCheckin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-md shadow-amber-600/20 active:scale-95 transition shrink-0"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Khai Báo Nhanh</span>
              </button>
            </Authorize>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-industrial-800 transition"
              title={darkMode ? 'Chuyển giao diện Sáng' : 'Chuyển giao diện Tối'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Reset mock data */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu? Các thay đổi thử nghiệm sẽ được làm mới.')) {
                  resetAllData();
                }
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-industrial-800 transition hidden sm:block"
              title="Khôi phục dữ liệu mẫu ban đầu"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Bar: Search + Main Navigation Tabs (Protected by RBAC) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-2.5 pt-1 gap-2.5">
          {/* Main 3 Tabs Switcher */}
          <nav className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-industrial-950 rounded-xl border border-slate-200 dark:border-industrial-800">
            {canViewCommands && (
              <button
                type="button"
                onClick={() => setActiveTab('COMMANDS')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'COMMANDS'
                    ? 'bg-white dark:bg-industrial-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-industrial-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>QUẢN LÝ LỆNH</span>
                <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-industrial-700 font-mono">
                  {commands.length}
                </span>
              </button>
            )}

            {canViewVehicles && (
              <button
                type="button"
                onClick={() => setActiveTab('VEHICLES')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'VEHICLES'
                    ? 'bg-white dark:bg-industrial-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-industrial-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>THẺ & XE</span>
                <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-industrial-700 font-mono">
                  {vehicles.length}
                </span>
              </button>
            )}

            {canViewDispatch && (
              <button
                type="button"
                onClick={() => setActiveTab('DISPATCH')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all relative ${
                  activeTab === 'DISPATCH'
                    ? 'bg-white dark:bg-industrial-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-industrial-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>ĐIỀU PHỐI GHÉP LỆNH</span>
                {activeTripsCount > 0 && (
                  <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-mono font-bold animate-pulse">
                    {activeTripsCount} Xe
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Quick Search Bar */}
          <div className="relative flex-1 sm:max-w-xs md:max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm biển số, mã thẻ RFID, số lệnh..."
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-industrial-950 border border-slate-200 dark:border-industrial-800 text-industrial-900 dark:text-industrial-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
