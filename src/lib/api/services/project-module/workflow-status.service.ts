import api from '../../axios';

export interface CreateWorkflowStatusDto {
  workflow_id: number;
  status_name: string;
  status_category?: string;
  is_initial_status?: boolean;
  order_index?: number;
}

export interface UpdateWorkflowStatusDto {
  status_name?: string;
  status_category?: string;
  is_initial_status?: boolean;
  order_index?: number;
}

export interface WorkflowStatus {
  id: number;
  workflow_id: number;
  order_index: number;
  status_name: string;
  status_category: string | null;
  is_initial_status: boolean;
}

export const workflowStatusService = {
  /**
   * Tạo status mới cho workflow
   */
  create: async (data: CreateWorkflowStatusDto, projectId: number): Promise<WorkflowStatus> => {
    const response = await api.post<WorkflowStatus>(
      `/workflow-statuses?projectId=${projectId}`,
      data
    );
    return response.data;
  },

  /**
   * Lấy tất cả statuses của một workflow
   */
  getByWorkflow: async (workflowId: number, projectId: number): Promise<WorkflowStatus[]> => {
    const response = await api.get<WorkflowStatus[]>(
      `/workflow-statuses?workflowId=${workflowId}&projectId=${projectId}`
    );
    return response.data;
  },

  /**
   * Lấy chi tiết một status
   */
  getById: async (id: number, projectId: number): Promise<WorkflowStatus> => {
    const response = await api.get<WorkflowStatus>(
      `/workflow-statuses/${id}?projectId=${projectId}`
    );
    return response.data;
  },

  /**
   * Cập nhật status
   */
  update: async (
    id: number,
    data: UpdateWorkflowStatusDto,
    projectId: number
  ): Promise<WorkflowStatus> => {
    const response = await api.patch<WorkflowStatus>(
      `/workflow-statuses/${id}?projectId=${projectId}`,
      data
    );
    return response.data;
  },

  /**
   * Xóa status
   */
  delete: async (id: number, projectId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `/workflow-statuses/${id}?projectId=${projectId}`
    );
    return response.data;
  },

  /**
   * Reorder statuses
   */
  reorder: async (
    workflowId: number,
    orderedStatusIds: number[],
    projectId: number
  ): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>(
      `/workflow-statuses/reorder?workflowId=${workflowId}&projectId=${projectId}`,
      { orderedStatusIds }
    );
    return response.data;
  },

  /**
   * Lấy thống kê
   */
  getStatistics: async (workflowId: number, projectId: number): Promise<any[]> => {
    const response = await api.get<any[]>(
      `/workflow-statuses/statistics?workflowId=${workflowId}&projectId=${projectId}`
    );
    return response.data;
  },
};