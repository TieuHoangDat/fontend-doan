'use client';

import React, { useEffect, useState } from 'react';
import {
    Form,
    Input,
    Select,
    InputNumber,
    Space,
    Tag,
    Spin,
    Row,
    Col,
    Button,
    message,
} from 'antd';
import {
    UserOutlined,
    TagOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { issueService, Issue, IssueType, WorkflowStatus, Employee } from '@/lib/api/services/project-module/issue.service';
import { epicService } from '@/lib/api/services/project-module/epic.service';

const { TextArea } = Input;
const { Option } = Select;

export type IssueDetail = {
    id: number;
    project_id: number;
    issue_type_id: number;
    summary: string;
    issue_code: string;
    description: string | null;
    current_status_id: number;
    reporter_id: number;
    epic_link_id: number | null;
    story_points: number | null;
    original_estimate_seconds: number | null;
    time_spent_seconds: number | null;
    resolution: string | null;
    issue_type?: {
        id: number;
        type_name: string;
    };
    reporter?: {
        id: number;
        full_name: string;
    };
    epic_link?: {
        id: number;
        epic_name: string;
    };
    project?: {
        id: number;
        project_name: string;
    };
};

type Epic = {
    id: number;
    epic_name: string;
};

type IssueEditFormProps = {
    issueId: number;
    onSuccess?: () => void;
    onCancel?: () => void;
};

export const IssueEditForm: React.FC<IssueEditFormProps> = ({
    issueId,
    onSuccess,
    onCancel,
}) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
    const [epics, setEpics] = useState<Epic[]>([]);
    const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [issue, setIssue] = useState<IssueDetail | null>(null);

    const fetchIssueDetail = async (id: number) => {
        try {
            setLoading(true);
            const issueData = await issueService.getById(id);
            setIssue(issueData);

            form.setFieldsValue({
                summary: issueData.summary,
                description: issueData.description,
                issue_type_id: issueData.issue_type_id,
                current_status_id: issueData.current_status_id,
                reporter_id: issueData.reporter_id,
                epic_link_id: issueData.epic_link_id,
                story_points: issueData.story_points,
                original_estimate_seconds: issueData.original_estimate_seconds
                    ? Math.floor(issueData.original_estimate_seconds / 3600)
                    : null,
                resolution: issueData.resolution,
            });
        } catch (error) {
            console.error('Error fetching issue:', error);
            message.error(t('issue.messages.loadInfoFailed'));
        } finally {
            setLoading(false);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const types = await issueService.getIssueTypes(issue?.project_id || 1);
            const employees = await issueService.getProjectEmployees(issue?.project_id || 1);

            setIssueTypes(types);
            setEmployees(employees);

            if (issue?.project_id) {
                const epics = await epicService.getAll({ projectId: issue.project_id });
                setEpics(epics);

                const statuses = await issueService.getWorkflowStatuses(1, issue.project_id);
                setStatuses(statuses);
            }
        } catch (error) {
            console.error('Error fetching reference data:', error);
            message.error(t('issue.messages.loadRefDataFailed'));
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setSubmitting(true);

            const submitData = {
                ...values,
                original_estimate_seconds: values.original_estimate_seconds
                    ? values.original_estimate_seconds * 3600
                    : null,
            };

            await issueService.update(issueId, submitData);

            message.success(t('issue.messages.updateSuccess'));
            onSuccess?.();
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error('Error updating issue:', error);
            message.error(t('issue.messages.updateFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (issueId) {
            fetchIssueDetail(issueId);
        }
    }, [issueId]);

    useEffect(() => {
        if (issue) {
            fetchReferenceData();
        }
    }, [issue]);

    return (
        <Spin spinning={loading}>
            {issue?.project && (
                <div
                    style={{
                        marginBottom: 16,
                        padding: 12,
                        background: '#f5f5f5',
                        borderRadius: 6,
                    }}
                >
                    <Space>
                        <Tag color="blue">{t('issue.details.project')}: {issue.project.project_name}</Tag>
                        <Tag color="purple">{t('issue.details.issueCode')}: {issue.issue_code}</Tag>
                    </Space>
                </div>
            )}

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    name="summary"
                    label={t('issue.form.summary')}
                    rules={[
                        { required: true, message: t('issue.form.summaryRequired') },
                        { max: 255, message: t('issue.form.summaryMax') },
                    ]}
                >
                    <Input placeholder={t('issue.form.summaryPlaceholder')} maxLength={255} />
                </Form.Item>

                <Form.Item name="description" label={t('issue.form.description')}>
                    <TextArea rows={3} placeholder={t('issue.form.descriptionPlaceholder')} />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="issue_type_id"
                            label={t('issue.form.type')}
                            rules={[{ required: true, message: t('issue.form.typeRequired') }]}
                        >
                            <Select
                                placeholder={t('issue.form.typePlaceholder')}
                                loading={issueTypes.length === 0}
                            >
                                {issueTypes.map((type) => (
                                    <Option key={type.id} value={type.id}>
                                        {type.type_name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            name="current_status_id"
                            label={t('issue.form.status')}
                            rules={[{ required: true, message: t('issue.form.statusRequired') }]}
                        >
                            <Select
                                placeholder={t('issue.form.statusPlaceholder')}
                                loading={statuses.length === 0}
                            >
                                {statuses.map((status) => (
                                    <Option key={status.id} value={status.id}>
                                        {status.status_name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="reporter_id"
                    label={t('issue.form.reporter')}
                    rules={[{ required: true, message: t('issue.form.reporterRequired') }]}
                >
                    <Select
                        placeholder={t('issue.form.reporterPlaceholder')}
                        showSearch
                        optionFilterProp="children"
                        loading={employees.length === 0}
                    >
                        {employees.map((emp) => (
                            <Option key={emp.id} value={emp.id}>
                                <Space>
                                    <UserOutlined />
                                    {emp.full_name}
                                </Space>
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item name="epic_link_id" label={t('issue.form.epic')}>
                    <Select
                        placeholder={t('issue.form.epicPlaceholder')}
                        allowClear
                        loading={epics.length === 0 && issue?.project_id !== undefined}
                    >
                        {epics.map((epic) => (
                            <Option key={epic.id} value={epic.id}>
                                <Space>
                                    <TagOutlined />
                                    {epic.epic_name}
                                </Space>
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="story_points" label={t('issue.form.storyPoints')}>
                            <InputNumber
                                min={0}
                                max={100}
                                placeholder={t('issue.form.storyPointsPlaceholder')}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item 
                            name="original_estimate_seconds" 
                            label={t('issue.form.estimatedTimeLabel')}
                        >
                            <InputNumber
                                min={0}
                                step={0.5}
                                placeholder={t('issue.form.estimatedTimePlaceholder')}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="resolution" label={t('issue.form.resolution')}>
                    <Input placeholder={t('issue.form.resolutionPlaceholder')} />
                </Form.Item>

                <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                    <Space>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={submitting}
                        >
                            {t('issue.messages.saveChanges')}
                        </Button>
                        <Button onClick={onCancel}>
                            {t('issue.actions.cancel')}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Spin>
    );
};