import { useAuthStore } from '../store/authStore';
import { MaChucNang, PermissionAction } from '../types/auth';

export function usePermission(maChucNang: MaChucNang) {
  const { hasPermission, getPermission, currentUser, currentRole } = useAuthStore();

  const permissions = getPermission(maChucNang);

  return {
    canView: hasPermission(maChucNang, 'xem'),
    canAdd: hasPermission(maChucNang, 'them'),
    canEdit: hasPermission(maChucNang, 'sua'),
    canDelete: hasPermission(maChucNang, 'xoa'),
    canReport: hasPermission(maChucNang, 'baoCao'),
    permissions,
    currentUser,
    currentRole,
    checkPermission: (action: PermissionAction) => hasPermission(maChucNang, action),
  };
}
