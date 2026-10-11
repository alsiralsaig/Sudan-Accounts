export type UserRole = 'owner' | 'cashier' | 'storekeeper';

export interface UserPermissions {
  canViewProfits: boolean;
  canViewCOGS: boolean;
  canEditPrices: boolean;
  canOverrideStock: boolean;
  canManageStaff: boolean;
  canViewAuditLogs: boolean;
  canManageSettings: boolean;
  canProcessReturns: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  permissions: UserPermissions;
}

export type BusinessType = 
  | 'grocery'       // بقالة وسوبرماركت
  | 'pharmacy'      // صيدلية
  | 'restaurant'    // مطعم وكافيه
  | 'auto_parts'    // قطع غيار وورش
  | 'electronics'   // إلكترونيات وهواتف
  | 'clothing'      // ملابس وأحذية
  | 'building';     // مواد بناء وسباكة

export interface UnitConversion {
  unitId: string;
  unitName: string; // e.g. "جوال", "رطل", "دستة", "كرتونة"
  conversionFactor: number; // relative to base unit (e.g. 50 for 50kg bag)
  customPrice?: number; // optional special selling price for this unit
}

export interface Product {
  id: string;
  code: string; // Barcode or SKU
  nameAr: string;
  categoryAr: string;
  purchasePrice: number; // سعر الشراء / التكلفة (COGS component)
  sellingPrice: number; // سعر البيع الأساسي
  currentStock: number;
  minStockAlert: number;
  baseUnit: string; // كجم، حبة، لتر، متر، الخ
  allowedUnits: UnitConversion[];
  shelfLocation: string; // الرف أو مكان التخزين (e.g., "رف أ-2", "المخزن الشرقي")
  businessType: BusinessType;
  aliases: string[]; // Sudanese dialect synonyms (e.g., "سكر كنانة", "شاي أحمر")
  extraFields?: {
    expiryDate?: string;
    batchNumber?: string;
    dosage?: string;
    vehicleModel?: string;
    imei?: string;
    size?: string;
    color?: string;
  };
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'return' | 'waste' | 'adjustment';
  quantity: number;
  unit: string;
  previousStock: number;
  newStock: number;
  referenceId: string; // invoice number or supplier bill number
  timestamp: string;
  userId: string;
  userName: string;
  note?: string;
}

export interface PriceHistory {
  id: string;
  productId: string;
  productName: string;
  oldPurchasePrice: number;
  newPurchasePrice: number;
  oldSellingPrice: number;
  newSellingPrice: number;
  changedAt: string;
  changedBy: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  costPrice: number; // For COGS calculation
  totalPrice: number;
  profit: number; // totalPrice - (costPrice * quantity)
}

export type PaymentMethod = 'cash' | 'bankak' | 'fawry' | 'credit';

export interface Invoice {
  id: string; // e.g., INV-2026-0001
  date: string;
  customerName?: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  costOfGoodsSold: number; // Real COGS
  netGrossProfit: number; // Total - COGS - Discount
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  cashierId: string;
  cashierName: string;
  status: 'completed' | 'returned' | 'cancelled';
  notes?: string;
  templateType: 'thermal' | 'a4';
}

export type ExpenseCategory =
  | 'rent'
  | 'electricity_fuel'
  | 'salaries'
  | 'supplies'
  | 'maintenance'
  | 'transport'
  | 'other';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  createdBy?: string;
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  paidTo?: string;
  isRecurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'one_time';
}

export interface ProfitLossSummary {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalSales: number;
  totalCOGS: number;
  grossProfit: number;
  grossProfitMargin: number; // %
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
  expensesByPaymentMethod: Record<string, number>;
  netProfit: number;
  netProfitMargin: number; // %
  invoicesCount: number;
  expensesCount: number;
}

// ==========================================
// دفتر ديون العملاء (الشكك / الحسابات الآجلة)
// ==========================================
export interface CustomerCreditAccount {
  id: string;
  name: string;
  phone: string;
  address?: string;
  nationalId?: string;
  creditLimit: number; // سقف الدين المسموح به (ج.س)
  currentBalance: number; // الرصيد الحالي المستحق على الزبون
  notes?: string;
  createdAt: string;
  lastPaymentDate?: string;
  status: 'active' | 'settled' | 'overdue';
}

export interface CustomerCreditTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'debt' | 'payment'; // دين جديد (شراء آجل) أو سداد دفعة
  amount: number;
  date: string;
  invoiceId?: string;
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  balanceAfter: number;
  notes?: string;
  recordedBy: string;
}

