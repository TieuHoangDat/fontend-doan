'use client';

import React, { useEffect, useState } from 'react';
import {
    Table,
    Button,
    Space,
    Tag,
    Typography,
    Card,
    message,
    Popconfirm,
    Input,
    Select,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    SearchOutlined,
    FlagOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { EpicFormModal } from './EpicFormModal';
import { EpicDetailModal } from './EpicDetailModal';
import { epicService, Epic } from '@/lib/api/services/project-module/epic.service';
import { projectService, Project } from '@/lib/api/services/project-module/project.service';

const { Title } = Typography;
const { Option } = Select;

type EpicManagementProps = {
    projectId?: number;
};

export const EpicManagement: React.FC<EpicManagementProps> = ({ projectId }) => {
    const { t } = useTranslation();
    const [epics, setEpics] = useState<Epic[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(projectId);
    const [searchText, setSearchText] = useState('');

    // Modal states
    const [formModalVisible, setFormModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
    const [viewingEpicId, setViewingEpicId] = useState<number | null>(null);

    const fetchEpics = async (projectId?: number) => {
        try {
            setLoading(true);
            const data = await epicService.getAll(projectId ? { projectId } : undefined);
            setEpics(data);
        } catch (error) {
            console.error('Error fetching epics:', error);
            message.error(t('epic.messages.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const data = await projectService.getAll();
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await epicService.delete(id);
            message.success(t('epic.messages.deleteSuccess'));
            fetchEpics(selectedProjectId);
        } catch (error: any) {
            console.error('Error deleting epic:', error);
            if (error.response?.status === 400) {
                message.error(error.response.data.message || t('epic.messages.deleteError'));
            } else {
                message.error(t('epic.messages.deleteError'));
            }
        }
    };

    const handleCreate = () => {
        setEditingEpic(null);
        setFormModalVisible(true);
    };

    const handleEdit = (epic: Epic) => {
        setEditingEpic(epic);
        setFormModalVisible(true);
    };

    const handleView = (epicId: number) => {
        setViewingEpicId(epicId);
        setDetailModalVisible(true);
    };

    const handleFormSuccess = () => {
        setFormModalVisible(false);
        setEditingEpic(null);
        fetchEpics(selectedProjectId);
    };

    useEffect(() => {
        fetchProjects();
        fetchEpics(projectId);
    }, [projectId]);

    useEffect(() => {
        fetchEpics(selectedProjectId);
    }, [selectedProjectId]);

    const filteredEpics = epics.filter((epic) =>
        epic.epic_name.toLowerCase().includes(searchText.toLowerCase()) ||
        epic.goal?.toLowerCase().includes(searchText.toLowerCase())
    );

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

    const columns: ColumnsType<Epic> = [
        {
            title: t('epic.table.epicName'),
            dataIndex: 'epic_name',
            key: 'epic_name',
            width: 250,
            render: (text, record) => (
                <Space>
                    <FlagOutlined style={{ color: '#1890ff' }} />
                    <Typography.Link onClick={() => handleView(record.id)}>
                        {text}
                    </Typography.Link>
                </Space>
            ),
        },
        {
            title: t('epic.table.project'),
            dataIndex: ['project', 'project_name'],
            key: 'project',
            width: 150,
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: t('epic.table.goal'),
            dataIndex: 'goal',
            key: 'goal',
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text}>
                    <Typography.Text type="secondary" ellipsis>
                        {text || '-'}
                    </Typography.Text>
                </Tooltip>
            ),
        },
        {
            title: t('epic.table.status'),
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusLabel(status)}
                </Tag>
            ),
        },
        {
            title: t('epic.table.issues'),
            dataIndex: 'issue_count',
            key: 'issue_count',
            width: 80,
            align: 'center',
            render: (count) => (
                <Tag color={count > 0 ? 'blue' : 'default'}>{count || 0}</Tag>
            ),
        },
        {
            title: t('epic.table.startDate'),
            dataIndex: 'start_date',
            key: 'start_date',
            width: 120,
            render: (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
        },
        {
            title: t('epic.table.dueDate'),
            dataIndex: 'due_date',
            key: 'due_date',
            width: 120,
            render: (date, record) => {
                if (!date) return '-';
                const dueDate = dayjs(date);
                const isOverdue = dueDate.isBefore(dayjs()) && record.status !== 'Done';
                return (
                    <Typography.Text type={isOverdue ? 'danger' : undefined}>
                        {dueDate.format('DD/MM/YYYY')}
                    </Typography.Text>
                );
            },
        },
        {
            title: t('epic.table.actions'),
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title={t('epic.viewDetails')}>
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleView(record.id)}
                        />
                    </Tooltip>
                    <Tooltip title={t('epic.editEpic')}>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title={t('epic.messages.deleteConfirm')}
                        description={t('epic.messages.deleteDescription')}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t('epic.deleteEpic')}
                        cancelText={t('epic.buttons.cancel')}
                    >
                        <Tooltip title={t('epic.deleteEpic')}>
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Header */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Title level={3} style={{ margin: 0 }}>
                            <FlagOutlined /> {t('epic.title')}
                        </Title>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreate}
                        >
                            {t('epic.createEpic')}
                        </Button>
                    </div>

                    {/* Filters */}
                    <Space size="middle" wrap>
                        <Input
                            placeholder={t('epic.filters.searchPlaceholder')}
                            prefix={<SearchOutlined />}
                            style={{ width: 300 }}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                        <Select
                            placeholder={t('epic.filters.filterByProject')}
                            style={{ width: 200 }}
                            value={selectedProjectId}
                            onChange={setSelectedProjectId}
                            allowClear
                        >
                            {projects.map((project) => (
                                <Option key={project.id} value={project.id}>
                                    {project.project_name}
                                </Option>
                            ))}
                        </Select>
                        <Typography.Text type="secondary">
                            {t('epic.filters.total', { count: filteredEpics.length })}
                        </Typography.Text>
                    </Space>

                    {/* Table */}
                    <Table
                        columns={columns}
                        dataSource={filteredEpics}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => t('epic.filters.total', { count: total }),
                        }}
                        scroll={{ x: 1200 }}
                    />
                </Space>
            </Card>

            {/* Modals */}
            <EpicFormModal
                visible={formModalVisible}
                epic={editingEpic}
                projects={projects}
                onClose={() => {
                    setFormModalVisible(false);
                    setEditingEpic(null);
                }}
                onSuccess={handleFormSuccess}
            />

            <EpicDetailModal
                visible={detailModalVisible}
                epicId={viewingEpicId}
                onClose={() => {
                    setDetailModalVisible(false);
                    setViewingEpicId(null);
                }}
                onEdit={(epic) => {
                    setDetailModalVisible(false);
                    handleEdit(epic);
                }}
            />
        </div>
    );
};