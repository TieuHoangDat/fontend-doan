'use client';

import React, { useEffect, useState } from 'react';
import {
    Select,
    Space,
    Typography,
    message,
    Spin,
    Tooltip,
    Tag,
    Input,
    Button,
    Divider,
    Empty,
} from 'antd';
import {
    LinkOutlined,
    CloseOutlined,
    PlusOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { issueService, IssueLinksData } from '@/lib/api/services/project-module/issue.service';

const { Option } = Select;
const { Text } = Typography;

type LinkedIssue = {
    id: number;
    link_type: string;
    issue: {
        id: number;
        issue_code: string;
        summary: string;
        issue_type?: string;
        current_status_id: number;
    };
};

type Issue = {
    id: number;
    issue_code: string;
    summary: string;
    issue_type?: {
        type_name: string;
    };
};

type IssueLinksProps = {
    issueId: number;
    projectId?: number;
};

const LINK_TYPE_CONFIG: Record<string, { color: string }> = {
    blocks: { color: 'red' },
    is_blocked_by: { color: 'red' },
    relates_to: { color: 'blue' },
    duplicates: { color: 'orange' },
    is_duplicated_by: { color: 'orange' },
    causes: { color: 'purple' },
    is_caused_by: { color: 'purple' },
    parent_of: { color: 'green' },
    child_of: { color: 'green' },
};

export const IssueLinks: React.FC<IssueLinksProps> = ({ issueId, projectId = 1 }) => {
    const { t } = useTranslation();
    const [links, setLinks] = useState<IssueLinksData>({ outgoing: [], incoming: [] });
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [availableIssues, setAvailableIssues] = useState<Issue[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLinkType, setSelectedLinkType] = useState<string>('relates_to');
    const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

    const fetchLinks = async () => {
        try {
            setLoading(true);
            const data = await issueService.getLinks(issueId);
            setLinks(data);
        } catch (error) {
            console.error('Error fetching links:', error);
            message.error(t('issue.links.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const searchIssues = async (term: string) => {
        if (!term || term.length < 2) {
            setAvailableIssues([]);
            return;
        }

        try {
            setSearchLoading(true);
            const data = await issueService.getAll({ search: term, projectId });

            const linkedIssueIds = [
                ...links.outgoing.map((l) => l.issue.id),
                ...links.incoming.map((l) => l.issue.id),
                issueId,
            ];
            const filtered = data.filter(
                (issue: Issue) => !linkedIssueIds.includes(issue.id)
            );
            setAvailableIssues(filtered);
        } catch (error) {
            console.error('Error searching issues:', error);
            message.error(t('issue.links.searchFailed'));
        } finally {
            setSearchLoading(false);
        }
    };

    const handleAddLink = async () => {
        if (!selectedIssueId) {
            message.warning(t('issue.links.selectIssue'));
            return;
        }

        try {
            setAdding(true);
            await issueService.createLink(issueId, selectedIssueId, selectedLinkType);
            message.success(t('issue.links.addSuccess'));
            setSelectedIssueId(null);
            setSearchTerm('');
            setAvailableIssues([]);
            fetchLinks();
        } catch (error: any) {
            console.error('Error adding link:', error);
            if (error.response?.status === 400) {
                message.warning(error.response.data.message || t('issue.links.linkExists'));
            } else {
                message.error(t('issue.links.addFailed'));
            }
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveLink = async (linkId: number) => {
        try {
            await issueService.deleteLink(issueId, linkId);
            message.success(t('issue.links.removeSuccess'));
            fetchLinks();
        } catch (error) {
            console.error('Error removing link:', error);
            message.error(t('issue.links.removeFailed'));
        }
    };

    useEffect(() => {
        if (issueId) {
            fetchLinks();
        }
    }, [issueId]);

    const getLinkTypeLabel = (linkType: string, direction: 'outgoing' | 'incoming'): string => {
        // Map inverse relationships for incoming
        const inverseMap: Record<string, string> = {
            blocks: 'is_blocked_by',
            is_blocked_by: 'blocks',
            duplicates: 'is_duplicated_by',
            is_duplicated_by: 'duplicates',
            causes: 'is_caused_by',
            is_caused_by: 'causes',
            parent_of: 'child_of',
            child_of: 'parent_of',
        };

        const effectiveType = direction === 'incoming' && inverseMap[linkType] 
            ? inverseMap[linkType] 
            : linkType;

        return t(`issue.links.linkTypes.${effectiveType}`, effectiveType);
    };

    const renderLink = (link: LinkedIssue, direction: 'outgoing' | 'incoming') => {
        const config = LINK_TYPE_CONFIG[link.link_type] || { color: 'default' };
        const label = getLinkTypeLabel(link.link_type, direction);

        return (
            <div
                key={link.id}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: 4,
                    marginBottom: 8,
                    transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e6f7ff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                }}
            >
                <Space direction="vertical" size={2} style={{ flex: 1 }}>
                    <Space>
                        <Tag color={config.color}>{label}</Tag>
                        <Text strong style={{ fontSize: 13 }}>
                            {link.issue.issue_code}
                        </Text>
                        {link.issue.issue_type && (
                            <Tag style={{ fontSize: 11 }}>{link.issue.issue_type}</Tag>
                        )}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {link.issue.summary}
                    </Text>
                </Space>
                <Tooltip title={t('issue.links.removeLink')}>
                    <CloseOutlined
                        style={{
                            cursor: 'pointer',
                            color: '#ff4d4f',
                            fontSize: 12,
                            marginLeft: 8,
                        }}
                        onClick={() => handleRemoveLink(link.id)}
                    />
                </Tooltip>
            </div>
        );
    };

    return (
        <div>
            <Spin spinning={loading}>
                <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
                    <Text strong style={{ display: 'block', marginBottom: 12 }}>
                        <PlusOutlined /> {t('issue.links.addNewLink')}
                    </Text>

                    <Select
                        style={{ width: '100%', marginBottom: 8 }}
                        value={selectedLinkType}
                        onChange={setSelectedLinkType}
                    >
                        <Option value="relates_to">{t('issue.links.linkTypes.relates_to')}</Option>
                        <Option value="blocks">{t('issue.links.linkTypes.blocks')}</Option>
                        <Option value="is_blocked_by">{t('issue.links.linkTypes.is_blocked_by')}</Option>
                        <Option value="duplicates">{t('issue.links.linkTypes.duplicates')}</Option>
                        <Option value="is_duplicated_by">{t('issue.links.linkTypes.is_duplicated_by')}</Option>
                        <Option value="causes">{t('issue.links.linkTypes.causes')}</Option>
                        <Option value="is_caused_by">{t('issue.links.linkTypes.is_caused_by')}</Option>
                        <Option value="parent_of">{t('issue.links.linkTypes.parent_of')}</Option>
                        <Option value="child_of">{t('issue.links.linkTypes.child_of')}</Option>
                    </Select>

                    <Input
                        placeholder={t('issue.links.searchPlaceholder')}
                        prefix={<SearchOutlined />}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            searchIssues(e.target.value);
                        }}
                        style={{ marginBottom: 8 }}
                    />

                    {searchLoading ? (
                        <div style={{ textAlign: 'center', padding: 8 }}>
                            <Spin size="small" />
                        </div>
                    ) : availableIssues.length > 0 ? (
                        <div
                            style={{
                                maxHeight: 150,
                                overflowY: 'auto',
                                marginBottom: 8,
                                border: '1px solid #d9d9d9',
                                borderRadius: 4,
                            }}
                        >
                            {availableIssues.map((issue) => (
                                <div
                                    key={issue.id}
                                    style={{
                                        padding: '6px 10px',
                                        cursor: 'pointer',
                                        background:
                                            selectedIssueId === issue.id ? '#e6f7ff' : 'white',
                                        borderBottom: '1px solid #f0f0f0',
                                    }}
                                    onClick={() => setSelectedIssueId(issue.id)}
                                >
                                    <Space>
                                        <Text strong style={{ fontSize: 12 }}>
                                            {issue.issue_code}
                                        </Text>
                                        {issue.issue_type && (
                                            <Tag style={{ fontSize: 11 }}>
                                                {issue.issue_type.type_name}
                                            </Tag>
                                        )}
                                    </Space>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {issue.summary}
                                        </Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddLink}
                        loading={adding}
                        disabled={!selectedIssueId}
                        block
                    >
                        {t('issue.links.addLink')}
                    </Button>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                <div>
                    {links.outgoing.length === 0 && links.incoming.length === 0 ? (
                        <Empty description={t('issue.links.noLinks')} style={{ marginTop: 40 }} />
                    ) : (
                        <>
                            {links.outgoing.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                        <LinkOutlined /> {t('issue.links.linkFrom')} ({links.outgoing.length})
                                    </Text>
                                    {links.outgoing.map((link) => renderLink(link, 'outgoing'))}
                                </div>
                            )}

                            {links.incoming.length > 0 && (
                                <div>
                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                        <LinkOutlined /> {t('issue.links.linkTo')} ({links.incoming.length})
                                    </Text>
                                    {links.incoming.map((link) => renderLink(link, 'incoming'))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Spin>
        </div>
    );
};