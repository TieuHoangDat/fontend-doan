'use client';

import React from 'react';
import {
    Card,
    Space,
    Tag,
    Checkbox,
    Typography,
    Empty,
    Alert,
} from 'antd';
import {
    BellOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { EventGroup } from '@/lib/api/services/project-module/notification-management.service';

const { Text } = Typography;

type ProjectNotificationConfigProps = {
    events: EventGroup[];
    availableEvents: string[];
    availableRecipients: string[];
    onRecipientToggle: (eventName: string, recipientType: string, checked: boolean) => void;
    loading: boolean;
};

export const ProjectNotificationConfig: React.FC<ProjectNotificationConfigProps> = ({
    events,
    availableEvents,
    availableRecipients,
    onRecipientToggle,
    loading,
}) => {
    const { t } = useTranslation();

    // Get recipient types for an event
    const getEventRecipients = (eventName: string): Set<string> => {
        const event = events.find((e) => e.event_name === eventName);
        if (!event) return new Set();
        return new Set(event.recipients.map((r) => r.recipient_type));
    };

    // Get event color
    const getEventColor = (eventName: string): string => {
        if (eventName.includes('Created')) return 'green';
        if (eventName.includes('Updated')) return 'blue';
        if (eventName.includes('Assigned')) return 'cyan';
        if (eventName.includes('Commented')) return 'purple';
        if (eventName.includes('Status')) return 'orange';
        if (eventName.includes('Resolved')) return 'success';
        if (eventName.includes('Closed')) return 'default';
        return 'blue';
    };

    // Get event icon
    const getEventIcon = (eventName: string) => {
        if (eventName.includes('Created')) return '🆕';
        if (eventName.includes('Updated')) return '✏️';
        if (eventName.includes('Assigned')) return '👤';
        if (eventName.includes('Commented')) return '💬';
        if (eventName.includes('Status')) return '🔄';
        if (eventName.includes('Resolved')) return '✅';
        if (eventName.includes('Closed')) return '🔒';
        if (eventName.includes('Work')) return '⏱️';
        return '📧';
    };

    if (availableEvents.length === 0) {
        return (
            <Card>
                <Empty description={t('notification.events.noEvents')} />
            </Card>
        );
    }

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Info Alert */}
            <Alert
                message={t('notification.emailSettings')}
                description={t('notification.selectRecipients')}
                type="info"
                showIcon
                icon={<BellOutlined />}
            />

            {/* Event Configuration Cards */}
            {availableEvents.map((eventName) => {
                const eventRecipients = getEventRecipients(eventName);
                const hasRecipients = eventRecipients.size > 0;

                return (
                    <Card
                        key={eventName}
                        size="small"
                        style={{
                            border: hasRecipients ? '1px solid #d9d9d9' : '1px dashed #d9d9d9',
                            background: hasRecipients ? '#ffffff' : '#fafafa',
                        }}
                    >
                        {/* Event Header */}
                        <div style={{ marginBottom: 12 }}>
                            <Space>
                                <span style={{ fontSize: 20 }}>{getEventIcon(eventName)}</span>
                                <Tag color={getEventColor(eventName)} style={{ margin: 0 }}>
                                    {eventName}
                                </Tag>
                                {hasRecipients && (
                                    <>
                                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {t('notification.events.configured', { count: eventRecipients.size })}
                                        </Text>
                                    </>
                                )}
                                {!hasRecipients && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {t('notification.events.noRecipients')}
                                    </Text>
                                )}
                            </Space>
                        </div>

                        {/* Recipients Checkboxes */}
                        <div style={{ paddingLeft: 36 }}>
                            <Space wrap size="middle">
                                {availableRecipients.map((recipientType) => {
                                    const isChecked = eventRecipients.has(recipientType);
                                    return (
                                        <Checkbox
                                            key={recipientType}
                                            checked={isChecked}
                                            onChange={(e: CheckboxChangeEvent) =>
                                                onRecipientToggle(
                                                    eventName,
                                                    recipientType,
                                                    e.target.checked
                                                )
                                            }
                                            disabled={loading}
                                        >
                                            <Tag
                                                color={isChecked ? 'blue' : 'default'}
                                                style={{
                                                    margin: 0,
                                                    cursor: 'pointer',
                                                    fontWeight: isChecked ? 500 : 400,
                                                }}
                                            >
                                                {recipientType}
                                            </Tag>
                                        </Checkbox>
                                    );
                                })}
                            </Space>
                        </div>
                    </Card>
                );
            })}

            {/* Summary Card */}
            <Card size="small" style={{ background: '#f0f5ff', border: '1px solid #adc6ff' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>
                        <BellOutlined /> {t('notification.summary.title')}
                    </Text>
                    <Space split={<span style={{ color: '#d9d9d9' }}>•</span>}>
                        <Text type="secondary">
                            {t('notification.summary.totalEvents')}: <strong>{availableEvents.length}</strong>
                        </Text>
                        <Text type="secondary">
                            {t('notification.summary.configured')}: <strong>{events.length}</strong>
                        </Text>
                        <Text type="secondary">
                            {t('notification.summary.activeRecipients')}:{' '}
                            <strong>{events.reduce((sum, e) => sum + e.recipients.length, 0)}</strong>
                        </Text>
                    </Space>
                </Space>
            </Card>
        </Space>
    );
};