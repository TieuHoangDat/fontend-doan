'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { workflowStatusService } from '@/lib/api/services/project-module/workflow-status.service';

interface EditWorkflowStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  statusId: number;
  projectId: number;
  initialValues?: {
    status_name: string;
    status_category?: string;
    is_initial_status?: boolean;
  };
}

const STATUS_CATEGORIES = [
  { value: 'to_do', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export const EditWorkflowStatusModal: React.FC<EditWorkflowStatusModalProps> = ({
  visible,
  onClose,
  onSuccess,
  statusId,
  projectId,
  initialValues,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [visible, initialValues, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const data = {
        status_name: values.status_name,
        status_category: values.status_category,
        is_initial_status: values.is_initial_status || false,
      };

      await workflowStatusService.update(statusId, data, projectId);
      
      message.success(t('workflowStatus.messages.updateSuccess'));
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating workflow status:', error);
      message.error(
        error.response?.data?.message || 
        t('workflowStatus.messages.updateFailed')
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
      title={t('workflowStatus.editStatus')}
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={t('common.update')}
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