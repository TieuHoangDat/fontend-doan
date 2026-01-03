'use client';

import React, { useEffect, useState } from 'react';
import {
    Modal,
    Space,
    Row,
    Col,
    Divider,
    Tabs,
    Button,
    Popconfirm,
    message,
    Typography,
    Alert,
} from 'antd';
import {
    DeploymentUnitOutlined,
    CommentOutlined,
    UserOutlined,
    LinkOutlined,
    HistoryOutlined,
    EyeOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IssueEditForm } from './IssueEditForm';
import { IssueAssignees } from './IssueAssignees';
import { IssueWatchers } from './IssueWatchers';
import { IssueComments } from './IssueComments';
import { IssueLinks } from './IssueLinks';
import { IssueHistory } from './IssueHistory';
import { issueService } from '@/lib/api/services/project-module/issue.service';

const { Text } = Typography;

type IssueEditModalProps = {
    issueId: number | null;
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    onDelete?: () => void;
    currentEmployeeId?: number;
};

export const IssueEditModal: React.FC<IssueEditModalProps> = ({
    issueId,
    visible,
    onClose,
    onSuccess,
    onDelete,
    currentEmployeeId = 1,
}) => {
    const { t } = useTranslation();
    const [issueCode, setIssueCode] = useState<string>('');
    const [issueSummary, setIssueSummary] = useState<string>('');
    const [deleting, setDeleting] = useState(false);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

    const handleSuccess = () => {
        onSuccess?.();
        onClose();
    };

    const fetchIssueInfo = async () => {
        if (!issueId) return;
        try {
            const issue = await issueService.getById(issueId);
            setIssueCode(issue.issue_code);
            setIssueSummary(issue.summary);
        } catch (error) {
            // Error fetching issue info - silently fail
        }
    };

    const handleDeleteIssue = async () => {
        if (!issueId) return;

        try {
            setDeleting(true);
            await issueService.delete(issueId);
            message.success(t('issue.editModal.deleteSuccess', { code: issueCode }));
            setDeleteConfirmVisible(false);
            onDelete?.();
            onClose();
            
            // Modal will close and parent will refresh
        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || t('issue.messages.deleteFailed');
            message.error(errorMessage);
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        if (!visible) {
            setIssueCode('');
            setIssueSummary('');
            setDeleteConfirmVisible(false);
        } else if (issueId) {
            fetchIssueInfo();
        }
    }, [visible, issueId]);

    return (
        <>
            <Modal
                open={visible}
                title={
                    <Space>
                        <DeploymentUnitOutlined />
                        <span>
                            {issueCode 
                                ? t('issue.editModal.titleWithCode', { code: issueCode })
                                : t('issue.editModal.title')
                            }
                        </span>
                    </Space>
                }
                onCancel={onClose}
                width={1200}
                centered
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => setDeleteConfirmVisible(true)}
                            loading={deleting}
                        >
                            {t('issue.editModal.deleteIssue')}
                        </Button>

                        <Button onClick={onClose}>
                            {t('issue.editModal.close')}
                        </Button>
                    </div>
                }
                styles={{
                    body: { padding: '16px 24px', maxHeight: '70vh' },
                }}
            >
                <Row gutter={24} style={{ height: '100%' }}>
                    <Col span={14}>
                        <div
                            style={{
                                height: 'calc(70vh - 80px)',
                                overflowY: 'auto',
                                paddingRight: 12,
                            }}
                        >
                            {issueId && (
                                <IssueEditForm
                                    issueId={issueId}
                                    onSuccess={handleSuccess}
                                    onCancel={onClose}
                                />
                            )}
                        </div>
                    </Col>

                    <Col span={1}>
                        <Divider type="vertical" style={{ height: '100%' }} />
                    </Col>

                    <Col span={9}>
                        <div
                            style={{
                                height: 'calc(70vh - 80px)',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <Tabs
                                defaultActiveKey="assignees"
                                style={{ height: '100%' }}
                                items={[
                                    {
                                        key: 'assignees',
                                        label: (
                                            <Space>
                                                <UserOutlined />
                                                <span>{t('issue.tabs.assignees')}</span>
                                            </Space>
                                        ),
                                        children: issueId ? (
                                            <div style={{ height: 'calc(70vh - 130px)', overflowY: 'auto' }}>
                                                <IssueAssignees
                                                    issueId={issueId}
                                                    projectId={1}
                                                />
                                            </div>
                                        ) : null,
                                    },
                                    {
                                        key: 'watchers',
                                        label: (
                                            <Space>
                                                <EyeOutlined />
                                                <span>{t('issue.tabs.watchers')}</span>
                                            </Space>
                                        ),
                                        children: issueId ? (
                                            <div style={{ height: 'calc(70vh - 130px)', overflowY: 'auto' }}>
                                                <IssueWatchers
                                                    issueId={issueId}
                                                    projectId={1}
                                                    currentEmployeeId={currentEmployeeId}
                                                />
                                            </div>
                                        ) : null,
                                    },
                                    {
                                        key: 'links',
                                        label: (
                                            <Space>
                                                <LinkOutlined />
                                                <span>{t('issue.tabs.links')}</span>
                                            </Space>
                                        ),
                                        children: issueId ? (
                                            <div style={{ height: 'calc(70vh - 130px)', overflowY: 'auto' }}>
                                                <IssueLinks
                                                    issueId={issueId}
                                                    projectId={1}
                                                />
                                            </div>
                                        ) : null,
                                    },
                                    {
                                        key: 'comments',
                                        label: (
                                            <Space>
                                                <CommentOutlined />
                                                <span>{t('issue.tabs.comments')}</span>
                                            </Space>
                                        ),
                                        children: issueId ? (
                                            <div style={{ height: 'calc(70vh - 130px)' }}>
                                                <IssueComments
                                                    issueId={issueId}
                                                    currentEmployeeId={currentEmployeeId}
                                                />
                                            </div>
                                        ) : null,
                                    },
                                    {
                                        key: 'history',
                                        label: (
                                            <Space>
                                                <HistoryOutlined />
                                                <span>{t('issue.tabs.history')}</span>
                                            </Space>
                                        ),
                                        children: issueId ? (
                                            <div style={{ height: 'calc(70vh - 130px)', overflowY: 'auto' }}>
                                                <IssueHistory issueId={issueId} />
                                            </div>
                                        ) : null,
                                    },
                                ]}
                            />
                        </div>
                    </Col>
                </Row>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                open={deleteConfirmVisible}
                title={
                    <Space style={{ color: '#ff4d4f' }}>
                        <ExclamationCircleOutlined />
                        <span>{t('issue.editModal.deleteConfirmTitle')}</span>
                    </Space>
                }
                onCancel={() => setDeleteConfirmVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setDeleteConfirmVisible(false)}>
                        {t('issue.editModal.deleteCancel')}
                    </Button>,
                    <Button
                        key="delete"
                        danger
                        type="primary"
                        loading={deleting}
                        onClick={handleDeleteIssue}
                        icon={<DeleteOutlined />}
                    >
                        {t('issue.editModal.deleteConfirm')}
                    </Button>,
                ]}
                width={500}
                centered
            >
                <Alert
                    message={t('issue.editModal.deleteWarning')}
                    description={
                        <div style={{ marginTop: 8 }}>
                            <p>{t('issue.editModal.deleteConfirmMessage')}</p>
                            <div style={{ 
                                background: '#fafafa', 
                                padding: '12px', 
                                borderRadius: '6px',
                                marginTop: '12px',
                                border: '1px solid #f0f0f0'
                            }}>
                                <Text strong>{t('issue.editModal.issue')}:</Text> {issueCode}
                                <br />
                                <Text strong>{t('issue.editModal.summaryLabel')}:</Text> {issueSummary}
                            </div>
                        </div>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <div style={{ 
                    background: '#fff2f0', 
                    padding: '12px', 
                    borderRadius: '6px',
                    border: '1px solid #ffccc7'
                }}>
                    <Text strong style={{ color: '#ff4d4f' }}>
                        {t('issue.editModal.deletedDataWarning')}
                    </Text>
                    <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                        <li>{t('issue.editModal.deletedDataList.assignees')}</li>
                        <li>{t('issue.editModal.deletedDataList.watchers')}</li>
                        <li>{t('issue.editModal.deletedDataList.comments')}</li>
                        <li>{t('issue.editModal.deletedDataList.links')}</li>
                        <li>{t('issue.editModal.deletedDataList.history')}</li>
                        <li>{t('issue.editModal.deletedDataList.sprint')}</li>
                    </ul>
                </div>
            </Modal>
        </>
    );
};