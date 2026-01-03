// src/lib/api/services/team.service.ts
import api from '../../axios';

export interface TeamMember {
  employee_id: number;
  employee: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    status: string;
    phone?: string | null;
    department?: string | null;
    position?: string | null;
  };
  project_role: {
    id: number;
    role_name: string;
    role_description: string;
  };
  assigned_by: {
    id: number;
    full_name: string;
  } | null;
  assigned_at: string;
}

export interface ProjectRole {
  id: number;
  role_name: string;
  role_description: string;
  is_default: boolean;
}

export interface Employee {
  id: number;
  username: string;
  email: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  status: string;
  department?: string | null;
  position?: string | null;
}

export interface AddMemberDto {
  employee_id: number;
  project_role_id: number;
}

export interface AddMultipleMembersDto {
  members: AddMemberDto[];
}

export interface AssignRoleDto {
  project_role_id: number;
}

export interface BulkAssignRoleDto {
  employee_ids: number[];
  project_role_id: number;
}

export interface TeamStatistics {
  project_id: number;
  project_name: string;
  total_members: number;
  members_by_role: Array<{
    role_name: string;
    count: number;
  }>;
  recent_additions: number;
}

/**
 * Team API Service
 * Quản lý thành viên trong project
 */
export const teamService = {
  /**
   * Lấy danh sách thành viên trong project
   */
  getMembers: async (projectId: number): Promise<TeamMember[]> => {
    const response = await api.get<TeamMember[]>(`/projects/${projectId}/team`);
    return response.data;
  },

  /**
   * Lấy chi tiết một thành viên
   */
  getMemberDetail: async (projectId: number, employeeId: number): Promise<TeamMember> => {
    const response = await api.get<TeamMember>(`/projects/${projectId}/team/${employeeId}`);
    return response.data;
  },

  /**
   * Thêm một thành viên vào project
   */
  addMember: async (projectId: number, data: AddMemberDto): Promise<any> => {
    const response = await api.post(`/projects/${projectId}/team`, data);
    return response.data;
  },

  /**
   * Thêm nhiều thành viên cùng lúc
   */
  addMultipleMembers: async (projectId: number, data: AddMultipleMembersDto): Promise<any> => {
    const response = await api.post(`/projects/${projectId}/team/bulk-add`, data);
    return response.data;
  },

  /**
   * Gán/thay đổi role cho thành viên
   */
  assignRole: async (projectId: number, employeeId: number, data: AssignRoleDto): Promise<any> => {
    const response = await api.patch(`/projects/${projectId}/team/${employeeId}/role`, data);
    return response.data;
  },

  /**
   * Gán role cho nhiều thành viên
   */
  bulkAssignRole: async (projectId: number, data: BulkAssignRoleDto): Promise<any> => {
    const response = await api.patch(`/projects/${projectId}/team/bulk-assign-role`, data);
    return response.data;
  },

  /**
   * Xóa một thành viên khỏi project
   */
  removeMember: async (projectId: number, employeeId: number): Promise<any> => {
    const response = await api.delete(`/projects/${projectId}/team/${employeeId}`);
    return response.data;
  },

  /**
   * Xóa nhiều thành viên
   */
  removeMultipleMembers: async (projectId: number, employeeIds: number[]): Promise<any> => {
    const response = await api.delete(`/projects/${projectId}/team/bulk-remove/execute`, {
      data: { employee_ids: employeeIds },
    });
    return response.data;
  },

  /**
   * Lấy danh sách roles có sẵn
   */
  getAvailableRoles: async (projectId: number): Promise<ProjectRole[]> => {
    const response = await api.get<ProjectRole[]>(`/projects/${projectId}/roles`);
    return response.data;
  },

  /**
   * Lấy danh sách employees chưa là thành viên
   */
  getNonMembers: async (projectId: number): Promise<Employee[]> => {
    const response = await api.get<Employee[]>(`/projects/${projectId}/team/non-members/list`);
    return response.data;
  },

  /**
   * Lấy thống kê team
   */
  getStatistics: async (projectId: number): Promise<TeamStatistics> => {
    const response = await api.get<TeamStatistics>(`/projects/${projectId}/team/statistics/overview`);
    return response.data;
  },
};