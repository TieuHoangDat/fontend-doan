'use client';

import React, { useEffect, useState } from 'react';
import {
    Card,
    Button,
    Space,
    Typography,
    message,
    Spin,
    Empty,
    Tag,
    Dropdown,
    Menu,
} from 'antd';
import {
    PlusOutlined,
    RocketOutlined,
    CheckCircleOutlined,
    MoreOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useTranslation } from 'react-i18next';
import { SprintFormModal } from './SprintFormModal';
import { SprintIssueCard } from './SprintIssueCard';
import { IssueEditModal } from '../issue/EditForm/IssueEditModal';
import { CreateIssueModal } from '../issue/CreateIssueModal';
import { Issue, Sprint } from './sprint.types';
import { sprintService } from '@/lib/api/services/project-module/sprint.service';
import { SprintBacklogFilter, SprintFilterValues, useFilteredSprintData } from './SprintBacklogFilter';

const { Title, Text } = Typography;

type SprintBacklogProps = {
    projectId: number;
};

export const SprintBacklog: React.FC<SprintBacklogProps> = ({ projectId }) => {
    const { t } = useTranslation();
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [backlogIssues, setBacklogIssues] = useState<Issue[]>([]);
    const [sprintIssues, setSprintIssues] = useState<Record<number, Issue[]>>({});
    const [loading, setLoading] = useState(false);
    const [formModalVisible, setFormModalVisible] = useState(false);
    const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
    const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
    const [issueEditModalVisible, setIssueEditModalVisible] = useState(false);
    const [createIssueModalVisible, setCreateIssueModalVisible] = useState(false);

    const [filters, setFilters] = useState<SprintFilterValues>({
        search: '',
        assigneeIds: [],
        issueTypeIds: [],
        epicIds: [],
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            
            const sprintsData = await sprintService.getAll({ projectId });
            setSprints(sprintsData);

            const backlogData = await sprintService.getBacklog(projectId);
            setBacklogIssues(backlogData);

            const sprintIssuesData: Record<number, Issue[]> = {};
            for (const sprint of sprintsData) {
                const issuesData = await sprintService.getSprintIssues(sprint.id);
                sprintIssuesData[sprint.id] = issuesData;
            }
            setSprintIssues(sprintIssuesData);
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error(t('sprint.messages.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchData();
        }
    }, [projectId]);

    const handleFilterChange = (newFilters: SprintFilterValues) => {
        setFilters(newFilters);
    };

    const { filteredBacklog, filteredSprintIssues, totalIssues, filteredCount } = useFilteredSprintData(
        backlogIssues,
        sprintIssues,
        filters
    );

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const issueId = parseInt(draggableId.split('-')[1]);
        const sourceSprintId = source.droppableId === 'backlog' 
            ? 0 
            : parseInt(source.droppableId.split('-')[1]);
        const targetSprintId = destination.droppableId === 'backlog' 
            ? 0 
            : parseInt(destination.droppableId.split('-')[1]);

        try {
            await sprintService.moveIssue({
                issue_id: issueId,
                target_sprint_id: targetSprintId,
                rank_order: destination.index + 1,
            });

            message.success(t('sprint.messages.moveSuccess'));
            fetchData();
        } catch (error) {
            console.error('Error moving issue:', error);
            message.error(t('sprint.messages.moveFailed'));
        }
    };

    const handleStartSprint = async (sprintId: number) => {
        try {
            await sprintService.start(sprintId);
            message.success(t('sprint.messages.startSuccess'));
            fetchData();
        } catch (error: any) {
            console.error('Error starting sprint:', error);
            message.error(error.response?.data?.message || t('sprint.messages.startFailed'));
        }
    };

    const handleCompleteSprint = async (sprintId: number) => {
        try {
            await sprintService.complete(sprintId);
            message.success(t('sprint.messages.completeSuccess'));
            fetchData();
        } catch (error: any) {
            console.error('Error completing sprint:', error);
            message.error(error.response?.data?.message || t('sprint.messages.completeFailed'));
        }
    };

    const handleDeleteSprint = async (sprintId: number) => {
        try {
            await sprintService.delete(sprintId);
            message.success(t('sprint.messages.deleteSuccess'));
            fetchData();
        } catch (error: any) {
            console.error('Error deleting sprint:', error);
            message.error(error.response?.data?.message || t('sprint.messages.deleteFailed'));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'processing';
            case 'completed': return 'success';
            case 'closed': return 'default';
            default: return 'warning';
        }
    };

    const getStatusLabel = (status: string) => {
        const statusKey = status as 'planning' | 'active' | 'completed' | 'closed';
        return t(`sprint.status.${statusKey}`, status);
    };

    const handleEditIssue = (issueId: number) => {
        setEditingIssueId(issueId);
        setIssueEditModalVisible(true);
    };

    const handleIssueEditSuccess = () => {
        setIssueEditModalVisible(false);
        setEditingIssueId(null);
        fetchData();
    };

    const handleCreateIssueSuccess = () => {
        setCreateIssueModalVisible(false);
        fetchData();
    };

    const handleRefresh = () => {
        fetchData();
    };

    const hasFilter = filters.search || filters.assigneeIds.length > 0 || 
                      filters.issueTypeIds.length > 0 || filters.epicIds.length > 0;

    return (
        <div style={{ padding: '24px' }}>
            <Spin spinning={loading}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={3} style={{ margin: 0 }}>
                            <RocketOutlined /> {t('sprint.title')}
                        </Title>
                        <Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleRefresh}
                                loading={loading}
                            >
                                {t('sprint.refresh')}
                            </Button>
                            <Button
                                type="default"
                                icon={<PlusOutlined />}
                                onClick={() => setCreateIssueModalVisible(true)}
                            >
                                {t('sprint.createIssue')}
                            </Button>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setEditingSprint(null);
                                    setFormModalVisible(true);
                                }}
                            >
                                {t('sprint.createSprint')}
                            </Button>
                        </Space>
                    </div>

                    {/* Filter Component */}
                    <SprintBacklogFilter
                        projectId={projectId}
                        onFilterChange={handleFilterChange}
                        totalIssues={totalIssues}
                        filteredCount={filteredCount}
                    />

                    <DragDropContext onDragEnd={handleDragEnd}>
                        {/* Backlog */}
                        <Card
                            title={
                                <Space>
                                    <Text strong>{t('sprint.backlog')}</Text>
                                    <Tag>{t('sprint.issue.issueCount', { count: filteredBacklog.length })}</Tag>
                                    {hasFilter && backlogIssues.length !== filteredBacklog.length && (
                                        <Tag color="orange">{t('sprint.filter.totalLabel', { count: backlogIssues.length })}</Tag>
                                    )}
                                </Space>
                            }
                            style={{ marginBottom: 16 }}
                        >
                            <Droppable droppableId="backlog">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        style={{
                                            minHeight: 100,
                                            background: snapshot.isDraggingOver ? '#f0f5ff' : 'transparent',
                                            borderRadius: 4,
                                            padding: 8,
                                        }}
                                    >
                                        {filteredBacklog.length === 0 ? (
                                            <Empty 
                                                description={
                                                    backlogIssues.length === 0 
                                                        ? t('sprint.issue.noIssuesInBacklog')
                                                        : t('sprint.issue.noMatchingIssues')
                                                } 
                                            />
                                        ) : (
                                            filteredBacklog.map((issue, index) => (
                                                <Draggable
                                                    key={`issue-${issue.id}`}
                                                    draggableId={`issue-${issue.id}`}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        >
                                                            <SprintIssueCard
                                                                issue={issue}
                                                                isDragging={snapshot.isDragging}
                                                                onEdit={handleEditIssue}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </Card>

                        {/* Sprints */}
                        {sprints.map((sprint) => {
                            const sprintFilteredIssues = filteredSprintIssues[sprint.id] || [];
                            const sprintTotalIssues = sprintIssues[sprint.id]?.length || 0;

                            return (
                                <Card
                                    key={sprint.id}
                                    title={
                                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                            <Space>
                                                <Text strong>{sprint.sprint_name}</Text>
                                                <Tag color={getStatusColor(sprint.status)}>
                                                    {getStatusLabel(sprint.status)}
                                                </Tag>
                                                <Tag>{t('sprint.issue.issueCount', { count: sprintFilteredIssues.length })}</Tag>
                                                {hasFilter && sprintTotalIssues !== sprintFilteredIssues.length && (
                                                    <Tag color="orange">{t('sprint.filter.totalLabel', { count: sprintTotalIssues })}</Tag>
                                                )}
                                            </Space>
                                            <Space>
                                                {sprint.status === 'planning' && (
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<RocketOutlined />}
                                                        onClick={() => handleStartSprint(sprint.id)}
                                                    >
                                                        {t('sprint.startSprint')}
                                                    </Button>
                                                )}
                                                {sprint.status === 'active' && (
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<CheckCircleOutlined />}
                                                        onClick={() => handleCompleteSprint(sprint.id)}
                                                    >
                                                        {t('sprint.completeSprint')}
                                                    </Button>
                                                )}
                                                <Dropdown
                                                    overlay={
                                                        <Menu>
                                                            <Menu.Item
                                                                key="edit"
                                                                icon={<EditOutlined />}
                                                                onClick={() => {
                                                                    setEditingSprint(sprint);
                                                                    setFormModalVisible(true);
                                                                }}
                                                            >
                                                                {t('sprint.actions.edit')}
                                                            </Menu.Item>
                                                            <Menu.Item
                                                                key="delete"
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                                onClick={() => handleDeleteSprint(sprint.id)}
                                                            >
                                                                {t('sprint.actions.delete')}
                                                            </Menu.Item>
                                                        </Menu>
                                                    }
                                                >
                                                    <Button size="small" icon={<MoreOutlined />} />
                                                </Dropdown>
                                            </Space>
                                        </Space>
                                    }
                                    style={{ marginBottom: 16 }}
                                >
                                    {sprint.goal && (
                                        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                                            {t('sprint.goal')}: {sprint.goal}
                                        </Text>
                                    )}
                                    <Droppable droppableId={`sprint-${sprint.id}`}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                style={{
                                                    minHeight: 100,
                                                    background: snapshot.isDraggingOver ? '#f0f5ff' : 'transparent',
                                                    borderRadius: 4,
                                                    padding: 8,
                                                }}
                                            >
                                                {sprintFilteredIssues.length === 0 ? (
                                                    <Empty 
                                                        description={
                                                            sprintTotalIssues === 0 
                                                                ? t('sprint.issue.noIssuesInSprint')
                                                                : t('sprint.issue.noMatchingIssues')
                                                        } 
                                                    />
                                                ) : (
                                                    sprintFilteredIssues.map((issue, index) => (
                                                        <Draggable
                                                            key={`issue-${issue.id}`}
                                                            draggableId={`issue-${issue.id}`}
                                                            index={index}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                >
                                                                    <SprintIssueCard
                                                                        issue={issue}
                                                                        isDragging={snapshot.isDragging}
                                                                        onEdit={handleEditIssue}
                                                                    />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))
                                                )}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </Card>
                            );
                        })}
                    </DragDropContext>
                </Space>
            </Spin>

            <SprintFormModal
                visible={formModalVisible}
                sprint={editingSprint}
                projectId={projectId}
                onClose={() => {
                    setFormModalVisible(false);
                    setEditingSprint(null);
                }}
                onSuccess={() => {
                    setFormModalVisible(false);
                    setEditingSprint(null);
                    fetchData();
                }}
            />

            <IssueEditModal
                visible={issueEditModalVisible}
                issueId={editingIssueId}
                onClose={() => {
                    setIssueEditModalVisible(false);
                    setEditingIssueId(null);
                }}
                onSuccess={handleIssueEditSuccess}
            />

            <CreateIssueModal
                visible={createIssueModalVisible}
                projectId={projectId}
                onClose={() => setCreateIssueModalVisible(false)}
                onSuccess={handleCreateIssueSuccess}
            />
        </div>
    );
};