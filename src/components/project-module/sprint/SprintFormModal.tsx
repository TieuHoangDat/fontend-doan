'use client';

import React, { useEffect, useState } from 'react';
import {
    Modal,
    Form,
    Input,
    DatePicker,
    InputNumber,
    Select,
    Button,
    message,
    Space,
} from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Sprint } from './sprint.types';
import { sprintService, CreateSprintDto, UpdateSprintDto } from '@/lib/api/services/project-module/sprint.service';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

type SprintFormModalProps = {
    visible: boolean;
    sprint: Sprint | null;
    projectId: number;
    onClose: () => void;
    onSuccess: () => void;
};

export const SprintFormModal: React.FC<SprintFormModalProps> = ({
    visible,
    sprint,
    projectId,
    onClose,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const isEditing = !!sprint;

    useEffect(() => {
        if (visible && sprint) {
            form.setFieldsValue({
                sprint_name: sprint.sprint_name,
                goal: sprint.goal,
                dateRange: sprint.start_date && sprint.end_date 
                    ? [dayjs(sprint.start_date), dayjs(sprint.end_date)]
                    : null,
                duration_days: sprint.duration_days,
                status: sprint.status,
            });
        } else if (visible) {
            form.resetFields();
            form.setFieldValue('status', 'planning');
        }
    }, [visible, sprint, form]);

    const handleSubmit = async (values: any) => {
        try {
            setSubmitting(true);

            const submitData: CreateSprintDto | UpdateSprintDto = {
                project_id: projectId,
                sprint_name: values.sprint_name,
                goal: values.goal,
                start_date: values.dateRange?.[0]?.format('YYYY-MM-DD') || null,
                end_date: values.dateRange?.[1]?.format('YYYY-MM-DD') || null,
                duration_days: values.duration_days,
                status: values.status,
            };

            if (isEditing) {
                await sprintService.update(sprint.id, submitData);
                message.success(t('sprint.messages.updateSuccess'));
            } else {
                await sprintService.create(submitData as CreateSprintDto);
                message.success(t('sprint.messages.createSuccess'));
            }

            form.resetFields();
            onSuccess();
        } catch (error: any) {
            console.error('Error saving sprint:', error);
            if (error.response?.status === 400) {
                message.error(error.response.data.message || t('sprint.messages.invalidData'));
            } else {
                message.error(t('sprint.messages.saveFailed'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    const handleDateChange = (dates: any) => {
        if (dates && dates[0] && dates[1]) {
            const duration = dates[1].diff(dates[0], 'days');
            form.setFieldValue('duration_days', duration);
        }
    };

    return (
        <Modal
            open={visible}
            title={
                <Space>
                    <RocketOutlined />
                    <span>{isEditing ? t('sprint.form.editTitle') : t('sprint.form.title')}</span>
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
                <Form.Item
                    name="sprint_name"
                    label={t('sprint.form.sprintName')}
                    rules={[
                        { required: true, message: t('sprint.form.sprintNameRequired') },
                        { max: 255, message: t('sprint.form.sprintNameMax') },
                    ]}
                >
                    <Input placeholder={t('sprint.form.sprintNamePlaceholder')} maxLength={255} />
                </Form.Item>

                <Form.Item name="goal" label={t('sprint.form.sprintGoal')}>
                    <TextArea
                        rows={3}
                        placeholder={t('sprint.form.sprintGoalPlaceholder')}
                        maxLength={1000}
                        showCount
                    />
                </Form.Item>

                <Form.Item name="dateRange" label={t('sprint.form.duration')}>
                    <RangePicker
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                        onChange={handleDateChange}
                    />
                </Form.Item>

                <Form.Item
                    name="duration_days"
                    label={t('sprint.form.durationDays')}
                    help={t('sprint.form.durationHelp')}
                >
                    <InputNumber
                        min={1}
                        max={365}
                        placeholder={t('sprint.form.durationDaysPlaceholder')}
                        style={{ width: '100%' }}
                    />
                </Form.Item>

                <Form.Item name="status" label={t('sprint.form.status')}>
                    <Select placeholder={t('sprint.form.statusPlaceholder')}>
                        <Option value="planning">{t('sprint.status.planning')}</Option>
                        <Option value="active">{t('sprint.status.active')}</Option>
                        <Option value="completed">{t('sprint.status.completed')}</Option>
                        <Option value="closed">{t('sprint.status.closed')}</Option>
                    </Select>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                    <Space style={{ float: 'right' }}>
                        <Button onClick={handleCancel}>{t('sprint.buttons.cancel')}</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {isEditing ? t('sprint.buttons.update') : t('sprint.buttons.create')}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};