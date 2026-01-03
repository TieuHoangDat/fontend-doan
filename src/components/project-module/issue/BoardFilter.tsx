'use client';

import React, { useEffect, useState } from 'react';
import {
    Card,
    Select,
    Input,
    Space,
    Button,
    Tag,
    Avatar,
    Tooltip,
    Divider,
    Badge,
} from 'antd';
import {
    SearchOutlined,
    FilterOutlined,
    ClearOutlined,
    UserOutlined,
    AppstoreOutlined,
    FlagOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { issueService, Employee, IssueType } from '@/lib/api/services/project-module/issue.service';

const { Option } = Select;

export interface BoardFilterValues {
    search: string;
    assigneeIds: number[];
    issueTypeIds: number[];
    epicIds: number[];
}

interface BoardFilterProps {
    projectId: number;
    onFilterChange: (filters: BoardFilterValues) => void;
    totalIssues?: number;
    filteredCount?: number;
}

export const BoardFilter: React.FC<BoardFilterProps> = ({
    projectId,
    onFilterChange,
    totalIssues = 0,
    filteredCount,
}) => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
    const [issueTypeIds, setIssueTypeIds] = useState<number[]>([]);
    const [epicIds, setEpicIds] = useState<number[]>([]);

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
    const [epics, setEpics] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                setLoading(true);
                const [employeesData, issueTypesData, epicsData] = await Promise.all([
                    issueService.getProjectEmployees(projectId),
                    issueService.getIssueTypes(projectId),
                    issueService.getProjectEpics ? issueService.getProjectEpics(projectId) : Promise.resolve([]),
                ]);
                setEmployees(employeesData);
                setIssueTypes(issueTypesData);
                setEpics(epicsData);
            } catch (error) {
                console.error('Error fetching filter options:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFilterOptions();
    }, [projectId]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onFilterChange({
                search,
                assigneeIds,
                issueTypeIds,
                epicIds,
            });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, assigneeIds, issueTypeIds, epicIds]);

    const handleClearFilters = () => {
        setSearch('');
        setAssigneeIds([]);
        setIssueTypeIds([]);
        setEpicIds([]);
    };

    const hasActiveFilters = search || assigneeIds.length > 0 || issueTypeIds.length > 0 || epicIds.length > 0;
    const activeFilterCount = [
        search ? 1 : 0,
        assigneeIds.length > 0 ? 1 : 0,
        issueTypeIds.length > 0 ? 1 : 0,
        epicIds.length > 0 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    return (
        <Card 
            size="small" 
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: '12px 16px' }}
        >
            <Space wrap size="middle" style={{ width: '100%' }}>
                <Input
                    placeholder={t('issue.filter.search')}
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 220 }}
                    allowClear
                />

                <Divider type="vertical" style={{ height: 32 }} />

                <Select
                    mode="multiple"
                    placeholder={
                        <Space>
                            <UserOutlined />
                            <span>{t('issue.filter.assignee')}</span>
                        </Space>
                    }
                    value={assigneeIds}
                    onChange={setAssigneeIds}
                    style={{ minWidth: 180 }}
                    maxTagCount={1}
                    maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                    loading={loading}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                >
                    {employees.map((emp) => (
                        <Option key={emp.id} value={emp.id}>
                            <Space>
                                <Avatar size="small" icon={<UserOutlined />}>
                                    {emp.full_name?.[0]}
                                </Avatar>
                                {emp.full_name}
                            </Space>
                        </Option>
                    ))}
                </Select>

                <Select
                    mode="multiple"
                    placeholder={
                        <Space>
                            <AppstoreOutlined />
                            <span>{t('issue.filter.issueType')}</span>
                        </Space>
                    }
                    value={issueTypeIds}
                    onChange={setIssueTypeIds}
                    style={{ minWidth: 160 }}
                    maxTagCount={1}
                    maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                    loading={loading}
                    allowClear
                >
                    {issueTypes.map((type) => (
                        <Option key={type.id} value={type.id}>
                            {type.type_name}
                        </Option>
                    ))}
                </Select>

                {epics.length > 0 && (
                    <Select
                        mode="multiple"
                        placeholder={
                            <Space>
                                <FlagOutlined />
                                <span>{t('issue.filter.epic')}</span>
                            </Space>
                        }
                        value={epicIds}
                        onChange={setEpicIds}
                        style={{ minWidth: 160 }}
                        maxTagCount={1}
                        maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
                        loading={loading}
                        allowClear
                    >
                        {epics.map((epic) => (
                            <Option key={epic.id} value={epic.id}>
                                {epic.epic_name}
                            </Option>
                        ))}
                    </Select>
                )}

                <Divider type="vertical" style={{ height: 32 }} />

                {hasActiveFilters && (
                    <Tooltip title={t('issue.filter.clearAllTooltip')}>
                        <Button
                            icon={<ClearOutlined />}
                            onClick={handleClearFilters}
                            type="text"
                            danger
                        >
                            {t('issue.filter.clearAll')}
                        </Button>
                    </Tooltip>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {hasActiveFilters && (
                        <Badge count={activeFilterCount} size="small">
                            <Tag icon={<FilterOutlined />} color="blue">
                                {t('issue.filter.filtering')}
                            </Tag>
                        </Badge>
                    )}
                    <Tag color={hasActiveFilters ? 'orange' : 'default'}>
                        {filteredCount !== undefined ? (
                            t('issue.filter.filteredCount', {
                                filtered: filteredCount,
                                total: totalIssues
                            })
                        ) : (
                            t('issue.filter.issueCount', { count: totalIssues })
                        )}
                    </Tag>
                </div>
            </Space>
        </Card>
    );
};

export const useFilteredBoardData = (
    boardData: any,
    filters: BoardFilterValues
) => {
    if (!boardData) return { filteredData: null, totalIssues: 0, filteredCount: 0 };

    const { columnMap, orderedColumnIds } = boardData;
    let totalIssues = 0;
    let filteredCount = 0;

    const filteredColumnMap: Record<string, any> = {};

    for (const columnId of orderedColumnIds) {
        const column = columnMap[columnId];
        const originalItems = column.items || [];
        totalIssues += originalItems.length;

        let filteredItems = [...originalItems];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filteredItems = filteredItems.filter(
                (item: any) =>
                    item.issueId?.toLowerCase().includes(searchLower) ||
                    item.summary?.toLowerCase().includes(searchLower) ||
                    item.name?.toLowerCase().includes(searchLower) ||
                    (item.assignees && item.assignees.some((a: any) => 
                        a.full_name?.toLowerCase().includes(searchLower)
                    ))
            );
        }

        if (filters.assigneeIds.length > 0) {
            filteredItems = filteredItems.filter((item: any) => {
                if (item.assignees && Array.isArray(item.assignees) && item.assignees.length > 0) {
                    return item.assignees.some((a: any) => filters.assigneeIds.includes(a.id));
                }
                return false;
            });
        }

        if (filters.issueTypeIds.length > 0) {
            filteredItems = filteredItems.filter((item: any) => {
                return filters.issueTypeIds.includes(item.issue_type_id);
            });
        }

        if (filters.epicIds.length > 0) {
            filteredItems = filteredItems.filter((item: any) => {
                return item.epic_link_id && filters.epicIds.includes(item.epic_link_id);
            });
        }

        filteredCount += filteredItems.length;

        filteredColumnMap[columnId] = {
            ...column,
            items: filteredItems,
        };
    }

    return {
        filteredData: {
            ...boardData,
            columnMap: filteredColumnMap,
        },
        totalIssues,
        filteredCount,
    };
};