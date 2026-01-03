'use client';

import { useState, useMemo } from 'react';
import { Modal, Input, Button, Table, Tag, Empty, Space } from 'antd';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import FolderKanban from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { Project } from '@/lib/api/services/project-module/project.service';

interface AllProjectsModalProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  loading?: boolean;
}

export const AllProjectsModal: React.FC<AllProjectsModalProps> = ({
  open,
  onClose,
  projects,
  loading = false,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!searchText.trim()) return projects;

    const lowerSearch = searchText.toLowerCase();
    return projects.filter(
      (project) =>
        project.project_key.toLowerCase().includes(lowerSearch) ||
        project.project_name.toLowerCase().includes(lowerSearch) ||
        project.project_description?.toLowerCase().includes(lowerSearch) ||
        project.lead_employee?.full_name?.toLowerCase().includes(lowerSearch)
    );
  }, [projects, searchText]);

  const handleNavigateToProject = (projectId: number) => {
    router.push(`/dashboard/projects/${projectId}/summary`);
    onClose();
  };

  const columns: ColumnsType<Project> = [
    {
      title: t('project.table.projectKey'),
      dataIndex: 'project_key',
      key: 'project_key',
      width: 120,
      render: (text) => (
        <Tag
          icon={<FolderKanban className="w-3 h-3" />}
          color="blue"
          style={{ fontSize: '12px', fontWeight: 'bold' }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: t('project.table.projectName'),
      dataIndex: 'project_name',
      key: 'project_name',
      ellipsis: true,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: t('project.table.description'),
      dataIndex: 'project_description',
      key: 'project_description',
      ellipsis: true,
      render: (text) => (
        <span className="text-gray-500 text-sm">
          {text || <span className="text-gray-300">{t('project.table.noDescription')}</span>}
        </span>
      ),
    },
    {
      title: t('project.table.lead'),
      dataIndex: ['lead_employee', 'full_name'],
      key: 'lead',
      width: 150,
      render: (text) => (
        <span className="text-sm">{text || <span className="text-gray-300">—</span>}</span>
      ),
    },
    {
      title: t('project.table.action'),
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<ArrowRightOutlined />}
          onClick={() => handleNavigateToProject(record.id)}
        >
          {t('project.table.open')}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-blue-600" />
          <span className="text-lg font-semibold">{t('project.allProjects')}</span>
          <Tag color="blue">{t('project.search.totalProjects', { count: projects.length })}</Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      bodyStyle={{ padding: 0 }}
    >
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <Input
          placeholder={t('project.search.placeholder')}
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="large"
          allowClear
        />
        {searchText && (
          <div className="mt-2 text-sm text-gray-500">
            {t('project.search.found', { count: filteredProjects.length })}
          </div>
        )}
      </div>

      {/* Projects Table */}
      <div style={{ maxHeight: '500px', overflow: 'auto' }}>
        <Table
          columns={columns}
          dataSource={filteredProjects}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => t('project.pagination.total', { count: total }),
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchText ? (
                    <span>
                      {t('project.search.noResults', { query: searchText })}
                    </span>
                  ) : (
                    t('project.noProjects')
                  )
                }
              />
            ),
          }}
          onRow={(record) => ({
            onClick: () => handleNavigateToProject(record.id),
            style: { cursor: 'pointer' },
            className: 'hover:bg-blue-50 transition-colors',
          })}
        />
      </div>
    </Modal>
  );
};