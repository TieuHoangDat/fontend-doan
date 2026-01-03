'use client';

import React, { useEffect, useState } from 'react';
import {
    Card,
    Select,
    Avatar,
    Space,
    Tag,
    message,
    Spin,
    Typography,
    Tooltip,
} from 'antd';
import {
    UserOutlined,
    UserAddOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { issueService, Employee } from '@/lib/api/services/project-module/issue.service';

const { Option } = Select;
const { Text } = Typography;

type IssueAssigneesProps = {
    issueId: number;
    projectId?: number;
};

export const IssueAssignees: React.FC<IssueAssigneesProps> = ({
    issueId,
    projectId = 1,
}) => {
    const { t } = useTranslation();
    const [assignees, setAssignees] = useState<Employee[]>([]);
    const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);

    const fetchAssignees = async () => {
        try {
            setLoading(true);
            const data = await issueService.getAssignees(issueId);
            setAssignees(data);
        } catch (error) {
            console.error('Error fetching assignees:', error);
            message.error(t('issue.assignees.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableEmployees = async () => {
        try {
            const data = await issueService.getProjectEmployees(projectId);
            setAvailableEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            message.error(t('issue.assignees.loadEmployeesFailed'));
        }
    };

    const handleAddAssignee = async (employeeId: number) => {
        try {
            setAdding(true);
            await issueService.assignEmployee(issueId, employeeId);
            message.success(t('issue.assignees.addSuccess'));
            fetchAssignees();
        } catch (error: any) {
            console.error('Error adding assignee:', error);
            if (error.response?.status === 400) {
                message.warning(t('issue.assignees.alreadyAssigned'));
            } else {
                message.error(t('issue.assignees.addFailed'));
            }
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveAssignee = async (employeeId: number) => {
        try {
            await issueService.removeAssignee(issueId, employeeId);
            message.success(t('issue.assignees.removeSuccess'));
            fetchAssignees();
        } catch (error) {
            console.error('Error removing assignee:', error);
            message.error(t('issue.assignees.removeFailed'));
        }
    };

    useEffect(() => {
        if (issueId) {
            fetchAssignees();
            fetchAvailableEmployees();
        }
    }, [issueId]);

    const filteredEmployees = availableEmployees.filter(
        (emp) => !assignees.some((assignee) => assignee.id === emp.id)
    );

    return (
        <Card
            size="small"
            title={
                <Space>
                    <UserOutlined />
                    <Text strong>{t('issue.assignees.title')}</Text>
                    <Tag color="blue">{assignees.length}</Tag>
                </Space>
            }
            style={{ marginBottom: 16 }}
        >
            <Spin spinning={loading}>
                <Select
                    style={{ width: '100%', marginBottom: 12 }}
                    placeholder={
                        <Space>
                            <UserAddOutlined />
                            <span>{t('issue.assignees.addAssignee')}</span>
                        </Space>
                    }
                    showSearch
                    loading={adding}
                    optionFilterProp="children"
                    onChange={handleAddAssignee}
                    value={null}
                    disabled={filteredEmployees.length === 0}
                >
                    {filteredEmployees.map((emp) => (
                        <Option key={emp.id} value={emp.id}>
                            <Space>
                                <Avatar size="small" icon={<UserOutlined />}>
                                    {emp.full_name?.[0]}
                                </Avatar>
                                <span>{emp.full_name}</span>
                            </Space>
                        </Option>
                    ))}
                </Select>

                <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {assignees.length === 0 ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('issue.assignees.noAssignees')}
                        </Text>
                    ) : (
                        assignees.map((assignee) => (
                            <div
                                key={assignee.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px 8px',
                                    background: '#f5f5f5',
                                    borderRadius: 4,
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#e6f7ff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f5f5f5';
                                }}
                            >
                                <Space>
                                    <Avatar
                                        size="small"
                                        icon={<UserOutlined />}
                                        style={{ backgroundColor: '#1890ff' }}
                                    >
                                        {assignee.full_name?.[0]}
                                    </Avatar>
                                    <div>
                                        <Text strong style={{ fontSize: 13 }}>
                                            {assignee.full_name}
                                        </Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {assignee.email}
                                        </Text>
                                    </div>
                                </Space>
                                <Tooltip title={t('issue.assignees.removeAssignee')}>
                                    <CloseOutlined
                                        style={{
                                            cursor: 'pointer',
                                            color: '#ff4d4f',
                                            fontSize: 12,
                                        }}
                                        onClick={() => handleRemoveAssignee(assignee.id)}
                                    />
                                </Tooltip>
                            </div>
                        ))
                    )}
                </Space>
            </Spin>
        </Card>
    );
};