// ==========================================
// سجل الموردين وفواتير الشراء والتوريد
// ==========================================
export interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  phone: string;
  address?: string;
  bankDetails?: string; // e.g. رقم حساب بنكك للمورد
  currentBalance: number; // مديونية مستحقة للمورد
  totalPurchases: number; // إجمالي المشتريات من هذا المورد
  notes?: string;
  createdAt: string;
}

export interface PurchaseInvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseInvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  status: 'received' | 'partial' | 'draft';
  notes?: string;
  receivedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
}

export interface TradeDictionaryItem {
  id: string;
  dialectTerm: string;
  standardTerm: string;
  productId?: string;
  productName?: string;
  note?: string;
  verified: boolean;
}

export interface SudaneseUnitDef {
  id: string;
  nameAr: string;
  pluralAr: string;
  symbolAr: string;
  type: 'weight' | 'volume' | 'count' | 'container';
  equivalentStandard: string;
  description: string;
}

export type NotificationSeverity = 'critical' | 'warning' | 'info';

export interface StockNotification {
  id: string;
  productId: string;
  productName: string;
  code: string;
  currentStock: number;
  minStockAlert: number;
  baseUnit: string;
  shelfLocation: string;
  severity: NotificationSeverity;
  timestamp: string;
  isRead: boolean;
  isDismissed: boolean;
}

export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'disabled';

export interface BackupScheduleConfig {
  enabled: boolean;
  frequency: BackupFrequency;
  timeOfDay: string; // e.g. "23:00"
  lastBackupDate?: string;
  nextBackupDate?: string;
  autoDownload: boolean;
  maxSnapshotsToKeep: number;
}

export interface DatabaseSnapshot {
  id: string;
  createdAt: string;
  title: string;
  type: 'manual' | 'scheduled' | 'pre_restore_checkpoint';
  data: {
    products: Product[];
    invoices: Invoice[];
    expenses: Expense[];
    staffList: UserProfile[];
    dictionary: TradeDictionaryItem[];
    auditLogs: AuditLog[];
    stockMovements: StockMovement[];
    storeSettings: {
      storeName: string;
      storePhone: string;
      storeAddress: string;
      businessType: BusinessType;
    };
  };
  stats: {
    productsCount: number;
    invoicesCount: number;
    expensesCount: number;
    totalRevenue: number;
  };
  version: string;
}

export interface EmailNotificationConfig {
  enabled: boolean;
  managerEmail: string;
  additionalEmails: string[];
  dailySummaryEnabled: boolean;
  dailySummaryTime: string; // e.g. "22:00"
  lowStockAlertsEnabled: boolean;
  includeProfitInSummary: boolean;
  lastDailyReportSent?: string;
  lastLowStockAlertSent?: string;
}

export interface SentEmailLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  type: 'daily_summary' | 'low_stock_alert' | 'test';
  status: 'delivered' | 'pending' | 'failed';
  htmlPreview: string;
  summaryText: string;
}

export interface VatSettings {
  enabled: boolean;
  taxRate: number; // e.g. 17 for 17%
  taxIdentificationNumber: string; // الرقم الضريبي (TIN)
  commercialRegistrationNumber: string; // السجل التجاري
  taxOfficeName: string; // المأمورية الضريبية
  businessLegalName: string; // الاسم القانوني المسجل
  taxFilingFrequency: 'monthly' | 'quarterly'; // دورية تقديم الإقرار
  isPricesTaxInclusive: boolean; // هل الأسعار في النظام شاملة الضريبة
  deductibleExpenseCategories: ExpenseCategory[];
}

export interface MonthlyTaxReportSummary {
  periodKey: string; // "2026-10"
  year: number;
  month: number;
  monthNameAr: string;
  totalInvoicesCount: number;
  grossSalesTotal: number;
  taxableSalesBase: number;
  exemptSalesBase: number;
  outputVatTotal: number; // ضريبة المبيعات / المخرجات
  totalExpensesCount: number;
  grossExpensesTotal: number;
  deductibleExpensesBase: number;
  inputVatTotal: number; // ضريبة المدخلات القابلة للخصم
  netVatPayable: number; // صافي الضريبة الواجبة السداد (المخرجات - المدخلات)
  isRefundCredit: boolean; // رصيد ضريبي دائن مرحّل إذا كانت المدخلات أكبر من المخرجات
  paymentBreakdown: {
    cash: { sales: number; vat: number };
    bankak: { sales: number; vat: number };
    fawry: { sales: number; vat: number };
    credit: { sales: number; vat: number };
  };
}


