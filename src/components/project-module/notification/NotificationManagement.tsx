'use client';

import React, { useEffect, useState } from 'react';
import {
    Card,
    Typography,
    Spin,
    message,
    Space,
    Tag,
    Button,
    Descriptions,
    Divider,
} from 'antd';
import {
    BellOutlined,
    ReloadOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ProjectNotificationConfig } from './ProjectNotificationConfig';
import {
    notificationManagementService,
    NotificationScheme,
    EventGroup,
} from '@/lib/api/services/project-module/notification-management.service';
import { projectService, Project } from '@/lib/api/services/project-module/project.service';

const { Title, Text } = Typography;

type NotificationManagementProps = {
    projectId: number;
};

export const NotificationManagement: React.FC<NotificationManagementProps> = ({ projectId }) => {
    const { t } = useTranslation();
    const [project, setProject] = useState<Project | null>(null);
    const [scheme, setScheme] = useState<NotificationScheme | null>(null);
    const [events, setEvents] = useState<EventGroup[]>([]);
    const [availableEvents, setAvailableEvents] = useState<string[]>([]);
    const [availableRecipients, setAvailableRecipients] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch project and notification config
    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch project
            const projectData = await projectService.getById(projectId);
            setProject(projectData);

            // Fetch notification scheme của project
            if (projectData.notification_scheme_id) {
                const [schemeData, eventsData, allEvents, recipients] = await Promise.all([
                    notificationManagementService.getSchemeById(projectData.notification_scheme_id),
                    notificationManagementService.getSchemeEventsGrouped(projectData.notification_scheme_id),
                    notificationManagementService.getAllAvailableEvents(),
                    notificationManagementService.getAvailableRecipientTypes(),
                ]);

                setScheme(schemeData);
                setEvents(eventsData);
                setAvailableEvents(allEvents);
                setAvailableRecipients(recipients);
            } else {
                message.warning(t('notification.messages.noSchemeWarning'));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error(t('notification.messages.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [projectId]);

    // Handle recipient toggle
    const handleRecipientToggle = async (
        eventName: string,
        recipientType: string,
        checked: boolean
    ) => {
        if (!scheme) return;

        try {
            if (checked) {
                await notificationManagementService.bulkAddRecipients({
                    notification_scheme_id: scheme.id,
                    event_name: eventName,
                    recipient_types: [recipientType],
                });
                message.success(t('notification.messages.addSuccess', {
                    recipient: recipientType,
                    event: eventName
                }));
            } else {
                await notificationManagementService.bulkRemoveRecipients({
                    notification_scheme_id: scheme.id,
                    event_name: eventName,
                    recipient_types: [recipientType],
                });
                message.success(t('notification.messages.removeSuccess', {
                    recipient: recipientType,
                    event: eventName
                }));
            }
            fetchData();
        } catch (error) {
            console.error('Error toggling recipient:', error);
            message.error(t('notification.messages.updateError'));
        }
    };

    if (!project) {
        return (
            <div style={{ padding: '24px' }}>
                <Spin tip={t('notification.loading')} />
            </div>
        );
    }

    if (!scheme) {
        return (
            <div style={{ padding: '24px' }}>
                <Card>
                    <Space direction="vertical" align="center" style={{ width: '100%', padding: '40px 0' }}>
                        <InfoCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                        <Title level={4}>{t('notification.scheme.noScheme')}</Title>
                        <Text type="secondary">
                            {t('notification.scheme.noSchemeDescription')}
                        </Text>
                        <Text type="secondary">
                            {t('notification.scheme.contactAdmin')}
                        </Text>
                    </Space>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Spin spinning={loading}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Header */}
                    <Card>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Space direction="vertical" size="small">
                                <Title level={3} style={{ margin: 0 }}>
                                    <BellOutlined /> {t('notification.title')}
                                </Title>
                                <Text type="secondary">
                                    {t('notification.emailSettings')} {project.project_name}
                                </Text>
                            </Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchData}
                                loading={loading}
                            >
                                {t('notification.refresh')}
                            </Button>
                        </div>
                    </Card>

                    {/* Project & Scheme Info */}
                    <Card size="small" title={t('notification.projectInfo.title')}>
                        <Descriptions column={2} size="small">
                            <Descriptions.Item label={t('notification.projectInfo.projectName')}>
                                <Text strong>{project.project_name}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('notification.projectInfo.projectKey')}>
                                <Tag color="blue">{project.project_key}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('notification.projectInfo.notificationScheme')} span={2}>
                                <Space>
                                    <Tag color="green">{scheme.scheme_name}</Tag>
                                    {scheme.scheme_description && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {scheme.scheme_description}
                                        </Text>
                                    )}
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('notification.projectInfo.totalEvents')} span={2}>
                                <Space split={<Divider type="vertical" />}>
                                    <Text>
                                        {t('notification.projectInfo.configured')}: <Tag color="blue">{events.length}</Tag>
                                    </Text>
                                    <Text>
                                        {t('notification.projectInfo.totalRules')}:{' '}
                                        <Tag color="cyan">
                                            {events.reduce((sum, e) => sum + e.recipients.length, 0)}
                                        </Tag>
                                    </Text>
                                </Space>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Notification Configuration */}
                    <ProjectNotificationConfig
                        events={events}
                        availableEvents={availableEvents}
                        availableRecipients={availableRecipients}
                        onRecipientToggle={handleRecipientToggle}
                        loading={loading}
                    />
                </Space>
            </Spin>
        </div>
    );
};