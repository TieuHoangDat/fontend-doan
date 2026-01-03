'use client';

import React, { useEffect, useState } from 'react';
import {
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    Button,
    message,
    Space,
} from 'antd';
import { FlagOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { epicService, Epic, CreateEpicDto, UpdateEpicDto } from '@/lib/api/services/project-module/epic.service';
import { Project } from '@/lib/api/services/project-module/project.service';

const { TextArea } = Input;
const { Option } = Select;

type EpicFormModalProps = {
    visible: boolean;
    epic: Epic | null;
    projects: Project[];
    onClose: () => void;
    onSuccess: () => void;
};

export const EpicFormModal: React.FC<EpicFormModalProps> = ({
    visible,
    epic,
    projects,
    onClose,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const isEditing = !!epic;

    useEffect(() => {
        if (visible && epic) {
            form.setFieldsValue({
                project_id: epic.project_id,
                epic_name: epic.epic_name,
                goal: epic.goal,
                status: epic.status,
                start_date: epic.start_date ? dayjs(epic.start_date) : null,
                due_date: epic.due_date ? dayjs(epic.due_date) : null,
            });
        } else if (visible) {
            form.resetFields();
        }
    }, [visible, epic, form]);

    const handleSubmit = async (values: any) => {
        try {
            setSubmitting(true);

            const submitData: CreateEpicDto | UpdateEpicDto = {
                ...values,
                start_date: values.start_date
                    ? values.start_date.format('YYYY-MM-DD')
                    : null,
                due_date: values.due_date
                    ? values.due_date.format('YYYY-MM-DD')
                    : null,
            };

            if (isEditing) {
                await epicService.update(epic.id, submitData);
                message.success(t('epic.messages.updateSuccess'));
            } else {
                await epicService.create(submitData as CreateEpicDto);
                message.success(t('epic.messages.createSuccess'));
            }

            form.resetFields();
            onSuccess();
        } catch (error: any) {
            console.error('Error saving epic:', error);
            if (error.response?.status === 400) {
                message.error(error.response.data.message || t('common.messages.error.generic'));
            } else {
                message.error(t('common.messages.error.generic'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            open={visible}
            title={
                <Space>
                    <FlagOutlined />
                    <span>{isEditing ? t('epic.editEpic') : t('epic.createEpic')}</span>
                </Space>
            }
            onCancel={handleCancel}
            width={600}
            footer={null}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                style={{ marginTop: 16 }}
            >
                {/* Project */}
                <Form.Item
                    name="project_id"
                    label={t('epic.form.project')}
                    rules={[{ required: true, message: t('epic.form.projectRequired') }]}
                >
                    <Select
                        placeholder={t('epic.form.projectPlaceholder')}
                        showSearch
                        optionFilterProp="children"
                    >
                        {projects.map((project) => (
                            <Option key={project.id} value={project.id}>
                                {project.project_name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {/* Epic Name */}
                <Form.Item
                    name="epic_name"
                    label={t('epic.form.epicName')}
                    rules={[
                        { required: true, message: t('epic.form.epicNameRequired') },
                        { max: 255, message: t('epic.form.epicNameMax') },
                    ]}
                >
                    <Input placeholder={t('epic.form.epicNamePlaceholder')} maxLength={255} />
                </Form.Item>

                {/* Goal */}
                <Form.Item name="goal" label={t('epic.form.goal')}>
                    <TextArea
                        rows={3}
                        placeholder={t('epic.form.goalPlaceholder')}
                        maxLength={1000}
                        showCount
                    />
                </Form.Item>

                {/* Status */}
                <Form.Item name="status" label={t('epic.form.status')}>
                    <Select placeholder={t('epic.form.statusPlaceholder')} allowClear>
                        <Option value="Planning">{t('epic.status.planning')}</Option>
                        <Option value="In Progress">{t('epic.status.inProgress')}</Option>
                        <Option value="On Hold">{t('epic.status.onHold')}</Option>
                        <Option value="Done">{t('epic.status.done')}</Option>
                        <Option value="Cancelled">{t('epic.status.cancelled')}</Option>
                    </Select>
                </Form.Item>

                {/* Dates */}
                <Space style={{ width: '100%' }} size="large">
                    <Form.Item
                        name="start_date"
                        label={t('epic.form.startDate')}
                        style={{ flex: 1, marginBottom: 0 }}
                    >
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item
                        name="due_date"
                        label={t('epic.form.dueDate')}
                        style={{ flex: 1, marginBottom: 0 }}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const startDate = getFieldValue('start_date');
                                    if (!value || !startDate) {
                                        return Promise.resolve();
                                    }
                                    if (value.isBefore(startDate)) {
                                        return Promise.reject(
                                            new Error(t('epic.form.dueDateError'))
                                        );
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                </Space>

                {/* Footer Buttons */}
                <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                    <Space style={{ float: 'right' }}>
                        <Button onClick={handleCancel}>
                            {t('epic.buttons.cancel')}
                        </Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {isEditing ? t('epic.buttons.update') : t('epic.buttons.create')}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};