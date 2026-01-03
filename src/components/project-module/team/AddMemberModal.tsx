'use client';

import React, { useEffect, useState } from 'react';
import {
    Modal,
    Form,
    Select,
    Button,
    message,
    Space,
    Avatar,
    Typography,
    Spin,
    Tabs,
    List,
    Tag,
    Empty,
} from 'antd';
import { UserAddOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
    teamService,
    Employee,
    ProjectRole,
    AddMemberDto,
    AddMultipleMembersDto,
} from '@/lib/api/services/project-module/team.service';

const { Option } = Select;
const { Text } = Typography;

type AddMemberModalProps = {
    visible: boolean;
    projectId: number;
    onClose: () => void;
    onSuccess: () => void;
};

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
    visible,
    projectId,
    onClose,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'single' | 'multiple'>('single');

    const [nonMembers, setNonMembers] = useState<Employee[]>([]);
    const [roles, setRoles] = useState<ProjectRole[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [selectedRole, setSelectedRole] = useState<number | undefined>();

    useEffect(() => {
        if (visible) {
            fetchData();
        }
    }, [visible, projectId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [nonMembersData, rolesData] = await Promise.all([
                teamService.getNonMembers(projectId),
                teamService.getAvailableRoles(projectId),
            ]);
            setNonMembers(nonMembersData);
            setRoles(rolesData);
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error(t('team.messages.loadDataFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleSingleSubmit = async (values: any) => {
        try {
            setSubmitting(true);
            await teamService.addMember(projectId, values);
            message.success(t('team.messages.addSuccess'));
            form.resetFields();
            onSuccess();
        } catch (error: any) {
            console.error('Error adding member:', error);
            if (error.response?.status === 409) {
                message.error(t('team.messages.memberExists'));
            } else {
                message.error(error.response?.data?.message || t('team.messages.addFailed'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleMultipleSubmit = async () => {
        if (selectedEmployees.length === 0) {
            message.warning(t('team.messages.selectAtLeastOne'));
            return;
        }
        if (!selectedRole) {
            message.warning(t('team.messages.selectRole'));
            return;
        }

        try {
            setSubmitting(true);
            const data: AddMultipleMembersDto = {
                members: selectedEmployees.map((employee_id) => ({
                    employee_id,
                    project_role_id: selectedRole,
                })),
            };
            const result = await teamService.addMultipleMembers(projectId, data);
            
            if (result.success > 0) {
                message.success(t('team.messages.addMultipleSuccess', {
                    success: result.success,
                    total: result.total
                }));
                setSelectedEmployees([]);
                setSelectedRole(undefined);
                onSuccess();
            } else {
                message.error(t('team.messages.addNoneFailed'));
            }
        } catch (error: any) {
            console.error('Error adding members:', error);
            message.error(t('team.messages.addFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedEmployees([]);
        setSelectedRole(undefined);
        setActiveTab('single');
        onClose();
    };

    const getRoleBadgeColor = (roleName: string) => {
        if (roleName.toLowerCase().includes('admin')) return 'red';
        if (roleName.toLowerCase().includes('member')) return 'blue';
        if (roleName.toLowerCase().includes('viewer')) return 'default';
        return 'purple';
    };

    return (
        <Modal
            open={visible}
            title={
                <Space>
                    <UserAddOutlined />
                    <span>{t('team.addMemberToProject')}</span>
                </Space>
            }
            onCancel={handleCancel}
            width={700}
            footer={null}
        >
            <Spin spinning={loading}>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as 'single' | 'multiple')}
                    items={[
                        {
                            key: 'single',
                            label: (
                                <Space>
                                    <UserOutlined />
                                    <span>{t('team.addModal.single')}</span>
                                </Space>
                            ),
                            children: (
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleSingleSubmit}
                                    style={{ marginTop: 16 }}
                                >
                                    {/* Employee Select */}
                                    <Form.Item
                                        name="employee_id"
                                        label={t('team.addModal.employee')}
                                        rules={[{ required: true, message: t('team.addModal.employeeRequired') }]}
                                    >
                                        <Select
                                            placeholder={t('team.addModal.employeePlaceholder')}
                                            showSearch
                                            optionFilterProp="children"
                                            filterOption={(input, option: any) => {
                                                const emp = nonMembers.find(e => e.id === option.value);
                                                return emp ? 
                                                    emp.full_name.toLowerCase().includes(input.toLowerCase()) ||
                                                    emp.email.toLowerCase().includes(input.toLowerCase())
                                                    : false;
                                            }}
                                            optionLabelProp="label"
                                        >
                                            {nonMembers.map((emp) => (
                                                <Option 
                                                    key={emp.id} 
                                                    value={emp.id}
                                                    label={emp.full_name}
                                                >
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        padding: '4px 0'
                                                    }}>
                                                        <Avatar size="small" icon={<UserOutlined />}>
                                                            {emp.full_name[0]}
                                                        </Avatar>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ 
                                                                fontWeight: 500,
                                                                lineHeight: '20px'
                                                            }}>
                                                                {emp.full_name}
                                                            </div>
                                                            <div style={{ 
                                                                fontSize: 12,
                                                                color: '#8c8c8c',
                                                                lineHeight: '18px'
                                                            }}>
                                                                {emp.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    {/* Role Select */}
                                    <Form.Item
                                        name="project_role_id"
                                        label={t('team.addModal.role')}
                                        rules={[{ required: true, message: t('team.addModal.roleRequired') }]}
                                    >
                                        <Select 
                                            placeholder={t('team.addModal.rolePlaceholder')}
                                            optionLabelProp="label"
                                        >
                                            {roles.map((role) => (
                                                <Option 
                                                    key={role.id} 
                                                    value={role.id}
                                                    label={
                                                        <Space>
                                                            <Tag color={getRoleBadgeColor(role.role_name)}>
                                                                {role.role_name}
                                                            </Tag>
                                                            {role.is_default && <Tag color="green">{t('team.addModal.default')}</Tag>}
                                                        </Space>
                                                    }
                                                >
                                                    <div style={{ padding: '4px 0' }}>
                                                        <div style={{ marginBottom: 4 }}>
                                                            <Space>
                                                                <Tag color={getRoleBadgeColor(role.role_name)}>
                                                                    {role.role_name}
                                                                </Tag>
                                                                {role.is_default && <Tag color="green">{t('team.addModal.default')}</Tag>}
                                                            </Space>
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: 12,
                                                            color: '#8c8c8c',
                                                            lineHeight: '18px'
                                                        }}>
                                                            {role.role_description}
                                                        </div>
                                                    </div>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    {/* Footer */}
                                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                                        <Space style={{ float: 'right' }}>
                                            <Button onClick={handleCancel}>{t('team.buttons.cancel')}</Button>
                                            <Button type="primary" htmlType="submit" loading={submitting}>
                                                {t('team.buttons.add')}
                                            </Button>
                                        </Space>
                                    </Form.Item>
                                </Form>
                            ),
                        },
                        {
                            key: 'multiple',
                            label: (
                                <Space>
                                    <TeamOutlined />
                                    <span>{t('team.addModal.multiple')}</span>
                                </Space>
                            ),
                            children: (
                                <div style={{ marginTop: 16 }}>
                                    {/* Role Selection */}
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong>{t('team.addModal.selectRoleForAll')}</Text>
                                        <Select
                                            placeholder={t('team.addModal.rolePlaceholder')}
                                            style={{ width: '100%', marginTop: 8 }}
                                            value={selectedRole}
                                            onChange={setSelectedRole}
                                            optionLabelProp="label"
                                        >
                                            {roles.map((role) => (
                                                <Option 
                                                    key={role.id} 
                                                    value={role.id}
                                                    label={
                                                        <Space>
                                                            <Tag color={getRoleBadgeColor(role.role_name)}>
                                                                {role.role_name}
                                                            </Tag>
                                                        </Space>
                                                    }
                                                >
                                                    <div style={{ padding: '4px 0' }}>
                                                        <div style={{ marginBottom: 4 }}>
                                                            <Tag color={getRoleBadgeColor(role.role_name)}>
                                                                {role.role_name}
                                                            </Tag>
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: 12,
                                                            color: '#8c8c8c',
                                                            lineHeight: '18px'
                                                        }}>
                                                            {role.role_description}
                                                        </div>
                                                    </div>
                                                </Option>
                                            ))}
                                        </Select>
                                    </div>

                                    {/* Employee List */}
                                    <Text strong>
                                        {t('team.addModal.selectEmployees', { count: selectedEmployees.length })}
                                    </Text>
                                    <List
                                        bordered
                                        style={{ marginTop: 8, maxHeight: 300, overflow: 'auto' }}
                                        dataSource={nonMembers}
                                        locale={{
                                            emptyText: <Empty description={t('team.addModal.noEmployees')} />,
                                        }}
                                        renderItem={(emp) => (
                                            <List.Item
                                                style={{
                                                    cursor: 'pointer',
                                                    background: selectedEmployees.includes(emp.id)
                                                        ? '#e6f7ff'
                                                        : 'white',
                                                }}
                                                onClick={() => {
                                                    if (selectedEmployees.includes(emp.id)) {
                                                        setSelectedEmployees(
                                                            selectedEmployees.filter((id) => id !== emp.id)
                                                        );
                                                    } else {
                                                        setSelectedEmployees([...selectedEmployees, emp.id]);
                                                    }
                                                }}
                                            >
                                                <List.Item.Meta
                                                    avatar={
                                                        <Avatar icon={<UserOutlined />}>
                                                            {emp.full_name[0]}
                                                        </Avatar>
                                                    }
                                                    title={emp.full_name}
                                                    description={
                                                        <Space split="-">
                                                            <Text type="secondary">{emp.email}</Text>
                                                            {(emp.department || (emp as any).employee_positions?.find((ep: any) => ep.is_current)?.department?.name) && (
                                                                <Text type="secondary">
                                                                    {emp.department || (emp as any).employee_positions?.find((ep: any) => ep.is_current)?.department?.name}
                                                                </Text>
                                                            )}
                                                        </Space>
                                                    }
                                                />
                                                {selectedEmployees.includes(emp.id) && (
                                                    <Tag color="blue">{t('team.addModal.selected')}</Tag>
                                                )}
                                            </List.Item>
                                        )}
                                    />

                                    {/* Footer */}
                                    <Space style={{ marginTop: 16, float: 'right' }}>
                                        <Button onClick={handleCancel}>{t('team.buttons.cancel')}</Button>
                                        <Button
                                            type="primary"
                                            onClick={handleMultipleSubmit}
                                            loading={submitting}
                                            disabled={selectedEmployees.length === 0 || !selectedRole}
                                        >
                                            {t('team.addModal.addCount', { count: selectedEmployees.length })}
                                        </Button>
                                    </Space>
                                </div>
                            ),
                        },
                    ]}
                />
            </Spin>
        </Modal>
    );
};