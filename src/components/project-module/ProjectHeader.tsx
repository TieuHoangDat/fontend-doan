'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, Tabs, Skeleton, Tag, Space, Typography, Avatar, Tooltip } from 'antd';
import {
    RocketOutlined,
    FlagOutlined,
    AppstoreOutlined,
    UserOutlined,
    CalendarOutlined,
    InfoCircleOutlined,
    TeamOutlined,
    SafetyOutlined,
    BellOutlined,
    BarChartOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { projectService, Project } from '@/lib/api/services/project-module/project.service';

const { Text, Title } = Typography;

interface ProjectHeaderProps {
    projectId: number;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ projectId }) => {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true);
                const data = await projectService.getById(projectId);
                setProject(data);
            } catch (error) {
                console.error('Error fetching project:', error);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchProject();
        }
    }, [projectId]);

    const getActiveTab = () => {
        if (pathname.includes('/summary')) return 'summary';
        if (pathname.includes('/sprints')) return 'sprint';
        if (pathname.includes('/boards')) return 'boards';
        if (pathname.includes('/epics')) return 'epics';
        if (pathname.includes('/team')) return 'team';
        if (pathname.includes('/roles')) return 'roles';
        if (pathname.includes('/notifications')) return 'notifications';
        return 'sprint';
    };

    const handleTabChange = (key: string) => {
        switch (key) {
            case 'summary':
                router.push(`/dashboard/projects/${projectId}/summary`);
                break;
            case 'sprint':
                router.push(`/dashboard/projects/${projectId}/sprints`);
                break;
            case 'boards':
                router.push(`/dashboard/projects/${projectId}/boards`);
                break;
            case 'epics':
                router.push(`/dashboard/projects/${projectId}/epics`);
                break;
            case 'team':
                router.push(`/dashboard/projects/${projectId}/team`);
                break;
            case 'roles':
                router.push(`/dashboard/projects/${projectId}/roles`);
                break;
            case 'notifications':
                router.push(`/dashboard/projects/${projectId}/notifications`);
                break;
        }
    };

    if (loading) {
        return (
            <Card style={{ marginBottom: 16 }}>
                <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
        );
    }

    if (!project) {
        return null;
    }

    const tabItems = [
        {
            key: 'summary',
            label: (
                <Space>
                    <BarChartOutlined />
                    <span>{t('projectHeader.tabs.summary')}</span>
                </Space>
            ),
        },
        {
            key: 'sprint',
            label: (
                <Space>
                    <RocketOutlined />
                    <span>{t('projectHeader.tabs.sprintBacklog')}</span>
                </Space>
            ),
        },
        {
            key: 'boards',
            label: (
                <Space>
                    <AppstoreOutlined />
                    <span>{t('projectHeader.tabs.board')}</span>
                </Space>
            ),
        },
        {
            key: 'epics',
            label: (
                <Space>
                    <FlagOutlined />
                    <span>{t('projectHeader.tabs.epics')}</span>
                </Space>
            ),
        },
        {
            key: 'team',
            label: (
                <Space>
                    <TeamOutlined />
                    <span>{t('projectHeader.tabs.team')}</span>
                </Space>
            ),
        },
        {
            key: 'roles',
            label: (
                <Space>
                    <SafetyOutlined />
                    <span>{t('projectHeader.tabs.roles')}</span>
                </Space>
            ),
        },
        {
            key: 'notifications',
            label: (
                <Space>
                    <BellOutlined />
                    <span>{t('projectHeader.tabs.notifications')}</span>
                </Space>
            ),
        },
    ];

    return (
        <Card 
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 0 }}
        >
            {/* Project Info Section */}
            <div style={{ 
                padding: '16px 24px', 
                borderBottom: '1px solid #f0f0f0',
                background: 'linear-gradient(to right, #fafafa, #ffffff)',
            }}>
                <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                    <Space size="middle">
                        {/* Project Key Badge */}
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 16,
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        }}>
                            {project.project_key.substring(0, 2).toUpperCase()}
                        </div>

                        {/* Project Details */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <Space direction="vertical" size={2}>
                                <Space size="small">
                                    <Tag color="blue">{project.project_key}</Tag>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <CalendarOutlined /> {t('projectHeader.project')}
                                    </Text>
                                </Space>
                                <Title level={4} style={{ margin: 0 }}>
                                    {project.project_name}
                                </Title>
                            </Space>
                        </div>

                        {/* Project Lead */}
                        {project.lead_employee && (
                            <Space>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('projectHeader.lead')}:
                                </Text>
                                <Tooltip title={project.lead_employee.email}>
                                    <Space size="small">
                                        <Avatar 
                                            size="small" 
                                            icon={<UserOutlined />}
                                            style={{ 
                                                background: '#1890ff',
                                                fontSize: 12,
                                            }}
                                        >
                                            {project.lead_employee.full_name?.[0]?.toUpperCase()}
                                        </Avatar>
                                        <Text strong style={{ fontSize: 13 }}>
                                            {project.lead_employee.full_name}
                                        </Text>
                                    </Space>
                                </Tooltip>
                            </Space>
                        )}

                        {/* Additional Info Icon */}
                        <Tooltip title={t('projectHeader.viewDetails')}>
                            <InfoCircleOutlined 
                                style={{ 
                                    fontSize: 16, 
                                    color: '#8c8c8c',
                                    cursor: 'pointer',
                                }}
                            />
                        </Tooltip>
                    </Space>
                </Space>
            </div>

            {/* Navigation Tabs */}
            <Tabs
                activeKey={getActiveTab()}
                onChange={handleTabChange}
                items={tabItems}
                style={{ 
                    paddingLeft: 24,
                    paddingRight: 24,
                    marginBottom: 0,
                }}
                tabBarStyle={{
                    marginBottom: 0,
                }}
            />
        </Card>
    );
};