import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  History,
  Edit2,
  Trash2,
  PackagePlus,
  Scale,
  MapPin,
  Lock,
  ArrowUpDown,
  BookOpen,
  Eye,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, BusinessType, UnitConversion } from '../types';
import { SUDANESE_UNITS } from '../data/initialData';

export const InventoryView: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    currentUser,
    businessType,
    priceHistories,
    stockMovements,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'movements' | 'units_guide'>('products');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isStockAdjustModalOpen, setIsStockAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<'purchase' | 'adjustment' | 'waste'>('purchase');
  const [adjustNote, setAdjustNote] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    code: string;
    nameAr: string;
    categoryAr: string;
    purchasePrice: number;
    sellingPrice: number;
    currentStock: number;
    minStockAlert: number;
    baseUnit: string;
    shelfLocation: string;
    businessType: BusinessType;
    aliasesText: string;
    allowedUnits: UnitConversion[];
    extraExpiry?: string;
    extraBatch?: string;
    extraVehicle?: string;
  }>({
    code: '',
    nameAr: '',
    categoryAr: 'مواد تموينية',
    purchasePrice: 1000,
    sellingPrice: 1300,
    currentStock: 50,
    minStockAlert: 10,
    baseUnit: 'كيلوجرام',
    shelfLocation: 'الرف الرئيسي',
    businessType: businessType,
    aliasesText: '',
    allowedUnits: [],
  });

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shelfLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryAr === selectedCategory;
    const matchesLowStock = !onlyLowStock || p.currentStock <= p.minStockAlert;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const categories = Array.from(new Set(products.map((p) => p.categoryAr)));

  // Permissions & Read-Only Logic
  const canEditPrices = currentUser.role === 'owner' || currentUser.permissions.canEditPrices;
  const canManageStock = currentUser.role === 'owner' || currentUser.permissions.canOverrideStock;
  const canDeleteProduct = currentUser.role === 'owner';
  const isReadOnly = !canEditPrices || currentUser.role === 'cashier';

  // Open modal for add
  const handleOpenAdd = () => {
    if (!canEditPrices) return;
    setEditingProduct(null);
    setFormData({
      code: Math.floor(1000000 + Math.random() * 9000000).toString(),
      nameAr: '',
      categoryAr: 'مواد تموينية',
      purchasePrice: 1000,
      sellingPrice: 1300,
      currentStock: 50,
      minStockAlert: 10,
      baseUnit: 'كيلوجرام',
      shelfLocation: 'الرف أ-1',
      businessType,
      aliasesText: '',
      allowedUnits: [
        { unitId: 'ratl', unitName: 'رطل', conversionFactor: 0.45, customPrice: 650 },
      ],
    });
    setIsAddEditModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      code: p.code,
      nameAr: p.nameAr,
      categoryAr: p.categoryAr,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      baseUnit: p.baseUnit,
      shelfLocation: p.shelfLocation,
      businessType: p.businessType,
      aliasesText: (p.aliases || []).join(', '),
      allowedUnits: p.allowedUnits || [],
      extraExpiry: p.extraFields?.expiryDate,
      extraBatch: p.extraFields?.batchNumber,
      extraVehicle: p.extraFields?.vehicleModel,
    });
    setIsAddEditModalOpen(true);
  };

  // Save product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const aliases = formData.aliasesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const extraFields: any = {};
    if (formData.extraExpiry) extraFields.expiryDate = formData.extraExpiry;
    if (formData.extraBatch) extraFields.batchNumber = formData.extraBatch;
    if (formData.extraVehicle) extraFields.vehicleModel = formData.extraVehicle;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        code: formData.code,
        nameAr: formData.nameAr,
        categoryAr: formData.categoryAr,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        currentStock: Number(formData.currentStock),
        minStockAlert: Number(formData.minStockAlert),
        baseUnit: formData.baseUnit,
        shelfLocation: formData.shelfLocation,
        businessType: formData.businessType,
        aliases,
        allowedUnits: formData.allowedUnits,
        extraFields: Object.keys(extraFields).length > 0 ? extraFields : undefined,
      });
    } else {
      addProduct({
        code: formData.code,
        nameAr: formData.nameAr,
        categoryAr: formData.categoryAr,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        currentStock: Number(formData.currentStock),
        minStockAlert: Number(formData.minStockAlert),
        baseUnit: formData.baseUnit,
        shelfLocation: formData.shelfLocation,
        businessType: formData.businessType,
        aliases,
        allowedUnits: formData.allowedUnits,
        extraFields: Object.keys(extraFields).length > 0 ? extraFields : undefined,
      });
    }

    setIsAddEditModalOpen(false);
  };

  // Adjust stock
  const handleCommitStockAdjust = () => {
    if (!selectedProductForAdjust) return;
    const delta = adjustType === 'waste' ? -Math.abs(adjustQty) : Math.abs(adjustQty);
    adjustStock(selectedProductForAdjust.id, delta, adjustType, adjustNote);
    setIsStockAdjustModalOpen(false);
    setSelectedProductForAdjust(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-white">
              إدارة المخزون والوحدات السودانية
            </h2>
            <p className="text-xs text-slate-400">
              متابعة الأصناف، أسعار الشراء والبيع، مواقع التخزين، ومعاملات التحويل بين الكيلو والرطل والجوال.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEditPrices ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف جديد</span>
            </button>
          ) : (
            <button
              disabled
              title="معطل: واجهة للقراءة فقط لموظفي المبيعات — لا تملك صلاحية إضافة أصناف جديدة"
              className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 text-slate-400 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl cursor-not-allowed opacity-60 shadow-none transition"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>إضافة صنف جديد (معطل - للقراءة فقط)</span>
            </button>
          )}
        </div>
      </div>

      {/* Read-Only Notice Banner for Sales Staff */}
      {isReadOnly && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  واجهة المخزون للقراءة فقط (Read-Only Mode) — حساب موظف مبيعات
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> مقيد للقراءة فقط
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                أنت مسجل حالياً كـ <span className="font-bold text-white font-mono">{currentUser.name}</span> ({currentUser.role === 'cashier' ? 'كاشير ومبيعات' : 'موظف'}). يُسمح لك باستعراض بيانات الأصناف، أسعار البيع، والكميات المتوفرة وأماكن الرفوف. <span className="text-amber-300 font-semibold">تم تعطيل جميع أزرار إضافة الأصناف، تعديل الأسعار، توريد الكميات، والحذف لعدم امتلاكك صلاحيات التعديل.</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl font-mono">
              الصلاحية: عرض فقط 👁️
            </span>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'products'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          قائمة المنتجات ({filteredProducts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('movements')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'movements'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          سجل حركات المخزون ({stockMovements.length})
        </button>

        <button
          onClick={() => setActiveSubTab('units_guide')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'units_guide'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          دليل الأوزان والوحدات السودانية
        </button>
      </div>

      {/* Tab 1: Products */}
      {activeSubTab === 'products' && (
        <div className="space-y-3">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم، الباركود، أو موقع الرف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 outline-none"
              >
                <option value="all">كل الأقسام</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition ${
                  onlyLowStock
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                نواقص المخزون فقط
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3">الباركود</th>
                    <th className="p-3">اسم الصنف</th>
                    <th className="p-3">القسم وموقع الرف</th>
                    <th className="p-3">الرصيد المتاح</th>
                    <th className="p-3">سعر الشراء (التكلفة)</th>
                    <th className="p-3">سعر البيع</th>
                    <th className="p-3">هامش الربح</th>
                    <th className="p-3">الوحدات البديلة</th>
                    <th className="p-3 text-center">
                      إجراءات
                      {isReadOnly && (
                        <span className="text-[10px] text-amber-400 font-normal mr-1 block sm:inline">
                          (للقراءة فقط)
                        </span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProducts.map((p) => {
                    const isLow = p.currentStock <= p.minStockAlert;
                    const profitMargin = p.sellingPrice - p.purchasePrice;
                    const profitPercent =
                      p.purchasePrice > 0 ? ((profitMargin / p.purchasePrice) * 100).toFixed(0) : '100';

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono text-slate-400">{p.code}</td>
                        <td className="p-3">
                          <span className="font-bold text-white text-sm block">{p.nameAr}</span>
                          {p.aliases && p.aliases.length > 0 && (
                            <span className="text-[10px] text-slate-500">
                              مرادفات: {p.aliases.join('، ')}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-slate-300 block">{p.categoryAr}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-emerald-400" /> {p.shelfLocation}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold font-mono px-2 py-0.5 rounded text-xs ${
                                isLow
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {p.currentStock} {p.baseUnit}
                            </span>
                            {isLow && (
                              <span
                                title="وصل لحد الطلب الأدنى"
                                className="text-amber-400"
                              >
                                ⚠️
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            حد الطلب: {p.minStockAlert}
                          </span>
                        </td>

                        {/* Purchase Price (RBAC Guard) */}
                        <td className="p-3 font-mono">
                          {currentUser.permissions.canViewCOGS ? (
                            <span className="text-slate-300">
                              {p.purchasePrice.toLocaleString('ar-SD')} ج.س
                            </span>
                          ) : (
                            <span className="text-amber-400/80 text-[11px] flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded">
                              <Lock className="w-3 h-3" /> محجوب
                            </span>
                          )}
                        </td>

                        {/* Selling Price */}
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          {p.sellingPrice.toLocaleString('ar-SD')} ج.س
                        </td>

                        {/* Profit Margin (RBAC Guard) */}
                        <td className="p-3 font-mono">
                          {currentUser.permissions.canViewProfits ? (
                            <div>
                              <span className="text-emerald-300 font-bold">
                                +{profitMargin.toLocaleString('ar-SD')} ج.س
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                ({profitPercent}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-400/80 text-[11px] flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded">
                              <Lock className="w-3 h-3" /> محجوب
                            </span>
                          )}
                        </td>

                        {/* Allowed Units */}
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {p.allowedUnits && p.allowedUnits.length > 0 ? (
                              p.allowedUnits.map((u, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-slate-950 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded"
                                >
                                  {u.unitName} (
                                  {u.customPrice
                                    ? `${u.customPrice} ج.س`
                                    : `×${u.conversionFactor}`}
                                  )
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-600 text-[10px]">-</span>
                            )}
                          </div>
                        </td>

                        {/* Actions (Add / Edit / Delete / Restock) */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canManageStock ? (
                              <button
                                onClick={() => {
                                  setSelectedProductForAdjust(p);
                                  setIsStockAdjustModalOpen(true);
                                }}
                                title="توريد أو تعديل الرصيد"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer"
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                disabled
                                title="معطل: واجهة للقراءة فقط لموظفي المبيعات — لا تملك صلاحية تعديل الرصيد أو التوريد"
                                className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-600 cursor-not-allowed opacity-40"
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {canEditPrices ? (
                              <button
                                onClick={() => handleOpenEdit(p)}
                                title="تعديل الصنف والأسعار"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                disabled
                                title="معطل: واجهة للقراءة فقط لموظفي المبيعات — لا تملك صلاحية تعديل الصنف أو الأسعار"
                                className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-600 cursor-not-allowed opacity-40"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {canDeleteProduct ? (
                              <button
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من حذف الصنف "${p.nameAr}"؟`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                                title="حذف الصنف"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                disabled
                                title="معطل: واجهة للقراءة فقط لموظفي المبيعات — حذف الأصناف متاح للمدير والمالك فقط"
                                className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-600 cursor-not-allowed opacity-40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Movements */}
      {activeSubTab === 'movements' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs font-bold text-slate-300">
            حركة المخزون اللحظية (مبيعات، توريدات، وتوالف مرتبطة بالعمليات الفعلية)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">اسم الصنف</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3">الكمية</th>
                  <th className="p-3">الرصيد السابق</th>
                  <th className="p-3">الرصيد الجديد</th>
                  <th className="p-3">المرجع</th>
                  <th className="p-3">المستخدم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stockMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-[11px] text-slate-400">{m.timestamp}</td>
                    <td className="p-3 font-semibold text-white">{m.productName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.type === 'sale'
                            ? 'bg-blue-500/20 text-blue-300'
                            : m.type === 'purchase'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : m.type === 'waste'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {m.type === 'sale'
                          ? 'مبيعات'
                          : m.type === 'purchase'
                          ? 'توريد مشتريات'
                          : m.type === 'waste'
                          ? 'تالف / هالك'
                          : m.type === 'return'
                          ? 'مرتجع بيع'
                          : 'تسوية جرد'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-200">
                      {m.type === 'sale' || m.type === 'waste' ? '-' : '+'}
                      {m.quantity} {m.unit}
                    </td>
                    <td className="p-3 font-mono text-slate-400">{m.previousStock}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{m.newStock}</td>
                    <td className="p-3 font-mono text-slate-400">{m.referenceId}</td>
                    <td className="p-3 text-slate-300">{m.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Sudanese Units Guide */}
      {activeSubTab === 'units_guide' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <h3 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              منظومة الأوزان والمكاييل في السوق والتجارة السودانية
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              تعتمد الأسواق السودانية على وحدات تجارية خاصة متوارثة؛ يتيح النظام للتجار تحديد علاقات التحويل الخاصة بكل صنف وتطبيق التسعير الذكي لكل وحدة تلقائياً.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUDANESE_UNITS.map((u) => (
              <div
                key={u.id}
                className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2 hover:border-emerald-500/40 transition"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-white text-sm">{u.nameAr}</h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    {u.symbolAr}
                  </span>
                </div>
                <div className="text-xs text-emerald-400 font-semibold">
                  المعادل القياسي: {u.equivalentStandard}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{u.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto text-slate-100">
            <h3 className="font-extrabold text-base text-white">
              {editingProduct ? 'تعديل بيانات المنتج والأسعار' : 'إضافة صنف جديد إلى المخزون'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">اسم الصنف بالكامل:</label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="اسم الصنف"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">الباركود أو الرمز:</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">القسم والتصنيف:</label>
                  <input
                    type="text"
                    required
                    value={formData.categoryAr}
                    onChange={(e) => setFormData({ ...formData, categoryAr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">مكان التخزين / الرف:</label>
                  <input
                    type="text"
                    value={formData.shelfLocation}
                    onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                    placeholder="مثال: رف أ-1، أو المخزن الأرضي"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    سعر الشراء / التكلفة (ج.س):
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    سعر البيع الأساسي (ج.س):
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">الرصيد المتاح حالياً:</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={formData.currentStock}
                    onChange={(e) =>
                      setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">الوحدة الأساسية:</label>
                  <select
                    value={formData.baseUnit}
                    onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="كيلوجرام">كيلوجرام</option>
                    <option value="حبة">حبة / قطعة</option>
                    <option value="لتر">لتر</option>
                    <option value="شريط">شريط</option>
                    <option value="صحن">صحن</option>
                    <option value="طقم">طقم</option>
                    <option value="متر">متر</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">تنبيه نواقص المخزون عند:</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minStockAlert}
                    onChange={(e) =>
                      setFormData({ ...formData, minStockAlert: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    مرادفات اللهجة السودانية (مفصولة بفواصل):
                  </label>
                  <input
                    type="text"
                    value={formData.aliasesText}
                    onChange={(e) => setFormData({ ...formData, aliasesText: e.target.value })}
                    placeholder="مثال: سكر، سكر أبيض، سكر قوالب"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>
              </div>

              {/* Extra unit conversion box */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>وحدات سودانية مخصصة لهذا الصنف (رطل، جوال، كرتونة، باكت):</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        allowedUnits: [
                          ...formData.allowedUnits,
                          { unitId: 'custom', unitName: 'رطل', conversionFactor: 0.45, customPrice: 0 },
                        ],
                      });
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    + إضافة وحدة
                  </button>
                </div>

                {formData.allowedUnits.map((u, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="اسم الوحدة"
                      value={u.unitName}
                      onChange={(e) => {
                        const updated = [...formData.allowedUnits];
                        updated[idx].unitName = e.target.value;
                        setFormData({ ...formData, allowedUnits: updated });
                      }}
                      className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="معامل التحويل"
                      value={u.conversionFactor}
                      onChange={(e) => {
                        const updated = [...formData.allowedUnits];
                        updated[idx].conversionFactor = parseFloat(e.target.value) || 1;
                        setFormData({ ...formData, allowedUnits: updated });
                      }}
                      className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                    <input
                      type="number"
                      placeholder="سعر خاص (اختياري)"
                      value={u.customPrice || ''}
                      onChange={(e) => {
                        const updated = [...formData.allowedUnits];
                        updated[idx].customPrice = parseFloat(e.target.value) || undefined;
                        setFormData({ ...formData, allowedUnits: updated });
                      }}
                      className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          allowedUnits: formData.allowedUnits.filter((_, i) => i !== idx),
                        });
                      }}
                      className="text-rose-400 hover:text-rose-300 p-1 text-center"
                    >
                      حذف
                    </button>
                  </div>
                ))}
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
                  disabled={!canEditPrices}
                  className={`px-5 py-2 rounded-xl font-bold ${
                    canEditPrices
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  {canEditPrices ? 'حفظ الصنف' : 'معطل (للقراءة فقط)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {isStockAdjustModalOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-5 space-y-4 text-slate-100 text-xs">
            <h3 className="font-bold text-sm text-white">
              تعديل رصيد: {selectedProductForAdjust.nameAr}
            </h3>
            <p className="text-slate-400">
              الرصيد الحالي بالمخزن: {selectedProductForAdjust.currentStock}{' '}
              {selectedProductForAdjust.baseUnit}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">نوع الحركة:</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                >
                  <option value="purchase">توريد مشتريات بضاعة جديدة (+)</option>
                  <option value="adjustment">تسوية جرد (+/-)</option>
                  <option value="waste">إتلاف بضاعة منتهية / تالف (-)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  الكمية ({selectedProductForAdjust.baseUnit}):
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ملاحظة أو رقم فاتورة المورد:</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="مثال: فاتورة توريد رقم 115"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsStockAdjustModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                disabled={!canManageStock}
                onClick={handleCommitStockAdjust}
                className={`px-4 py-2 rounded-xl font-bold ${
                  canManageStock
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                {canManageStock ? 'تأكيد التحديث' : 'معطل (للقراءة فقط)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
