'use client';

import React, { useState } from 'react';
import { Modal, Collapse, Checkbox, message, Space, Alert, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { AssignPermissionDto, Permission } from '@/lib/api/services/project-module/project-role.service';
import { PERMISSION_GROUPS } from '@/lib/api/services/project-module/permissions';

const { Panel } = Collapse;

interface AssignPermissionsModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    roleName: string;
    existingPermissions: Permission[];
    onSubmit: (permissions: AssignPermissionDto[]) => Promise<void>;
    onRemove: (actionKey: string) => Promise<void>;
}

export const AssignPermissionsModal: React.FC<AssignPermissionsModalProps> = ({
    visible,
    onCancel,
    onSuccess,
    roleName,
    existingPermissions,
    onSubmit,
    onRemove,
}) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [processingPermissions, setProcessingPermissions] = useState<Set<string>>(new Set());

    const handlePermissionChange = async (actionKey: string, checked: boolean) => {
        const isCurrentlyAssigned = isPermissionExist(actionKey);

        // Prevent multiple simultaneous operations on the same permission
        if (processingPermissions.has(actionKey)) {
            return;
        }

        // Mark permission as processing
        setProcessingPermissions((prev) => new Set(prev).add(actionKey));

        try {
            if (checked && !isCurrentlyAssigned) {
                // Assign permission immediately
                await onSubmit([{
                    action_key: actionKey,
                    recipient_type: 'ROLE',
                }]);
                message.success(t('role.messages.permissionAssigned'));
            } else if (!checked && isCurrentlyAssigned) {
                // Remove permission immediately
                await onRemove(actionKey);
                message.success(t('role.messages.permissionRemoved'));
            }
        } catch (error: any) {
            const action = checked ? 'assign' : 'remove';
            message.error(
                error.response?.data?.message || 
                t('role.messages.permissionFailed', { action })
            );
        } finally {
            // Remove from processing set
            setProcessingPermissions((prev) => {
                const newSet = new Set(prev);
                newSet.delete(actionKey);
                return newSet;
            });
        }
    };

    const isPermissionExist = (actionKey: string) => {
        return existingPermissions.some(
            (p) => p.action_key === actionKey && p.recipient_type === 'ROLE'
        );
    };

    const isProcessing = (actionKey: string) => {
        return processingPermissions.has(actionKey);
    };

    const getAssignedCount = () => {
        return existingPermissions.filter(p => p.recipient_type === 'ROLE').length;
    };

    return (
        <Modal
            title={t('role.permissions.title', { roleName })}
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
            bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
            <Alert
                message={t('role.permissions.instantManagement')}
                description={
                    <div>
                        <div>{t('role.permissions.checkToAssign')}</div>
                        <div>{t('role.permissions.uncheckToRemove')}</div>
                        <div style={{ marginTop: 8 }}>
                            {t('role.permissions.changesApplied')}
                        </div>
                    </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
            />

            <div style={{ marginBottom: 16 }}>
                <Space>
                    <Tag color="blue">
                        {t('role.permissions.assignedCount', { count: getAssignedCount() })}
                    </Tag>
                    {processingPermissions.size > 0 && (
                        <Tag color="orange">
                            {t('role.permissions.processingCount', { count: processingPermissions.size })}
                        </Tag>
                    )}
                </Space>
            </div>

            <Collapse defaultActiveKey={['PROJECT_ADMINISTRATION']} ghost>
                {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                    <Panel
                        header={
                            <span style={{ fontWeight: 500, fontSize: 14 }}>
                                {group.name} ({group.permissions.length})
                            </span>
                        }
                        key={groupKey}
                    >
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            {group.permissions.map((permission) => {
                                const isChecked = isPermissionExist(permission.key);
                                const isLoadingThis = isProcessing(permission.key);

                                return (
                                    <div
                                        key={permission.key}
                                        style={{
                                            padding: '12px',
                                            border: '1px solid #f0f0f0',
                                            borderRadius: 4,
                                            backgroundColor: isChecked
                                                ? '#f6ffed'
                                                : '#fafafa',
                                            opacity: isLoadingThis ? 0.6 : 1,
                                        }}
                                    >
                                        <Space direction="vertical" style={{ width: '100%' }} size={4}>
                                            <Checkbox
                                                checked={isChecked}
                                                disabled={isLoadingThis}
                                                onChange={(e) =>
                                                    handlePermissionChange(
                                                        permission.key,
                                                        e.target.checked
                                                    )
                                                }
                                            >
                                                <strong>{permission.name}</strong>
                                                {isChecked && (
                                                    <Tag
                                                        color="success"
                                                        style={{ marginLeft: 8 }}
                                                    >
                                                        {t('role.permissions.assignedTag')}
                                                    </Tag>
                                                )}
                                                {isLoadingThis && (
                                                    <Tag
                                                        color="processing"
                                                        style={{ marginLeft: 8 }}
                                                    >
                                                        {t('role.permissions.processingTag')}
                                                    </Tag>
                                                )}
                                            </Checkbox>

                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: '#8c8c8c',
                                                    marginLeft: 24,
                                                }}
                                            >
                                                {permission.description}
                                            </div>
                                        </Space>
                                    </div>
                                );
                            })}
                        </Space>
                    </Panel>
                ))}
            </Collapse>
        </Modal>
    );
};