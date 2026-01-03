'use client';

import React, { useEffect, useState } from 'react';
import {
    Modal,
    Descriptions,
    Tag,
    Typography,
    Spin,
    message,
    Button,
    Space,
    Table,
    Empty,
} from 'antd';
import {
    FlagOutlined,
    EditOutlined,
    CalendarOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { epicService, Epic } from '@/lib/api/services/project-module/epic.service';

const { Title, Text, Paragraph } = Typography;

type Issue = {
    id: number;
    issue_code: string;
    summary: string;
    issue_type?: {
        type_name: string;
    };
    current_status?: {
        status_name: string;
    };
    reporter?: {
        full_name: string;
    };
    assignees?: Array<{
        full_name: string;
    }>;
};

type EpicDetailModalProps = {
    visible: boolean;
    epicId: number | null;
    onClose: () => void;
    onEdit: (epic: Epic) => void;
};

export const EpicDetailModal: React.FC<EpicDetailModalProps> = ({
    visible,
    epicId,
    onClose,
    onEdit,
}) => {
    const { t } = useTranslation();
    const [epic, setEpic] = useState<Epic | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchEpicDetail = async (id: number) => {
        try {
            setLoading(true);
            const data = await epicService.getById(id);
            setEpic(data);
        } catch (error) {
            console.error('Error fetching epic detail:', error);
            message.error(t('epic.messages.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible && epicId) {
            fetchEpicDetail(epicId);
        }
    }, [visible, epicId]);

    useEffect(() => {
        if (!visible) {
            setEpic(null);
        }
    }, [visible]);

    const getStatusColor = (status: string | null) => {
        if (!status) return 'default';
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('done') || lowerStatus.includes('complete')) return 'success';
        if (lowerStatus.includes('progress')) return 'processing';
        if (lowerStatus.includes('plan')) return 'warning';
        return 'default';
    };

    const getStatusLabel = (status: string | null) => {
        if (!status) return t('epic.status.noStatus');
        const statusMap: Record<string, string> = {
            'planning': t('epic.status.planning'),
            'in progress': t('epic.status.inProgress'),
            'on hold': t('epic.status.onHold'),
            'done': t('epic.status.done'),
            'cancelled': t('epic.status.cancelled'),
        };
        return statusMap[status.toLowerCase()] || status;
    };

    const issueColumns: ColumnsType<Issue> = [
        {
            title: t('epic.details.issueCode'),
            dataIndex: 'issue_code',
            key: 'issue_code',
            width: 120,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: t('epic.details.summary'),
            dataIndex: 'summary',
            key: 'summary',
            ellipsis: true,
        },
        {
            title: t('epic.details.type'),
            dataIndex: ['issue_type', 'type_name'],
            key: 'type',
            width: 100,
            render: (text) => <Tag>{text}</Tag>,
        },
        {
            title: t('epic.details.issueStatus'),
            dataIndex: ['current_status', 'status_name'],
            key: 'status',
            width: 120,
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: t('epic.details.assignees'),
            dataIndex: 'assignees',
            key: 'assignees',
            width: 150,
            render: (assignees: Issue['assignees']) => (
                <Space size={4} wrap>
                    {assignees && assignees.length > 0 ? (
                        assignees.map((assignee, index) => (
                            <Tag key={index} color="cyan" style={{ margin: 0 }}>
                                {assignee.full_name}
                            </Tag>
                        ))
                    ) : (
                        <Text type="secondary">{t('epic.details.unassigned')}</Text>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Modal
            open={visible}
            title={
                <Space>
                    <FlagOutlined />
                    <span>{t('epic.epicDetails')}</span>
                </Space>
            }
            onCancel={onClose}
            width={900}
            footer={[
                <Button key="close" onClick={onClose}>
                    {t('epic.buttons.close')}
                </Button>,
                <Button
                    key="edit"
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => epic && onEdit(epic)}
                >
                    {t('epic.buttons.edit')}
                </Button>,
            ]}
        >
            <Spin spinning={loading}>
                {epic ? (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {/* Epic Info */}
                        <div>
                            <Title level={4} style={{ marginBottom: 16 }}>
                                {epic.epic_name}
                            </Title>

                            <Descriptions bordered column={2} size="small">
                                <Descriptions.Item label={t('epic.form.project')} span={2}>
                                    <Tag color="blue">{epic.project?.project_name}</Tag>
                                </Descriptions.Item>

                                <Descriptions.Item label={t('epic.details.status')} span={2}>
                                    <Tag color={getStatusColor(epic.status)}>
                                        {getStatusLabel(epic.status)}
                                    </Tag>
                                </Descriptions.Item>

                                <Descriptions.Item label={t('epic.details.startDate')}>
                                    <Space>
                                        <CalendarOutlined />
                                        <Text>
                                            {epic.start_date
                                                ? dayjs(epic.start_date).format('DD/MM/YYYY')
                                                : '-'}
                                        </Text>
                                    </Space>
                                </Descriptions.Item>

                                <Descriptions.Item label={t('epic.details.dueDate')}>
                                    <Space>
                                        <CalendarOutlined />
                                        <Text
                                            type={
                                                epic.due_date &&
                                                dayjs(epic.due_date).isBefore(dayjs()) &&
                                                epic.status !== 'Done'
                                                    ? 'danger'
                                                    : undefined
                                            }
                                        >
                                            {epic.due_date
                                                ? dayjs(epic.due_date).format('DD/MM/YYYY')
                                                : '-'}
                                        </Text>
                                    </Space>
                                </Descriptions.Item>

                                <Descriptions.Item label={t('epic.details.goal')} span={2}>
                                    {epic.goal ? (
                                        <Paragraph style={{ margin: 0 }}>{epic.goal}</Paragraph>
                                    ) : (
                                        <Text type="secondary">{t('epic.details.noGoal')}</Text>
                                    )}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>

                        {/* Issues Section */}
                        <div>
                            <Title level={5} style={{ marginBottom: 12 }}>
                                <FileTextOutlined /> {t('epic.details.issuesCount', { count: epic.issues?.length || 0 })}
                            </Title>

                            {epic.issues && epic.issues.length > 0 ? (
                                <Table
                                    columns={issueColumns}
                                    dataSource={epic.issues}
                                    rowKey="id"
                                    pagination={{
                                        pageSize: 5,
                                        size: 'small',
                                    }}
                                    size="small"
                                />
                            ) : (
                                <Empty
                                    description={t('epic.details.noIssues')}
                                    style={{ padding: '24px 0' }}
                                />
                            )}
                        </div>
                    </Space>
                ) : (
                    <Empty description={t('epic.noData')} />
                )}
            </Spin>
        </Modal>
    );
};