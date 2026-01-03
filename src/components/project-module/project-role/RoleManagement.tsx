'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Space,
    Popconfirm,
    message,
    Tag,
    Card,
    Modal,
    Select,
    Alert,
    Tooltip,
    Statistic,
    Row,
    Col,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    KeyOutlined,
    CopyOutlined,
    ClearOutlined,
    TeamOutlined,
    SafetyOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ProjectRole } from '@/lib/api/services/project-module/project-role.service';
import { projectRoleService, RoleDetail } from '@/lib/api/services/project-module/project-role.service';
import { RoleModal } from './RoleModal';
import { AssignPermissionsModal } from './AssignPermissionsModal';
import { getPermissionName } from '@/lib/api/services/project-module/permissions';

const { Option } = Select;

interface RoleManagementProps {
    projectId: number;
}

export const RoleManagement: React.FC<RoleManagementProps> = ({ projectId }) => {
    const { t } = useTranslation();
    const [roles, setRoles] = useState<ProjectRole[]>([]);
    const [loading, setLoading] = useState(false);
    const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
    const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState<ProjectRole | null>(null);
    const [selectedRoleForPermission, setSelectedRoleForPermission] = useState<RoleDetail | null>(
        null
    );
    const [sourceRoleId, setSourceRoleId] = useState<number | null>(null);

    useEffect(() => {
        loadRoles();
    }, [projectId]);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const data = await projectRoleService.getRoles(projectId);
            setRoles(data);
        } catch (error: any) {
            message.error(t('role.messages.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = () => {
        setEditingRole(null);
        setIsRoleModalVisible(true);
    };

    const handleEditRole = (role: ProjectRole) => {
        setEditingRole(role);
        setIsRoleModalVisible(true);
    };

    const handleRoleSubmit = async (values: any) => {
        if (editingRole) {
            await projectRoleService.updateRole(projectId, editingRole.id, values);
        } else {
            await projectRoleService.createRole(projectId, values);
        }
        await loadRoles();
        setIsRoleModalVisible(false);
    };

    const handleDeleteRole = async (role: ProjectRole) => {
        try {
            await projectRoleService.deleteRole(projectId, role.id);
            message.success(t('role.messages.deleteSuccess', { roleName: role.role_name }));
            await loadRoles();
        } catch (error: any) {
            message.error(error.response?.data?.message || t('role.messages.deleteFailed'));
        }
    };

    const handleManagePermissions = async (role: ProjectRole) => {
        try {
            setLoading(true);
            const roleDetail = await projectRoleService.getRoleDetail(projectId, role.id);
            setSelectedRoleForPermission(roleDetail);
            setIsPermissionModalVisible(true);
        } catch (error: any) {
            message.error(t('role.messages.loadDetailFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleAssignPermissions = async (permissions: any[]) => {
        if (!selectedRoleForPermission) return;

        await projectRoleService.bulkAssignPermissions(projectId, selectedRoleForPermission.id, {
            permissions,
        });

        // Reload role detail
        const updated = await projectRoleService.getRoleDetail(
            projectId,
            selectedRoleForPermission.id
        );
        setSelectedRoleForPermission(updated);
        await loadRoles();
    };

    const handleRemovePermission = async (actionKey: string) => {
        if (!selectedRoleForPermission) return;

        await projectRoleService.removePermission(projectId, selectedRoleForPermission.id, {
            action_key: actionKey,
            recipient_type: 'ROLE',
        });

        // Reload role detail
        const updated = await projectRoleService.getRoleDetail(
            projectId,
            selectedRoleForPermission.id
        );
        setSelectedRoleForPermission(updated);
        await loadRoles();
    };

    const handleClearPermissions = (role: ProjectRole) => {
        Modal.confirm({
            title: t('role.confirm.clearAllTitle', { roleName: role.role_name }),
            icon: <ExclamationCircleOutlined />,
            content: t('role.confirm.clearAllDescription'),
            okText: t('role.confirm.clearAll'),
            okType: 'danger',
            cancelText: t('role.confirm.cancel'),
            async onOk() {
                try {
                    await projectRoleService.clearAllPermissions(projectId, role.id);
                    message.success(t('role.messages.clearAllSuccess'));
                    await loadRoles();
                } catch (error: any) {
                    message.error(error.response?.data?.message || t('role.messages.clearAllFailed'));
                }
            },
        });
    };

    const isDefaultRole = (roleName: string) => {
        return ['Administrator', 'Member', 'Viewer'].includes(roleName);
    };

    const columns = [
        {
            title: t('role.table.roleName'),
            dataIndex: 'role_name',
            key: 'role_name',
            render: (name: string) => (
                <Space>
                    <SafetyOutlined />
                    <strong>{name}</strong>
                    {isDefaultRole(name) && <Tag color="gold">{t('role.table.defaultRole')}</Tag>}
                </Space>
            ),
        },
        {
            title: t('role.table.description'),
            dataIndex: 'role_description',
            key: 'role_description',
            ellipsis: true,
        },
        {
            title: t('role.table.members'),
            dataIndex: 'member_count',
            key: 'member_count',
            width: 120,
            align: 'center' as const,
            render: (count: number) => (
                <Space>
                    <TeamOutlined />
                    <span>{count}</span>
                </Space>
            ),
        },
        {
            title: t('role.table.actions'),
            key: 'actions',
            width: 220,
            render: (_: any, role: ProjectRole) => (
                <Space size="small">
                    <Tooltip title={t('role.managePermissions')}>
                        <Button
                            size="small"
                            type="primary"
                            icon={<KeyOutlined />}
                            onClick={() => handleManagePermissions(role)}
                        >
                            {t('role.actions.manage')}
                        </Button>
                    </Tooltip>

                    <Tooltip title={t('role.actions.edit')}>
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditRole(role)}
                        />
                    </Tooltip>

                    {!isDefaultRole(role.role_name) && (
                        <>
                            <Tooltip title={t('role.actions.clearAll')}>
                                <Popconfirm
                                    title={t('role.clearPermissions')}
                                    onConfirm={() => handleClearPermissions(role)}
                                    okText={t('role.confirm.clearAll')}
                                    cancelText={t('role.confirm.cancel')}
                                >
                                    <Button size="small" danger icon={<ClearOutlined />} />
                                </Popconfirm>
                            </Tooltip>

                            <Tooltip title={t('role.actions.delete')}>
                                <Popconfirm
                                    title={t('role.confirm.deleteTitle', { roleName: role.role_name })}
                                    description={
                                        role.member_count > 0
                                            ? t('role.confirm.deleteWithMembers', { count: role.member_count })
                                            : t('role.confirm.deleteDescription')
                                    }
                                    onConfirm={() => handleDeleteRole(role)}
                                    okText={t('role.confirm.delete')}
                                    okType="danger"
                                    cancelText={t('role.confirm.cancel')}
                                    disabled={role.member_count > 0}
                                >
                                    <Button
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        disabled={role.member_count > 0}
                                    />
                                </Popconfirm>
                            </Tooltip>
                        </>
                    )}

                    {isDefaultRole(role.role_name) && (
                        <Tooltip title={t('role.actions.cannotDeleteDefault')}>
                            <Button size="small" danger icon={<DeleteOutlined />} disabled />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    const totalMembers = roles.reduce((sum, role) => sum + role.member_count, 0);
    const customRolesCount = roles.filter((r) => !isDefaultRole(r.role_name)).length;

    return (
        <div>
            {/* Statistics */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title={t('role.statistics.totalRoles')}
                            value={roles.length}
                            prefix={<SafetyOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title={t('role.statistics.customRoles')}
                            value={customRolesCount}
                            prefix={<SafetyOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title={t('role.statistics.totalMembers')}
                            value={totalMembers}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Actions */}
            <Card
                title={
                    <Space>
                        <SafetyOutlined />
                        <span>{t('role.title')}</span>
                    </Space>
                }
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRole}>
                        {t('role.createRole')}
                    </Button>
                }
            >
                <Alert
                    message={t('role.info.rbacTitle')}
                    description={t('role.info.rbacDescription')}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Table
                    columns={columns}
                    dataSource={roles}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                />
            </Card>

            {/* Role Modal */}
            <RoleModal
                visible={isRoleModalVisible}
                onCancel={() => setIsRoleModalVisible(false)}
                onSuccess={() => {
                    setIsRoleModalVisible(false);
                    loadRoles();
                }}
                projectId={projectId}
                role={editingRole}
                onSubmit={handleRoleSubmit}
            />

            {/* Assign Permissions Modal */}
            {selectedRoleForPermission && (
                <AssignPermissionsModal
                    visible={isPermissionModalVisible}
                    onCancel={() => setIsPermissionModalVisible(false)}
                    onSuccess={() => {
                        setIsPermissionModalVisible(false);
                        loadRoles();
                    }}
                    roleName={selectedRoleForPermission.role_name}
                    existingPermissions={selectedRoleForPermission.permissions}
                    onSubmit={handleAssignPermissions}
                    onRemove={handleRemovePermission}
                />
            )}
        </div>
    );
};