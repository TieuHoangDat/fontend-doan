'use client';

import React from 'react';
import { Card, Space, Tag, Avatar, Tooltip, Typography, Button } from 'antd';
import { UserOutlined, DragOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Issue } from './sprint.types';

const { Text } = Typography;

type SprintIssueCardProps = {
    issue: Issue;
    isDragging: boolean;
    onEdit?: (issueId: number) => void;
};

export const SprintIssueCard: React.FC<SprintIssueCardProps> = ({ 
    issue, 
    isDragging,
    onEdit,
}) => {
    const { t } = useTranslation();

    return (
        <Card
            size="small"
            style={{
                marginBottom: 8,
                cursor: 'grab',
                opacity: isDragging ? 0.5 : 1,
                border: isDragging ? '2px dashed #1890ff' : '1px solid #d9d9d9',
                transition: 'all 0.2s',
            }}
            bodyStyle={{ padding: '8px 12px' }}
            hoverable
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                }}
            >
                <DragOutlined 
                    style={{ 
                        color: '#8c8c8c', 
                        cursor: 'grab',
                        fontSize: 14,
                        flexShrink: 0,
                    }} 
                />

                <Text 
                    strong 
                    style={{ 
                        fontSize: 13,
                        color: '#1890ff',
                        minWidth: 80,
                        flexShrink: 0,
                    }}
                >
                    {issue.issue_code}
                </Text>

                {issue.issue_type && (
                    <Tag 
                        style={{ 
                            fontSize: 11, 
                            margin: 0,
                            flexShrink: 0,
                        }}
                    >
                        {issue.issue_type.type_name}
                    </Tag>
                )}

                <Text 
                    style={{ 
                        fontSize: 13,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    title={issue.summary}
                >
                    {issue.summary}
                </Text>

                <Space size={8} style={{ flexShrink: 0 }}>
                    {issue.story_points && (
                        <Tag 
                            color="blue" 
                            style={{ 
                                fontSize: 11,
                                margin: 0,
                                fontWeight: 500,
                            }}
                        >
                            {t('sprint.issue.storyPoints', { points: issue.story_points })}
                        </Tag>
                    )}

                    {issue.assignees && issue.assignees.length > 0 && (
                        <Avatar.Group 
                            maxCount={3} 
                            size="small"
                            maxStyle={{ 
                                backgroundColor: '#1890ff',
                                fontSize: 11,
                            }}
                        >
                            {issue.assignees.map((assignee, index) => (
                                <Tooltip key={index} title={assignee.full_name}>
                                    <Avatar
                                        size={24}
                                        icon={<UserOutlined />}
                                        style={{ 
                                            backgroundColor: '#1890ff',
                                            fontSize: 12,
                                        }}
                                    >
                                        {assignee.full_name[0]}
                                    </Avatar>
                                </Tooltip>
                            ))}
                        </Avatar.Group>
                    )}

                    {onEdit && (
                        <Tooltip title={t('sprint.issue.editIssue')}>
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(issue.id);
                                }}
                                style={{
                                    padding: '0 8px',
                                    height: 24,
                                }}
                            />
                        </Tooltip>
                    )}
                </Space>
            </div>
        </Card>
    );
};