import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { 
  Lock, 
  User, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  X,
  ShieldCheck
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { login } = useAuthStore();

  const [tenDangNhap, setTenDangNhap] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenDangNhap.trim() || !matKhau.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ Tên đăng nhập và Mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await login({
        tenDangNhap: tenDangNhap.trim(),
        matKhau: matKhau.trim(),
      });
      const displayName = res.userSession?.hoTen || res.userSession?.tenDangNhap || tenDangNhap;
      setSuccessMessage(`Đăng nhập thành công! Chào mừng ${displayName}`);
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess?.();
        onClose();
      }, 700);
    } catch (err: unknown) {
      setLoading(false);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errorObj.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc kết nối máy chủ SQL Server.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-industrial-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-industrial-700 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header: Gradient xanh công nghiệp slate-900 cao cấp */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight uppercase">ĐĂNG NHẬP HỆ THỐNG</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wider">
              Tên Đăng Nhập
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={tenDangNhap}
                onChange={(e) => setTenDangNhap(e.target.value)}
                placeholder="Nhập tên đăng nhập (ví dụ: admin)"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-industrial-950 border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 uppercase tracking-wider">
              Mật Khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-industrial-950 border border-slate-300 dark:border-industrial-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span>Ghi nhớ phiên đăng nhập (24 giờ)</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm shadow-md shadow-amber-600/20 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kết nối database...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
