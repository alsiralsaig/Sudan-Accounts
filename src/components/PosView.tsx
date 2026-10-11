import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  ArrowRight,
  User,
  CreditCard,
  QrCode,
  Tag,
  Share2,
  Scan,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, PaymentMethod } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedUnit: string;
  unitPrice: number;
  totalPrice: number;
}

interface PosViewProps {
  onOpenVoiceModal: () => void;
  onViewInvoiceReceipt: (invoiceId: string) => void;
}

export const PosView: React.FC<PosViewProps> = ({ onOpenVoiceModal, onViewInvoiceReceipt }) => {
  const {
    products,
    createInvoice,
    currentUser,
    calculateItemPrice,
    businessType,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [scannedToastMessage, setScannedToastMessage] = useState<string | null>(null);

  // Handle scanned product from barcode camera
  const handleProductScannedFromBarcode = (product: Product) => {
    addToCart(product);
    setScannedToastMessage(`تم مسح وإضافة «${product.nameAr}» إلى السلة`);
    setTimeout(() => {
      setScannedToastMessage(null);
    }, 2800);
  };

  // Filter products by active business type and search query
  const filteredProducts = products.filter((p) => {
    const matchesBusiness = p.businessType === businessType;
    const matchesSearch =
      p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.aliases && p.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory =
      selectedCategory === 'all' || p.categoryAr === selectedCategory;

    return matchesBusiness && matchesSearch && matchesCategory;
  });

  // Extract available categories
  const categories = Array.from(
    new Set(
      products
        .filter((p) => p.businessType === businessType)
        .map((p) => p.categoryAr)
    )
  );

  // Add item to cart
  const addToCart = (product: Product, unitName?: string) => {
    setErrorMessage(null);
    const unit = unitName || product.baseUnit;
    const { unitPrice } = calculateItemPrice(product, unit, 1);

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.selectedUnit === unit
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalPrice: newQty * updated[existingIndex].unitPrice,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            product: product,
            quantity: 1,
            selectedUnit: unit,
            unitPrice,
            totalPrice: unitPrice,
          },
        ];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: newQty,
        totalPrice: newQty * updated[index].unitPrice,
      };
      return updated;
    });
  };

  // Change selected unit (e.g. from kilo to ratl or to sack)
  const changeUnit = (index: number, newUnit: string) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const { unitPrice } = calculateItemPrice(item.product, newUnit, item.quantity);
      updated[index] = {
        ...item,
        selectedUnit: newUnit,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
      };
      return updated;
    });
  };

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = Math.max(0, subtotal - discount);

  // Complete checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      setErrorMessage('سلة البيع فارغة! اختر منتجات لإتمام العملية.');
      return;
    }

    const invoiceItems = cart.map((item) => ({
      productId: item.productId,
      productName: item.product.nameAr,
      quantity: item.quantity,
      unit: item.selectedUnit,
      unitPrice: item.unitPrice,
      costPrice: item.product.purchasePrice,
      totalPrice: item.totalPrice,
      profit: 0, // Handled automatically by context
    }));

    const result = createInvoice({
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      items: invoiceItems,
      subtotal,
      discount,
      tax: 0,
      total,
      paidAmount: paymentMethod === 'credit' ? 0 : total,
      remainingAmount: paymentMethod === 'credit' ? total : 0,
      paymentMethod,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      status: 'completed',
      templateType: 'thermal',
    });

    if (result.success && result.invoiceId) {
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      setErrorMessage(null);
      onViewInvoiceReceipt(result.invoiceId);
    } else {
      setErrorMessage(result.error || 'حدث خطأ أثناء حفظ الفاتورة.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Top Bar with Quick Voice Trigger */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-3 sm:p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-white">
              نقطة البيع السريعة (POS)
            </h2>
            <p className="text-xs text-slate-400">
              أضف الأصناف بالسحب أو الباركود، أو استخدم المساعد الصوتي لتسجيل البيع فوراً.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBarcodeModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-lg transition cursor-pointer"
            title="مسح الباركود باستخدام كاميرا الهاتف أو الحاسوب"
          >
            <Scan className="w-4 h-4 text-emerald-400" />
            <span>مسح الباركود بالكاميرا</span>
          </button>

          <button
            onClick={onOpenVoiceModal}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/60 transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>تحدث بالمبيعات بصوتك الآن</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Products on Left/Right & Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Products Catalog (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search & Categories Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="ابحث بالاسم، الباركود، أو المصطلح الشعبي (مثال: سكر، شاي، سيقا)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    const exactMatch = products.find(
                      (p) =>
                        p.code.toLowerCase() === searchQuery.trim().toLowerCase() ||
                        p.id.toLowerCase() === searchQuery.trim().toLowerCase()
                    );
                    if (exactMatch) {
                      handleProductScannedFromBarcode(exactMatch);
                      setSearchQuery('');
                    }
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pr-9 pl-24 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setIsBarcodeModalOpen(true)}
                className="absolute left-1.5 top-1.5 flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2 py-1 rounded-md text-xs transition cursor-pointer border border-emerald-500/30"
                title="فتح كاميرا مسح الباركود"
              >
                <Scan className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">كاميرا</span>
              </button>
            </div>

            {/* Categories pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg font-medium shrink-0 transition ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                الكل ({filteredProducts.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-medium shrink-0 transition ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const isLowStock = product.currentStock <= product.minStockAlert;
              const isOutOfStock = product.currentStock <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`group bg-slate-900 border rounded-xl p-3 flex flex-col justify-between transition cursor-pointer select-none ${
                    isOutOfStock
                      ? 'border-rose-900/40 opacity-60 bg-rose-950/10'
                      : 'border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{product.code}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          isOutOfStock
                            ? 'bg-rose-500/20 text-rose-300'
                            : isLowStock
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {isOutOfStock
                          ? 'نفد المخزون'
                          : `${product.currentStock} ${product.baseUnit}`}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-emerald-300 transition">
                      {product.nameAr}
                    </h4>

                    {product.shelfLocation && (
                      <span className="text-[10px] text-slate-500 block mt-1">
                        📍 {product.shelfLocation}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        {product.sellingPrice.toLocaleString('ar-SD')} ج.س
                      </div>
                      <span className="text-[10px] text-slate-400">
                        لكل {product.baseUnit}
                      </span>
                    </div>

                    {/* Quick unit options pill */}
                    <div className="flex items-center gap-1">
                      {product.allowedUnits && product.allowedUnits.length > 1 && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded">
                          +{product.allowedUnits.length} وحدات
                        </span>
                      )}
                      <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                لا توجد منتجات مطابقة للبحث في هذا القسم.
              </div>
            )}
          </div>
        </div>

        {/* Cart & Checkout Panel (5 cols on lg) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[700px] overflow-hidden shadow-xl">
          {/* Cart Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">سلة الفاتورة الحالية</h3>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                {cart.length} أصناف
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                تفريغ السلة
              </button>
            )}
          </div>

          {/* Error Message in Cart */}
          {errorMessage && (
            <div className="mx-3 mt-3 bg-rose-950/60 border border-rose-800/80 text-rose-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
            {cart.map((item, index) => (
              <div key={index} className="pt-2 first:pt-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-white">{item.product.nameAr}</h5>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {item.unitPrice.toLocaleString('ar-SD')} ج.س / {item.selectedUnit}
                    </div>
                  </div>

                  <div className="text-left font-bold text-xs text-emerald-400 font-mono">
                    {item.totalPrice.toLocaleString('ar-SD')} ج.س
                  </div>
                </div>

                {/* Unit Switcher & Quantity Modifiers */}
                <div className="flex items-center justify-between gap-2">
                  {/* Sudanese Unit Selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">الوحدة:</span>
                    <select
                      value={item.selectedUnit}
                      onChange={(e) => changeUnit(index, e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-[11px] rounded px-1.5 py-0.5 outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value={item.product.baseUnit}>{item.product.baseUnit}</option>
                      {item.product.allowedUnits?.map((u) => (
                        <option key={u.unitId} value={u.unitName}>
                          {u.unitName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 1)}
                      className="w-12 text-center bg-transparent text-xs text-white font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(index)}
                      className="w-6 h-6 rounded text-slate-500 hover:text-rose-400 flex items-center justify-center ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-30 text-emerald-400" />
                <p>السلة فارغة حالياً</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  انقر على المنتجات أعلاه أو استخدم المساعد الصوتي
                </p>
              </div>
            )}
          </div>

          {/* Cart Footer & Checkout Controls */}
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-3">
            {/* Customer & Payment Method */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">طريقة الدفع:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5 outline-none focus:border-emerald-500"
                >
                  <option value="cash">💵 نقداً (كاش)</option>
                  <option value="bankak">📱 تطبيق بنكك (الخرطوم)</option>
                  <option value="fawry">💳 تطبيق فوري (فيصل)</option>
                  <option value="credit">⏳ آجل (دين على العميل)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">الخصم (ج.س):</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5 outline-none font-mono"
                  placeholder="0"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="اسم العميل (مطلوب في حال الدفع الآجل)"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Subtotal & Total */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>المجموع الفرعي:</span>
                <span className="font-mono">{subtotal.toLocaleString('ar-SD')} ج.س</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>الخصم المطبق:</span>
                  <span className="font-mono">-{discount.toLocaleString('ar-SD')} ج.س</span>
                </div>
              )}
              <div className="flex justify-between text-white font-extrabold text-sm sm:text-base pt-1 border-t border-slate-800">
                <span>الإجمالي النهائي:</span>
                <span className="text-emerald-400 font-mono">
                  {total.toLocaleString('ar-SD')} ج.س
                </span>
              </div>
            </div>

            {/* Submit Checkout Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>إتمام البيع وطباعة الفاتورة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Barcode Scan Toast */}
      {scannedToastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/90 text-white border border-emerald-500/60 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 font-bold backdrop-blur">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span>{scannedToastMessage}</span>
        </div>
      )}

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        products={products}
        onProductScanned={handleProductScannedFromBarcode}
      />
    </div>
  );
};
