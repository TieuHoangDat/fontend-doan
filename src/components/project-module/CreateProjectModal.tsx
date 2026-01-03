'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Spin, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { projectService } from '@/lib/api/services/project-module/project.service';
import { employeeService } from '@/lib/api/services/project-module/employee.service';

const { TextArea } = Input;
const { Option } = Select;

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SchemeOption {
  id: number;
  scheme_name: string;
  scheme_description?: string;
  is_default?: boolean;
}

interface Schemes {
  permissionSchemes: SchemeOption[];
  notificationSchemes: SchemeOption[];
  workflowSchemes: SchemeOption[];
}

interface Employee {
  id: number;
  full_name: string;
  email: string;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [schemesLoading, setSchemesLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [schemes, setSchemes] = useState<Schemes>({
    permissionSchemes: [],
    notificationSchemes: [],
    workflowSchemes: [],
  });
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  const loadInitialData = async () => {
    try {
      setSchemesLoading(true);
      setEmployeesLoading(true);

      const [schemesData, employeesData] = await Promise.all([
        projectService.getAllSchemes(),
        employeeService.getAllEmployees(),
      ]);

      setSchemes(schemesData);
      setEmployees(employeesData);

      if (schemesData.permissionSchemes.length > 0) {
        const defaultPermission = schemesData.permissionSchemes.find(s => s.is_default) 
          || schemesData.permissionSchemes[0];
        form.setFieldValue('permission_scheme_id', defaultPermission.id);
      }
      
      if (schemesData.notificationSchemes.length > 0) {
        form.setFieldValue('notification_scheme_id', schemesData.notificationSchemes[0].id);
      }
      
      if (schemesData.workflowSchemes.length > 0) {
        form.setFieldValue('workflow_scheme_id', schemesData.workflowSchemes[0].id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      message.error(t('project.messages.loadDataFailed'));
    } finally {
      setSchemesLoading(false);
      setEmployeesLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const response = await projectService.create({
        project_key: values.project_key.toUpperCase(),
        project_name: values.project_name,
        project_description: values.project_description || null,
        lead_employee_id: values.lead_employee_id,
        permission_scheme_id: values.permission_scheme_id,
        notification_scheme_id: values.notification_scheme_id,
        workflow_scheme_id: values.workflow_scheme_id,
      });

      message.success(
        <div>
          <div>{t('project.info.successMessage', { projectKey: response.project_key })}</div>
          {response.creator_assignment && (
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {t('project.info.roleAssigned', { role: response.creator_assignment.role })}
            </div>
          )}
        </div>
      );

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating project:', error);
      
      if (error.response?.status === 409) {
        message.error(t('project.messages.keyExists'));
      } else {
        message.error(error.response?.data?.message || t('project.messages.genericError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const isFormLoading = schemesLoading || employeesLoading;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📁</span>
          <span>{t('project.createProject')}</span>
        </div>
      }
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      okText={t('project.buttons.create')}
      cancelText={t('project.buttons.cancel')}
      confirmLoading={loading}
      width={600}
      maskClosable={false}
    >
      {isFormLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#999' }}>{t('project.loadingData')}</div>
        </div>
      ) : (
        <>
          <Alert
            message={t('project.info.note')}
            description={t('project.info.createNote')}
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            {/* Project Key */}
            <Form.Item
              name="project_key"
              label={t('project.form.projectKey')}
              rules={[
                { required: true, message: t('project.form.projectKeyRequired') },
                { min: 2, message: t('project.form.projectKeyMin') },
                { max: 10, message: t('project.form.projectKeyMax') },
                { 
                  pattern: /^[A-Z0-9]+$/, 
                  message: t('project.form.projectKeyPattern')
                },
              ]}
              tooltip={t('project.form.projectKeyTooltip')}
            >
              <Input
                placeholder={t('project.form.projectKeyPlaceholder')}
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
                onChange={(e) => {
                  form.setFieldValue('project_key', e.target.value.toUpperCase());
                }}
              />
            </Form.Item>

            {/* Project Name */}
            <Form.Item
              name="project_name"
              label={t('project.form.projectName')}
              rules={[
                { required: true, message: t('project.form.projectNameRequired') },
                { max: 255, message: t('project.form.projectNameMax') },
              ]}
            >
              <Input placeholder={t('project.form.projectNamePlaceholder')} maxLength={255} />
            </Form.Item>

            {/* Project Description */}
            <Form.Item
              name="project_description"
              label={t('project.form.description')}
            >
              <TextArea
                rows={3}
                placeholder={t('project.form.descriptionPlaceholder')}
                maxLength={1000}
                showCount
              />
            </Form.Item>

            {/* Lead Employee */}
            <Form.Item
              name="lead_employee_id"
              label={t('project.form.lead')}
              rules={[{ required: true, message: t('project.form.leadRequired') }]}
              tooltip={t('project.form.leadTooltip')}
            >
              <Select
                showSearch
                placeholder={t('project.form.leadPlaceholder')}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={Array.isArray(employees) ? employees.map(emp => ({
                  value: emp.id,
                  label: `${emp.full_name} (${emp.email})`,
                })) : []}
                loading={employeesLoading}
              />
            </Form.Item>

            {/* Divider */}
            <div style={{ 
              margin: '24px 0', 
              padding: '12px', 
              background: '#f5f5f5', 
              borderRadius: 6 
            }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{t('project.schemes.title')}</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {t('project.schemes.description')}
              </div>
            </div>

            {/* Permission Scheme */}
            <Form.Item
              name="permission_scheme_id"
              label={t('project.form.permissionScheme')}
              rules={[{ required: true, message: t('project.form.permissionSchemeRequired') }]}
              tooltip={t('project.form.permissionSchemeTooltip')}
            >
              <Select
                placeholder={t('project.form.permissionSchemePlaceholder')}
                loading={schemesLoading}
                optionLabelProp="label"
              >
                {schemes.permissionSchemes.map(scheme => (
                  <Option
                    key={scheme.id}
                    value={scheme.id}
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {scheme.scheme_name}
                        {scheme.is_default && (
                          <span style={{ 
                            fontSize: 10, 
                            padding: '2px 6px', 
                            background: '#1890ff', 
                            color: 'white', 
                            borderRadius: 4 
                          }}>
                            {t('project.schemes.default')}
                          </span>
                        )}
                      </div>
                    }
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {scheme.scheme_name}
                        {scheme.is_default && (
                          <span style={{ 
                            marginLeft: 8,
                            fontSize: 10, 
                            padding: '2px 6px', 
                            background: '#1890ff', 
                            color: 'white', 
                            borderRadius: 4 
                          }}>
                            {t('project.schemes.default')}
                          </span>
                        )}
                      </div>
                      {scheme.scheme_description && (
                        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                          {scheme.scheme_description}
                        </div>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Notification Scheme */}
            <Form.Item
              name="notification_scheme_id"
              label={t('project.form.notificationScheme')}
              rules={[{ required: true, message: t('project.form.notificationSchemeRequired') }]}
              tooltip={t('project.form.notificationSchemeTooltip')}
            >
              <Select
                placeholder={t('project.form.notificationSchemePlaceholder')}
                loading={schemesLoading}
                optionLabelProp="label"
              >
                {schemes.notificationSchemes.map(scheme => (
                  <Option
                    key={scheme.id}
                    value={scheme.id}
                    label={scheme.scheme_name}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{scheme.scheme_name}</div>
                      {scheme.scheme_description && (
                        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                          {scheme.scheme_description}
                        </div>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Workflow Scheme */}
            <Form.Item
              name="workflow_scheme_id"
              label={t('project.form.workflowScheme')}
              rules={[{ required: true, message: t('project.form.workflowSchemeRequired') }]}
              tooltip={t('project.form.workflowSchemeTooltip')}
            >
              <Select
                placeholder={t('project.form.workflowSchemePlaceholder')}
                loading={schemesLoading}
                optionLabelProp="label"
              >
                {schemes.workflowSchemes.map(scheme => (
                  <Option
                    key={scheme.id}
                    value={scheme.id}
                    label={scheme.scheme_name}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{scheme.scheme_name}</div>
                      {scheme.scheme_description && (
                        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                          {scheme.scheme_description}
                        </div>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};