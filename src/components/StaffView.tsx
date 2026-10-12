import React, { useState } from 'react';
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Lock,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfile, UserRole } from '../types';

export const StaffView: React.FC = () => {
  const {
    staffList,
    updateStaffMember,
    addStaffMember,
    deleteStaffMember,
    currentUser,
    setCurrentUser,
    auditLogs,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'staff' | 'audit'>('staff');
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    role: UserRole;
    phone: string;
    pin: string;
    canViewProfits: boolean;
    canViewCOGS: boolean;
    canEditPrices: boolean;
    canOverrideStock: boolean;
    canManageStaff: boolean;
    canViewAuditLogs: boolean;
    canManageSettings: boolean;
    canProcessReturns: boolean;
  }>({
    name: '',
    role: 'cashier',
    phone: '',
    pin: '',
    canViewProfits: false,
    canViewCOGS: false,
    canEditPrices: false,
    canOverrideStock: false,
    canManageStaff: false,
    canViewAuditLogs: false,
    canManageSettings: false,
    canProcessReturns: true,
  });

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      role: 'cashier',
      phone: '',
      pin: '',
      canViewProfits: false,
      canViewCOGS: false,
      canEditPrices: false,
      canOverrideStock: false,
      canManageStaff: false,
      canViewAuditLogs: false,
      canManageSettings: false,
      canProcessReturns: true,
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (staff: UserProfile) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      role: staff.role,
      phone: staff.phone,
      pin: staff.pin || '',
      ...staff.permissions,
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const permissions = {
      canViewProfits: formData.canViewProfits,
      canViewCOGS: formData.canViewCOGS,
      canEditPrices: formData.canEditPrices,
      canOverrideStock: formData.canOverrideStock,
      canManageStaff: formData.canManageStaff,
      canViewAuditLogs: formData.canViewAuditLogs,
      canManageSettings: formData.canManageSettings,
      canProcessReturns: formData.canProcessReturns,
    };

    const cleanPin = (formData.pin || '').replace(/\D/g, '').slice(0, 6);
    if (editingStaff) {
      updateStaffMember({
        ...editingStaff,
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        permissions,
        ...(cleanPin.length >= 4 ? { pin: cleanPin } : {}),
        ...(cleanPin.length > 0 && cleanPin.length < 4 ? { pin: editingStaff.pin } : {}),
        ...(cleanPin.length === 0 ? { pin: undefined } : {}),
      });
    } else {
      addStaffMember({
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        permissions,
        ...(cleanPin.length >= 4 ? { pin: cleanPin } : {}),
      });
    }

    setIsAddEditModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-white">
              إدارة الموظفين ونظام الصلاحيات (RBAC)
            </h2>
            <p className="text-xs text-slate-400">
              فصل صلاحيات الكاشير عن المدير والمالك لمنع تسريب أرقام الأرباح والتحكم الصارم في الأسعار وسجل التدقيق.
            </p>
          </div>
        </div>

        {currentUser.permissions.canManageStaff && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
        )}
      </div>

      {/* Role Demonstration Switcher Alert */}
      <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>جرّب التبديل الآن بين حساب المالك والكاشير:</strong> لاحظ كيف تختفي هوامش الأرباح وتكاليف الشراء تلقائياً عند الدخول بحساب الكاشير.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {staffList.map((st) => (
            <button
              key={st.id}
              onClick={() => setCurrentUser(st)}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                currentUser.id === st.id
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <User className="w-3 h-3" />
              <span>{st.name.split(' ')[0]} ({st.role === 'owner' ? 'المدير' : 'كاشير'})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
            activeTab === 'staff'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          فريق العمل والصلاحيات ({staffList.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          سجل التدقيق المالي والأمني ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Staff Cards & Permissions */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((staff) => (
            <div
              key={staff.id}
              className={`bg-slate-900 border rounded-2xl p-4 space-y-3.5 shadow-lg transition ${
                currentUser.id === staff.id
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                    {staff.name}
                    {currentUser.id === staff.id && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                        أنت
                      </span>
                    )}
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">{staff.phone}</span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    staff.role === 'owner'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : staff.role === 'cashier'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {staff.role === 'owner'
                    ? 'المالك / المدير'
                    : staff.role === 'cashier'
                    ? 'كاشير مبيعات'
                    : 'أمين مخزن'}
                </span>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-1.5 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">
                  الصلاحيات المفعلة:
                </span>

                <div className="flex items-center justify-between text-slate-300">
                  <span>الاطلاع على صافي الأرباح:</span>
                  {staff.permissions.canViewProfits ? (
                    <span className="text-emerald-400 font-bold">مسموح</span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> محجوب
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>تكلفة الشراء (COGS):</span>
                  {staff.permissions.canViewCOGS ? (
                    <span className="text-emerald-400 font-bold">مسموح</span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> محجوب
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>تعديل أسعار المنتجات:</span>
                  {staff.permissions.canEditPrices ? (
                    <span className="text-emerald-400 font-bold">مسموح</span>
                  ) : (
                    <span className="text-slate-500">غير مسموح</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>إرجاع الفواتير:</span>
                  {staff.permissions.canProcessReturns ? (
                    <span className="text-emerald-400 font-bold">مسموح</span>
                  ) : (
                    <span className="text-slate-500">غير مسموح</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>تجاوز المخزون بالسالب:</span>
                  {staff.permissions.canOverrideStock ? (
                    <span className="text-amber-400 font-bold">مسموح</span>
                  ) : (
                    <span className="text-slate-500">ممنوع</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {currentUser.permissions.canManageStaff && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(staff)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل الصلاحيات</span>
                    </button>
                    {currentUser.id !== staff.id && (
                      <button
                        onClick={() => {
                          if (confirm(`تشيل ${staff.name} من الموظفين نهائياً؟`)) {
                            const r = deleteStaffMember(staff.id);
                            if (!r.ok) alert(r.message);
                          }
                        }}
                        title="حذف الموظف"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            سجل التدقيق العملياتي (سجل غير قابل للتعديل لتوثيق جميع العمليات المالية والمخزنية)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">المستخدم والمنصب</th>
                  <th className="p-3">نوع العملية</th>
                  <th className="p-3">تفاصيل الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-[11px] text-slate-400">{log.timestamp}</td>
                    <td className="p-3">
                      <span className="font-semibold text-white block">{log.userName}</span>
                      <span className="text-[10px] text-slate-500">
                        {log.role === 'owner' ? 'المالك' : log.role === 'cashier' ? 'كاشير' : 'أمين مخزن'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-950 border border-slate-800 text-emerald-400 px-2 py-0.5 rounded font-bold text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-sans leading-relaxed">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto text-slate-100 text-xs shadow-2xl">
            <h3 className="font-extrabold text-base text-white">
              {editingStaff ? 'تعديل صلاحيات الموظف' : 'إضافة موظف جديد'}
            </h3>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">اسم الموظف:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    الرمز السري (4-6 أرقام — اختياري 🔒):
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder="اتركه فاضي = دخول بدون رمز"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none font-mono tracking-widest"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    لو حطيتو: التبديل ليه بطلب الرمز — زي ما الكاشير ما يبقى مالك بضغطة
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">الدور الوظيفي الأساسي:</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setFormData({
                        ...formData,
                        role: newRole,
                        canViewProfits: newRole === 'owner',
                        canViewCOGS: newRole === 'owner' || newRole === 'storekeeper',
                        canEditPrices: newRole === 'owner',
                        canManageStaff: newRole === 'owner',
                        canViewAuditLogs: newRole === 'owner',
                        canManageSettings: newRole === 'owner',
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="owner">المالك / المدير العام (كافة الصلاحيات المالية)</option>
                    <option value="cashier">كاشير ومبيعات (حجب الأرباح والأسعار المقيدة)</option>
                    <option value="storekeeper">أمين مخزن (الجرد والتوريد والتوالف)</option>
                  </select>
                </div>
              </div>

              {/* Granular Permission Toggles */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <span className="font-bold text-white block mb-1">
                  تخصيص الصلاحيات المستقلة للموظف:
                </span>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canViewProfits}
                    onChange={(e) => setFormData({ ...formData, canViewProfits: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500"
                  />
                  <span>رؤية صافي الأرباح والتقارير المالية الحساسة</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canViewCOGS}
                    onChange={(e) => setFormData({ ...formData, canViewCOGS: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500"
                  />
                  <span>رؤية أسعار الشراء وتكلفة البضاعة (COGS)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canEditPrices}
                    onChange={(e) => setFormData({ ...formData, canEditPrices: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500"
                  />
                  <span>تعديل أسعار بيع المنتجات بالمخزون</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canProcessReturns}
                    onChange={(e) => setFormData({ ...formData, canProcessReturns: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500"
                  />
                  <span>تسجيل مرتجعات الفواتير</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canOverrideStock}
                    onChange={(e) => setFormData({ ...formData, canOverrideStock: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500"
                  />
                  <span>تجاوز حد المخزون والبيع في حالة النفاد</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  حفظ الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
