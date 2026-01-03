'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { issueService, IssueType, WorkflowStatus } from '@/lib/api/services/project-module/issue.service';
import { useAuth } from '@/hooks/useAuth';

const { TextArea } = Input;
const { Option } = Select;

interface CreateIssueModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (issue: any) => void;
    projectId: number;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
    visible,
    onClose,
    onSuccess,
    projectId,
}) => {
    const { t } = useTranslation();
	const { user } = useAuth();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
    const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [loadingStatuses, setLoadingStatuses] = useState(false);

    const fetchIssueTypes = async () => {
        try {
            setLoadingTypes(true);
            const data = await issueService.getIssueTypes(projectId);
            setIssueTypes(data);
        } catch (error) {
            // Error fetching issue types
            message.error(t('issue.messages.loadTypeFailed'));
        } finally {
            setLoadingTypes(false);
        }
    };

	// Fetch Workflow Statuses
	const fetchStatuses = async (workflowId: number) => {
		try {
			setLoadingStatuses(true);
			const data = await issueService.getWorkflowStatuses(workflowId, projectId);
			setStatuses(data);
		} catch (error) {
			// Error fetching statuses
			message.error('Không thể tải danh sách trạng thái');
		} finally {
			setLoadingStatuses(false);
		}
	};

    useEffect(() => {
        if (visible) {
            fetchIssueTypes();
            fetchStatuses(1);
        }
    }, [visible]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

			// Prepare data for API
			if (!user?.id) {
				message.error('Không tìm thấy thông tin người dùng');
				return;
			}

			const createData = {
				project_id: projectId,
				issue_type_id: values.issue_type_id,
				current_status_id: values.current_status_id,
				summary: values.summary,
				reporter_id: user.id,
				issue_code: '', // Issue code sẽ được tạo tự động ở backend
			};

            const data = await issueService.create(createData);

            message.success(t('issue.messages.createSuccess'));
            onSuccess(data);
            form.resetFields();
            onClose();
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error('Error creating issue:', error);
            message.error(t('issue.messages.createFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title={t('issue.createIssue')}
            open={visible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            confirmLoading={loading}
            okText={t('issue.actions.create')}
            cancelText={t('issue.actions.cancel')}
            width={600}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                preserve={false}
            >
                <Form.Item
                    label={t('issue.form.summary')}
                    name="summary"
                    rules={[
                        { required: true, message: t('issue.form.summaryRequired') },
                        { max: 255, message: t('issue.form.summaryMax') },
                    ]}
                >
                    <TextArea
                        placeholder={t('issue.form.summaryPlaceholder')}
                        rows={3}
                        maxLength={255}
                        showCount
                    />
                </Form.Item>

                <Form.Item
                    label={t('issue.form.type')}
                    name="issue_type_id"
                    rules={[{ required: true, message: t('issue.form.typeRequired') }]}
                >
                    <Select
                        placeholder={t('issue.form.typePlaceholder')}
                        loading={loadingTypes}
                    >
                        {issueTypes.map((type) => (
                            <Option key={type.id} value={type.id}>
                                {type.type_name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label={t('issue.form.status')}
                    name="current_status_id"
                    rules={[{ required: true, message: t('issue.form.statusRequired') }]}
                >
                    <Select
                        placeholder={t('issue.form.statusPlaceholder')}
                        loading={loadingStatuses}
                    >
                        {statuses.map((status) => (
                            <Option key={status.id} value={status.id}>
                                {status.status_name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};