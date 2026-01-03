'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Select, Switch, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { workflowStatusService } from '@/lib/api/services/project-module/workflow-status.service';

interface CreateWorkflowStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workflowId: number;
  projectId: number;
}

const STATUS_CATEGORIES = [
  { value: 'to_do', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export const CreateWorkflowStatusModal: React.FC<CreateWorkflowStatusModalProps> = ({
  visible,
  onClose,
  onSuccess,
  workflowId,
  projectId,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const data = {
        workflow_id: workflowId,
        status_name: values.status_name,
        status_category: values.status_category,
        is_initial_status: values.is_initial_status || false,
      };

      await workflowStatusService.create(data, projectId);
      
      message.success(t('workflowStatus.messages.createSuccess'));
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating workflow status:', error);
      message.error(
        error.response?.data?.message || 
        t('workflowStatus.messages.createFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={t('workflowStatus.createStatus')}
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={t('common.create')}
      cancelText={t('common.cancel')}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="status_name"
          label={t('workflowStatus.form.statusName')}
          rules={[
            { required: true, message: t('workflowStatus.form.statusNameRequired') },
            { max: 100, message: t('workflowStatus.form.statusNameMax') },
          ]}
        >
          <Input 
            placeholder={t('workflowStatus.form.statusNamePlaceholder')} 
          />
        </Form.Item>

        <Form.Item
          name="status_category"
          label={t('workflowStatus.form.statusCategory')}
          rules={[
            { required: true, message: t('workflowStatus.form.statusCategoryRequired') },
          ]}
        >
          <Select
            placeholder={t('workflowStatus.form.statusCategoryPlaceholder')}
            options={STATUS_CATEGORIES}
          />
        </Form.Item>

        <Form.Item
          name="is_initial_status"
          label={t('workflowStatus.form.isInitialStatus')}
          valuePropName="checked"
          tooltip={t('workflowStatus.form.isInitialStatusTooltip')}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};