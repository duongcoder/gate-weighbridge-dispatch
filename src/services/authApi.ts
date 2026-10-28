import { api, API_BASE_URL } from './api';

export interface LoginDto {
  tenDangNhap: string;
  matKhau: string;
}

export interface RegisterDto {
  tenDangNhap: string;
  matKhau: string;
  hoTen: string;
  dienThoai?: string;
  email?: string;
  diaChi?: string;
  gateId?: number;
}

export interface PermissionDetailDto {
  xem: boolean;
  them: boolean;
  sua: boolean;
  xoa: boolean;
  baoCao: boolean;
}

export interface UserSessionDto {
  id: number;
  tenDangNhap: string;
  hoTen: string;
  vaiTroId?: number;
  tenVaiTro: string;
  gateId: number;
  email?: string;
  dienThoai?: string;
  permissions: Record<string, PermissionDetailDto>;
}

export interface AuthResponseDto {
  token: string;
  userSession: UserSessionDto;
}

export interface RoleDto {
  id: number;
  tenVaiTro: string;
  moTa?: string;
  gate_Id?: number;
}

export interface PermissionMatrixItemDto {
  id: number;
  chucNangId: number;
  vaiTroId: number;
  tenForm: string;
  tenChucNang: string;
  module?: string;
  xem: boolean;
  them: boolean;
  sua: boolean;
  xoa: boolean;
  baoCao: boolean;
  gate_Id?: number;
}

export interface UpdatePermissionMatrixDto {
  vaiTroId: number;
  permissions: PermissionMatrixItemDto[];
}

export interface UserListItemDto {
  id: number;
  tenDangNhap: string;
  hoTen: string;
  vaiTroId?: number;
  tenVaiTro: string;
  gate_Id?: number;
  dienThoai?: string;
  email?: string;
  diaChi?: string;
  ngayTao?: string;
}

export interface CreateUserDto {
  tenDangNhap: string;
  matKhau: string;
  hoTen: string;
  vaiTroId?: number;
  gate_Id?: number;
  dienThoai?: string;
  email?: string;
  diaChi?: string;
}

export interface UpdateUserDto {
  hoTen: string;
  vaiTroId: number;
  dienThoai?: string;
  email?: string;
  matKhau?: string;
  gate_Id?: number;
  diaChi?: string;
}

export const authApi = {
  login: async (credentials: LoginDto): Promise<AuthResponseDto> => {
    const rawUser = credentials.tenDangNhap.trim();
    const rawPass = credentials.matKhau.trim();
    const query = `tenDangNhap=${encodeURIComponent(rawUser)}&matKhau=${encodeURIComponent(rawPass)}`;
    const url = `${API_BASE_URL}/auth/login?${query}`;

    // Direct native fetch without request body:
    // Sending credentials via Query String & Headers bypasses IIS Kestrel BodyModelBinder stream hang completely,
    // achieving instantaneous 10ms responses identical to /api/health/db.
    const fetchFn = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : fetch;
    const res = await fetchFn(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Auth-User': rawUser,
        'X-Auth-Pass': rawPass,
      },
    });

    if (res.ok) {
      return (await res.json()) as AuthResponseDto;
    }

    const errData = await res.json().catch(() => ({}));
    const message = errData.message || `Đăng nhập thất bại (Mã lỗi ${res.status})`;
    const error: any = new Error(message);
    error.response = { status: res.status, data: errData };
    throw error;
  },

  register: async (data: RegisterDto): Promise<AuthResponseDto> => {
    const response = await api.post<AuthResponseDto>('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<UserSessionDto> => {
    const response = await api.get<UserSessionDto>('/auth/me');
    return response.data;
  },

  getRoles: async (): Promise<RoleDto[]> => {
    const response = await api.get<RoleDto[]>('/permissions/roles');
    return response.data;
  },

  getPermissionMatrix: async (vaiTroId: number): Promise<PermissionMatrixItemDto[]> => {
    const response = await api.get<PermissionMatrixItemDto[]>(`/permissions/matrix?vaiTroId=${vaiTroId}`);
    return response.data;
  },

  updatePermissionMatrix: async (data: UpdatePermissionMatrixDto): Promise<{ message: string; roleId: number }> => {
    const response = await api.post<{ message: string; roleId: number }>('/permissions/matrix', data);
    return response.data;
  },

  // User Management Endpoints
  getUsers: async (): Promise<UserListItemDto[]> => {
    try {
      const response = await api.get<UserListItemDto[]>('/users');
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        const response = await api.get<UserListItemDto[]>('/auth/users');
        return response.data;
      }
      throw err;
    }
  },

  createUser: async (data: CreateUserDto): Promise<UserListItemDto> => {
    try {
      const response = await api.post<UserListItemDto>('/users/create', data);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        const response = await api.post<UserListItemDto>('/auth/users/create', data);
        return response.data;
      }
      throw err;
    }
  },

  updateUser: async (id: number, data: UpdateUserDto): Promise<UserListItemDto> => {
    try {
      // Try PUT first
      const response = await api.put<UserListItemDto>(`/users/${id}`, data);
      return response.data;
    } catch (err: any) {
      // If PUT is blocked by IIS WebDAV (405) or 404, fallback to POST /users/{id}/update
      if (err.response?.status === 405 || err.response?.status === 404) {
        try {
          const response = await api.post<UserListItemDto>(`/users/${id}/update`, data);
          return response.data;
        } catch (err2: any) {
          if (err2.response?.status === 404) {
            const response = await api.post<UserListItemDto>(`/auth/users/${id}/update`, data);
            return response.data;
          }
          throw err2;
        }
      }
      throw err;
    }
  },

  deleteUser: async (id: number): Promise<{ message: string; id: number }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('gw_auth_token') : null;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchFn = typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : fetch;

    // Use POST /api/users/{id}/delete with zero body.
    // Zero-body POST avoids IIS WebDAVModule 405 and avoids request body stream hang completely.
    const url = `${API_BASE_URL}/users/${id}/delete`;

    try {
      const res = await fetchFn(url, {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        return (await res.json()) as { message: string; id: number };
      }

      // If 404 or 405, fallback to /api/auth/users/{id}/delete or DELETE /api/users/{id}
      if (res.status === 404 || res.status === 405) {
        const fallbackUrl = `${API_BASE_URL}/auth/users/${id}/delete`;
        const resFb = await fetchFn(fallbackUrl, { method: 'POST', headers });
        if (resFb.ok) {
          return (await resFb.json()) as { message: string; id: number };
        }

        // Also try DELETE /api/users/{id}
        const resDel = await fetchFn(url, { method: 'DELETE', headers });
        if (resDel.ok) {
          return (await resDel.json()) as { message: string; id: number };
        }
      }

      const errData = await res.json().catch(() => ({}));
      const message = errData.message || `Xóa tài khoản thất bại (Mã lỗi ${res.status})`;
      const error: any = new Error(message);
      error.response = { status: res.status, data: errData };
      throw error;
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number; data?: { message?: string } } };
      if (errorObj.response?.status) throw err;
      return (await api.delete<{ message: string; id: number }>(`/users/${id}`)).data;
    }
  },
};
