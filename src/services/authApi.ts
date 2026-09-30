import { api } from './api';

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
    const response = await api.post<AuthResponseDto>('/auth/login', credentials);
    return response.data;
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
    const response = await api.get<UserListItemDto[]>('/users');
    return response.data;
  },

  createUser: async (data: CreateUserDto): Promise<UserListItemDto> => {
    const response = await api.post<UserListItemDto>('/users/create', data);
    return response.data;
  },

  updateUser: async (id: number, data: UpdateUserDto): Promise<UserListItemDto> => {
    const response = await api.put<UserListItemDto>(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number): Promise<{ message: string; id: number }> => {
    const response = await api.delete<{ message: string; id: number }>(`/users/${id}`);
    return response.data;
  },
};
