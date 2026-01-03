'use client';

import React, { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { CreateRoleDto, UpdateRoleDto } from '@/lib/api/services/project-module/project-role.service';
import { ProjectRole } from '@/lib/api/services/project-module/project-role.service';

interface RoleModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    projectId: number;
    role?: ProjectRole | null;
    onSubmit: (data: CreateRoleDto | UpdateRoleDto) => Promise<void>;
}

export const RoleModal: React.FC<RoleModalProps> = ({
    visible,
    onCancel,
    onSuccess,
    role,
    onSubmit,
}) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);

    useEffect(() => {
        if (visible) {
            if (role) {
                // Edit mode
                form.setFieldsValue({
                    role_name: role.role_name,
                    role_description: role.role_description,
                });
            } else {
                // Create mode
                form.resetFields();
            }
        }
    }, [visible, role, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            await onSubmit(values);
            
            message.success(role ? t('role.messages.updateSuccess') : t('role.messages.createSuccess'));
            form.resetFields();
            onSuccess();
        } catch (error: any) {
            if (error.errorFields) {
                // Validation error
                return;
            }
            message.error(error.response?.data?.message || t('role.messages.genericError'));
        } finally {
            setLoading(false);
        }
    };

    const isDefaultRole = role && ['Administrator', 'Member', 'Viewer'].includes(role.role_name);

    return (
        <Modal
            title={role ? t('role.editRole') : t('role.createRole')}
            open={visible}
            onOk={handleSubmit}
            onCancel={onCancel}
            confirmLoading={loading}
            okText={role ? t('role.buttons.update') : t('role.buttons.create')}
            cancelText={t('role.buttons.cancel')}
            width={500}
        >
            <Form
                form={form}
                layout="vertical"
                autoComplete="off"
            >
                <Form.Item
                    label={t('role.form.roleName')}
                    name="role_name"
                    rules={[
                        { required: true, message: t('role.form.roleNameRequired') },
                        { min: 2, message: t('role.form.roleNameMin') },
                        { max: 50, message: t('role.form.roleNameMax') },
                    ]}
                >
                    <Input 
                        placeholder={t('role.form.roleNamePlaceholder')}
                        disabled={isDefaultRole ?? false}
                    />
                </Form.Item>

                {isDefaultRole && (
                    <div style={{ marginTop: -16, marginBottom: 16, color: '#faad14', fontSize: 12 }}>
                        {t('role.form.cannotRenameDefault')}
                    </div>
                )}

                <Form.Item
                    label={t('role.form.description')}
                    name="role_description"
                    rules={[
                        { max: 200, message: t('role.form.descriptionMax') },
                    ]}
                >
                    <Input.TextArea
                        placeholder={t('role.form.descriptionPlaceholder')}
                        rows={4}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};