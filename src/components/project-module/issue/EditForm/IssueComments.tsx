'use client';

import React, { useEffect, useState } from 'react';
import {
    List,
    Input,
    Button,
    Avatar,
    Space,
    Typography,
    Popconfirm,
    message,
    Spin,
    Empty,
} from 'antd';
import {
    UserOutlined,
    SendOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { issueService, IssueComment } from '@/lib/api/services/project-module/issue.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Text } = Typography;

type Comment = {
    id: number;
    issue_id: number;
    employee_id: number;
    content: string;
    created_at: string;
    employee?: {
        id: number;
        full_name: string;
        email: string;
    };
};

type IssueCommentsProps = {
    issueId: number;
    currentEmployeeId?: number;
};

export const IssueComments: React.FC<IssueCommentsProps> = ({
    issueId,
    currentEmployeeId = 1,
}) => {
    const { t, i18n } = useTranslation();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    // Set dayjs locale based on i18n language
    useEffect(() => {
        dayjs.locale(i18n.language === 'vi' ? 'vi' : 'en');
    }, [i18n.language]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const data = await issueService.getComments(issueId);
            setComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
            message.error(t('issue.comments.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateComment = async () => {
        if (!newComment.trim()) {
            message.warning(t('issue.comments.contentRequired'));
            return;
        }

        try {
            setSubmitting(true);
            await issueService.createComment(issueId, currentEmployeeId, newComment);
            message.success(t('issue.comments.createSuccess'));
            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error('Error creating comment:', error);
            message.error(t('issue.comments.createFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateComment = async (commentId: number) => {
        if (!editContent.trim()) {
            message.warning(t('issue.comments.contentRequired'));
            return;
        }

        try {
            await issueService.updateComment(issueId, commentId, editContent);
            message.success(t('issue.comments.updateSuccess'));
            setEditingId(null);
            setEditContent('');
            fetchComments();
        } catch (error) {
            console.error('Error updating comment:', error);
            message.error(t('issue.comments.updateFailed'));
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            await issueService.deleteComment(issueId, commentId);
            message.success(t('issue.comments.deleteSuccess'));
            fetchComments();
        } catch (error) {
            console.error('Error deleting comment:', error);
            message.error(t('issue.comments.deleteFailed'));
        }
    };

    const startEditing = (comment: Comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditContent('');
    };

    useEffect(() => {
        if (issueId) {
            fetchComments();
        }
    }, [issueId]);

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '70%',
            minHeight: 430 
        }}>
            <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                marginBottom: 16,
                paddingRight: 8 
            }}>
                <Spin spinning={loading}>
                    {comments.length === 0 ? (
                        <Empty
                            description={t('issue.comments.noComments')}
                            style={{ marginTop: 60 }}
                        />
                    ) : (
                        <List
                            dataSource={comments}
                            renderItem={(comment) => (
                                <List.Item
                                    key={comment.id}
                                    style={{ 
                                        padding: '12px 0',
                                        borderBottom: '1px solid #f0f0f0' 
                                    }}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar 
                                                icon={<UserOutlined />} 
                                                style={{ backgroundColor: '#1890ff' }}
                                            >
                                                {comment.employee?.full_name?.[0]}
                                            </Avatar>
                                        }
                                        title={
                                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                <Space>
                                                    <Text strong>
                                                        {comment.employee?.full_name || 'Unknown'}
                                                    </Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {dayjs(comment.created_at).fromNow()}
                                                    </Text>
                                                </Space>
                                                {comment.employee_id === currentEmployeeId && (
                                                    <Space size="small">
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            icon={<EditOutlined />}
                                                            onClick={() => startEditing(comment)}
                                                        />
                                                        <Popconfirm
                                                            title={t('issue.comments.deleteConfirm')}
                                                            onConfirm={() => handleDeleteComment(comment.id)}
                                                            okText={t('issue.comments.delete')}
                                                            cancelText={t('issue.comments.cancel')}
                                                        >
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                            />
                                                        </Popconfirm>
                                                    </Space>
                                                )}
                                            </Space>
                                        }
                                        description={
                                            editingId === comment.id ? (
                                                <Space direction="vertical" style={{ width: '100%' }}>
                                                    <TextArea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        rows={3}
                                                        autoFocus
                                                    />
                                                    <Space>
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            onClick={() => handleUpdateComment(comment.id)}
                                                        >
                                                            {t('issue.comments.save')}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            onClick={cancelEditing}
                                                        >
                                                            {t('issue.comments.cancel')}
                                                        </Button>
                                                    </Space>
                                                </Space>
                                            ) : (
                                                <Text style={{ whiteSpace: 'pre-wrap' }}>
                                                    {comment.content}
                                                </Text>
                                            )
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </Spin>
            </div>

            <div style={{ 
                borderTop: '1px solid #f0f0f0', 
                paddingTop: 16 
            }}>
                <Space.Compact style={{ width: '100%' }} direction="vertical">
                    <TextArea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('issue.comments.writeComment')}
                        rows={3}
                        onPressEnter={(e) => {
                            if (e.ctrlKey || e.metaKey) {
                                handleCreateComment();
                            }
                        }}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        loading={submitting}
                        onClick={handleCreateComment}
                        style={{ marginTop: 0, alignSelf: 'flex-end' }}
                    >
                        {t('issue.comments.addComment')}
                    </Button>
                </Space.Compact>
            </div>
        </div>
    );
};