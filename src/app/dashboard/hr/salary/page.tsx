'use client';

import { useState, useEffect } from 'react';
import { notification } from 'antd';
import { DollarSign, Calendar, User, Calculator, CheckCircle2, Clock, XCircle, Loader2, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { salaryCalculationService, EmployeeSalary, SalaryStatus } from '@/lib/api/services/salary-calculation.service';
import { employeeService, Employee } from '@/lib/api/services/employee.service';

export default function SalaryPage() {
  const [notificationApi, contextHolder] = notification.useNotification();
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [calculating, setCalculating] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<EmployeeSalary | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, action: '' });

  useEffect(() => {
    loadEmployees();
    loadSalaries();
  }, []);

  useEffect(() => {
    loadSalaries();
  }, [selectedYear, selectedMonth]);

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getAll({ pageSize: 1000 });
      const employeesList = Array.isArray(response) ? response : (response?.data || []);
      setEmployees(employeesList);
    } catch (err: any) {
      console.error('Error loading employees:', err);
      setEmployees([]);
    }
  };

  const loadSalaries = async () => {
    try {
      setLoading(true);
      const data = await salaryCalculationService.getSalariesByMonth(selectedYear, selectedMonth);
      setSalaries(data);
      
      // Tự động bỏ chọn các bản ghi đã được duyệt
      setSelectedIds(prev => {
        const newSelected = new Set(prev);
        data.forEach(salary => {
          if (salary.status !== SalaryStatus.PENDING) {
            newSelected.delete(salary.id);
          }
        });
        return newSelected;
      });
    } catch (err: any) {
      console.error('Error loading salaries:', err);
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateSalary = async () => {
    try {
      setCalculating(true);
      const results = await salaryCalculationService.calculateAll(selectedYear, selectedMonth);
      notificationApi.success({
        message: 'Thành công',
        description: `Đã tính lương thành công cho ${results.length} nhân viên`,
      });
      loadSalaries();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tính lương';
      notificationApi.error({
        message: 'Lỗi',
        description: errorMessage,
        duration: 5,
      });
    } finally {
      setCalculating(false);
    }
  };

  const approveSalary = async (id: number) => {
    try {
      await salaryCalculationService.approve(id);
      notificationApi.success({
        message: 'Thành công',
        description: 'Đã duyệt lương',
      });
      loadSalaries();
    } catch (err: any) {
      notificationApi.error({
        message: 'Lỗi',
        description: err.message || 'Không thể duyệt lương',
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Chỉ chọn những bản ghi có status PENDING
      const pendingSalaries = salaries.filter(s => s.status === SalaryStatus.PENDING);
      setSelectedIds(new Set(pendingSalaries.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    // Chỉ cho phép chọn những bản ghi có status PENDING
    const salary = salaries.find(s => s.id === id);
    if (salary && salary.status !== SalaryStatus.PENDING) {
      return; // Không cho phép chọn bản ghi đã được duyệt
    }

    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const bulkApprove = async () => {
    if (selectedIds.size === 0) {
      notificationApi.warning({
        message: 'Cảnh báo',
        description: 'Vui lòng chọn ít nhất một bản ghi',
      });
      return;
    }

    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    setBulkProgress({ current: 0, total: ids.length, action: 'Đang duyệt lương' });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < ids.length; i++) {
      try {
        await salaryCalculationService.approve(ids[i]);
        successCount++;
      } catch (err: any) {
        failCount++;
        console.error(`Failed to approve salary ${ids[i]}:`, err);
      }
      setBulkProgress({ current: i + 1, total: ids.length, action: 'Đang duyệt lương' });
    }

    setBulkProcessing(false);
    setSelectedIds(new Set());
    setBulkProgress({ current: 0, total: 0, action: '' });

    if (failCount === 0) {
      notificationApi.success({
        message: 'Thành công',
        description: `Đã duyệt thành công ${successCount} bản ghi`,
      });
    } else {
      notificationApi.warning({
        message: 'Hoàn thành',
        description: `Đã duyệt thành công ${successCount} bản ghi, thất bại ${failCount} bản ghi`,
      });
    }

    loadSalaries();
  };

  const approveAll = async () => {
    try {
      setBulkProcessing(true);
      setBulkProgress({ current: 0, total: 1, action: 'Đang duyệt tất cả lương trong tháng' });
      
      const result = await salaryCalculationService.approveAll(selectedYear, selectedMonth);
      
      setBulkProcessing(false);
      setBulkProgress({ current: 0, total: 0, action: '' });

      if (result.failed === 0) {
        notificationApi.success({
          message: 'Thành công',
          description: `Đã duyệt thành công ${result.approved} bản ghi`,
        });
      } else {
        notificationApi.warning({
          message: 'Hoàn thành',
          description: `Đã duyệt thành công ${result.approved} bản ghi, thất bại ${result.failed} bản ghi`,
        });
      }

      loadSalaries();
    } catch (err: any) {
      setBulkProcessing(false);
      setBulkProgress({ current: 0, total: 0, action: '' });
      notificationApi.error({
        message: 'Lỗi',
        description: err.message || 'Không thể duyệt lương',
      });
    }
  };

  const getStatusBadge = (status: SalaryStatus) => {
    switch (status) {
      case SalaryStatus.PENDING:
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Chờ duyệt
          </span>
        );
      case SalaryStatus.APPROVED:
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Đã duyệt
          </span>
        );
      case SalaryStatus.PAID:
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Đã thanh toán
          </span>
        );
      case SalaryStatus.CANCELLED:
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            Đã hủy
          </span>
        );
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0';
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit' });
  };

  return (
    <div className="p-6 space-y-6">
      {contextHolder}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8" />
            Quản lý Lương
          </h1>
          <p className="text-gray-600 mt-2">Tính toán và quản lý lương cho nhân viên</p>
        </div>
      </div>

      {/* Filters and Auto Calculation Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Năm
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tháng
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  Tháng {month}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full px-6 py-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Calendar className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">Tính lương tự động</p>
                  <p className="text-xs text-blue-600">Hệ thống sẽ tự động tính lương vào cuối mỗi tháng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng lương tháng</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(salaries.reduce((sum, s) => {
                  // Handle null, undefined, string, or number
                  let value = s.total_salary;
                  if (value === null || value === undefined) {
                    value = 0;
                  } else if (typeof value === 'string') {
                    value = parseFloat(value) || 0;
                  } else {
                    value = Number(value) || 0;
                  }
                  return sum + (isNaN(value) ? 0 : value);
                }, 0))} VNĐ
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Số nhân viên</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{salaries.length}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng lương OT</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(salaries.reduce((sum, s) => {
                  let value = s.overtime_salary;
                  if (value === null || value === undefined) {
                    value = 0;
                  } else if (typeof value === 'string') {
                    value = parseFloat(value) || 0;
                  } else {
                    value = Number(value) || 0;
                  }
                  return sum + (isNaN(value) ? 0 : value);
                }, 0))} VNĐ
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng bảo hiểm</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(salaries.reduce((sum, s) => {
                  let value = s.insurance;
                  if (value === null || value === undefined) {
                    value = 0;
                  } else if (typeof value === 'string') {
                    value = parseFloat(value) || 0;
                  } else {
                    value = Number(value) || 0;
                  }
                  return sum + (isNaN(value) ? 0 : value);
                }, 0))} VNĐ
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {salaries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 Employees by Salary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Top 10 Nhân viên có lương cao nhất</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[...salaries].sort((a, b) => (b.total_salary || 0) - (a.total_salary || 0)).slice(0, 10).map((s) => ({
                name: s.employee?.full_name || `NV${s.employee_id}`,
                salary: s.total_salary || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value) + ' VNĐ'} />
                <Bar dataKey="salary" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Salary Breakdown Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Phân bổ Lương</h3>
            </div>
            {(() => {
              const breakdownData = [
                { 
                  name: 'Lương cơ bản', 
                  value: salaries.reduce((sum, s) => {
                    const value = s.base_salary ?? 0;
                    return sum + (isNaN(value) ? 0 : Number(value));
                  }, 0) 
                },
                { 
                  name: 'Lương OT', 
                  value: salaries.reduce((sum, s) => {
                    const value = s.overtime_salary ?? 0;
                    return sum + (isNaN(value) ? 0 : Number(value));
                  }, 0) 
                },
                { 
                  name: 'Phụ cấp', 
                  value: salaries.reduce((sum, s) => {
                    const value = s.allowance ?? 0;
                    return sum + (isNaN(value) ? 0 : Number(value));
                  }, 0) 
                },
                { 
                  name: 'Thưởng', 
                  value: salaries.reduce((sum, s) => {
                    const value = s.bonus ?? 0;
                    return sum + (isNaN(value) ? 0 : Number(value));
                  }, 0) 
                },
              ].filter((item) => item.value > 0);

              if (breakdownData.length === 0) {
                return (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <p>Chưa có dữ liệu để hiển thị</p>
                  </div>
                );
              }

              return (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={breakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {breakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value) + ' VNĐ'} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>
      )}

      {/* Salary List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Bảng lương tháng {selectedMonth}/{selectedYear}
          </h2>
          <span className="text-sm text-gray-600">
            Tổng: {salaries.length} nhân viên
          </span>
          </div>
          
          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-900">
                Đã chọn: {selectedIds.size} bản ghi
              </span>
              <button
                onClick={bulkApprove}
                disabled={bulkProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Duyệt đã chọn
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Bỏ chọn
              </button>
            </div>
          )}

          {/* Approve All Button */}
          {salaries.some(s => s.status === SalaryStatus.PENDING) && (
            <div className="mb-4">
              <button
                onClick={approveAll}
                disabled={bulkProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Duyệt tất cả lương trong tháng
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {bulkProcessing && bulkProgress.total > 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{bulkProgress.action}</span>
                <span className="text-sm text-gray-600">
                  {bulkProgress.current} / {bulkProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : salaries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Chưa có bảng lương nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={(() => {
                        const pendingSalaries = salaries.filter(s => s.status === SalaryStatus.PENDING);
                        return pendingSalaries.length > 0 && pendingSalaries.every(s => selectedIds.has(s.id));
                      })()}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lương cơ bản
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày làm việc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OT (giờ)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phụ cấp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bảo hiểm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng lương
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaries.map((salary) => (
                  <tr key={salary.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(salary.id)}
                        onChange={(e) => handleSelectOne(salary.id, e.target.checked)}
                        disabled={salary.status !== SalaryStatus.PENDING}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {salary.employee?.full_name || `ID: ${salary.employee_id}`}
                      <br />
                      <span className="text-xs text-gray-500">{salary.employee?.employee_code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(salary.base_salary)} VNĐ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {salary.work_days || 0} ngày
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {salary.overtime_hours || 0} giờ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(salary.allowance)} VNĐ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(salary.insurance)} VNĐ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(salary.total_salary)} VNĐ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(salary.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedSalary(salary)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Chi tiết
                      </button>
                      {salary.status === SalaryStatus.PENDING && (
                        <button
                          onClick={() => approveSalary(salary.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Duyệt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Salary Detail Modal */}
      {selectedSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Chi tiết Lương</h3>
              <button
                onClick={() => setSelectedSalary(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nhân viên</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedSalary.employee?.full_name || `ID: ${selectedSalary.employee_id}`}
                    </p>
                    <p className="text-sm text-gray-500">{selectedSalary.employee?.employee_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tháng/Năm</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(selectedSalary.month)}</p>
                    <div className="mt-2">{getStatusBadge(selectedSalary.status)}</div>
                  </div>
                </div>
              </div>

              {/* Work Summary */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Tổng quan công việc</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Số ngày làm việc</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedSalary.work_days || 0} ngày</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Số giờ làm việc</p>
                    <p className="text-2xl font-bold text-green-600">{selectedSalary.work_hours || 0} giờ</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Ngày nghỉ có phép</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedSalary.approved_leave_days || 0} ngày</p>
                  </div>
                </div>
              </div>

              {/* Overtime */}
              {selectedSalary.overtime_hours && selectedSalary.overtime_hours > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Làm thêm giờ</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Số giờ OT</p>
                      <p className="text-xl font-bold text-orange-600">{selectedSalary.overtime_hours} giờ</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Lương OT</p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatCurrency(selectedSalary.overtime_salary)} VNĐ
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Salary Breakdown */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Chi tiết lương</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Lương cơ bản</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(selectedSalary.base_salary)} VNĐ
                    </span>
                  </div>
                  {selectedSalary.allowance && selectedSalary.allowance > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Phụ cấp</span>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(selectedSalary.allowance)} VNĐ
                      </span>
                    </div>
                  )}
                  {selectedSalary.bonus && selectedSalary.bonus > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Thưởng</span>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(selectedSalary.bonus)} VNĐ
                      </span>
                    </div>
                  )}
                  {selectedSalary.overtime_salary && selectedSalary.overtime_salary > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Lương OT</span>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(selectedSalary.overtime_salary)} VNĐ
                      </span>
                    </div>
                  )}
                  {selectedSalary.insurance && selectedSalary.insurance > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Bảo hiểm (BHXH, BHYT, BHTN)</span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(selectedSalary.insurance)} VNĐ
                      </span>
                    </div>
                  )}
                  {selectedSalary.deduction && selectedSalary.deduction > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Khấu trừ khác</span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(selectedSalary.deduction)} VNĐ
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold text-gray-900">Tổng lương thực nhận</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(selectedSalary.total_salary)} VNĐ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

