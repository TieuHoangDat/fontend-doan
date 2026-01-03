'use client';

import React, { useEffect, useState } from 'react';
import {
    Card,
    Timeline,
    Space,
    Tag,
    message,
    Spin,
    Typography,
    Avatar,
    Empty,
    Tooltip,
} from 'antd';
import {
    HistoryOutlined,
    UserOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { issueService, IssueChangeHistory } from '@/lib/api/services/project-module/issue.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';

dayjs.extend(relativeTime);

const { Text } = Typography;

type IssueHistoryProps = {
    issueId: number;
};

const getFieldColor = (fieldName: string): string => {
    if (fieldName.includes('created') || fieldName.includes('added')) {
        return 'green';
    }
    if (fieldName.includes('deleted') || fieldName.includes('removed')) {
        return 'red';
    }
    if (fieldName.includes('status')) {
        return 'blue';
    }
    return 'default';
};

const formatTimeValue = (seconds: string | null): string => {
    if (!seconds || seconds === 'null') return '';
    const secs = parseInt(seconds, 10);
    if (isNaN(secs)) return seconds;
    
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

export const IssueHistory: React.FC<IssueHistoryProps> = ({ issueId }) => {
    const { t, i18n } = useTranslation();
    const [history, setHistory] = useState<IssueChangeHistory[]>([]);
    const [loading, setLoading] = useState(false);

    // Set dayjs locale based on i18n language
    useEffect(() => {
        dayjs.locale(i18n.language === 'vi' ? 'vi' : 'en');
    }, [i18n.language]);

    const formatValue = (fieldName: string, value: string | null): React.ReactNode => {
        if (!value || value === 'null') {
            return <Text type="secondary" italic>{t('issue.history.empty')}</Text>;
        }

        if (fieldName.includes('seconds')) {
            const formatted = formatTimeValue(value);
            return formatted || value;
        }

        return value;
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data = await issueService.getHistory(issueId);
            setHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
            message.error(t('issue.history.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (issueId) {
            fetchHistory();
        }
    }, [issueId]);

    const renderChangeContent = (change: IssueChangeHistory) => {
        const fieldLabel = t(`issue.history.fieldLabels.${change.field_name}`, change.field_name);
        const hasChange = change.old_value || change.new_value;

        return (
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space>
                    <Avatar 
                        size="small" 
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#1890ff' }}
                    >
                        {change.changer_employee?.full_name?.[0]}
                    </Avatar>
                    <Text strong style={{ fontSize: 13 }}>
                        {change.changer_employee?.full_name || 'Unknown'}
                    </Text>
                    <Tag color={getFieldColor(change.field_name)}>
                        {fieldLabel}
                    </Tag>
                </Space>

                {hasChange && (
                    <div style={{ marginLeft: 32, fontSize: 12 }}>
                        {change.old_value && (
                            <div>
                                <Text type="secondary">{t('issue.history.from')} </Text>
                                <Text delete type="secondary">
                                    {formatValue(change.field_name, change.old_value)}
                                </Text>
                            </div>
                        )}
                        {change.new_value && (
                            <div>
                                <Text type="secondary">{t('issue.history.to')} </Text>
                                <Text strong style={{ color: '#52c41a' }}>
                                    {formatValue(change.field_name, change.new_value)}
                                </Text>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginLeft: 32 }}>
                    <Tooltip title={dayjs(change.change_date).format('DD/MM/YYYY HH:mm:ss')}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {dayjs(change.change_date).fromNow()}
                        </Text>
                    </Tooltip>
                </div>
            </Space>
        );
    };

    return (
        <Card
            size="small"
            title={
                <Space>
                    <HistoryOutlined />
                    <Text strong>{t('issue.history.title')}</Text>
                    {history.length > 0 && (
                        <Tag color="blue">{history.length}</Tag>
                    )}
                </Space>
            }
            style={{ marginBottom: 16 }}
        >
            <Spin spinning={loading}>
                {history.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={t('issue.history.noHistory')}
                        style={{ padding: '20px 0' }}
                    />
                ) : (
                    <div style={{ maxHeight: 'calc(70vh - 200px)', overflowY: 'auto' }}>
                        <Timeline
                            mode="left"
                            items={history.map((change) => ({
                                color: getFieldColor(change.field_name),
                                children: renderChangeContent(change),
                            }))}
                        />
                    </div>
                )}
            </Spin>
        </Card>
    );
};