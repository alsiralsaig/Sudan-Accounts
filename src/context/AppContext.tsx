import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  UserProfile,
  Invoice,
  InvoiceItem,
  Expense,
  AuditLog,
  TradeDictionaryItem,
  StockMovement,
  PriceHistory,
  BusinessType,
  PaymentMethod,
  StockNotification,
  DatabaseSnapshot,
  BackupScheduleConfig,
  BackupFrequency,
  EmailNotificationConfig,
  SentEmailLog,
  VatSettings,
  MonthlyTaxReportSummary,
} from '../types';
import {
  SpeechSettings,
  speechAlertService,
} from '../services/speechAlertService';
import {
  DEFAULT_VAT_SETTINGS,
  generateMonthlyTaxReport,
  getAvailableTaxPeriods,
  exportTaxReportToCSV,
  parseYearMonth,
} from '../services/vatCalculationService';
import {
  INITIAL_PRODUCTS,
  INITIAL_STAFF,
  INITIAL_DICTIONARY,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_AUDIT_LOGS,
  INITIAL_MOVEMENTS,
} from '../data/initialData';

interface AppContextType {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Active Business Type
  businessType: BusinessType;
  setBusinessType: (type: BusinessType) => void;

  // User & RBAC
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  staffList: UserProfile[];
  updateStaffMember: (user: UserProfile) => void;
  addStaffMember: (user: Omit<UserProfile, 'id'>) => void;

  // Products & Inventory
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (
    productId: string,
    quantityDelta: number,
    type: 'purchase' | 'adjustment' | 'waste' | 'return',
    note?: string
  ) => boolean;

  // Invoices & Sales
  invoices: Invoice[];
  createInvoice: (
    invoiceData: Omit<Invoice, 'id' | 'date' | 'costOfGoodsSold' | 'netGrossProfit'>
  ) => { success: boolean; invoiceId?: string; error?: string };
  returnInvoice: (invoiceId: string, reason?: string) => boolean;

  // Expenses & Finance
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;

  // Sudanese Trade Dictionary
  dictionary: TradeDictionaryItem[];
  addDictionaryItem: (item: Omit<TradeDictionaryItem, 'id'>) => void;
  deleteDictionaryItem: (id: string) => void;

  // Audit Logs & Movements
  auditLogs: AuditLog[];
  stockMovements: StockMovement[];
  priceHistories: PriceHistory[];

  // Utilities
  resetToDefaultData: () => void;
  storeName: string;
  setStoreName: (name: string) => void;
  storePhone: string;
  setStorePhone: (phone: string) => void;
  storeAddress: string;
  setStoreAddress: (address: string) => void;

  // Stock Notifications & Reorder Level Alerts
  stockNotifications: StockNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  dismissNotification: (id: string) => void;
  restoreDismissedNotifications: () => void;
  quickRestockProduct: (productId: string, quantityToAdd: number) => boolean;
  updateProductReorderLevel: (productId: string, newMinStock: number) => void;

  // Web Speech API Voice Alerts
  speechSettings: SpeechSettings;
  updateSpeechSettings: (newSettings: Partial<SpeechSettings>) => void;
  isSpeechSupported: boolean;
  speakAlert: (text: string, force?: boolean, priority?: 'critical' | 'normal') => boolean;
  announceProductStockAlert: (product: Product, force?: boolean) => boolean;
  stopSpeechAlert: () => void;

  // Database Backup, Scheduling & Restore
  backupSchedule: BackupScheduleConfig;
  updateBackupSchedule: (config: Partial<BackupScheduleConfig>) => void;
  databaseSnapshots: DatabaseSnapshot[];
  createDatabaseSnapshot: (title?: string, type?: 'manual' | 'scheduled' | 'pre_restore_checkpoint') => DatabaseSnapshot;
  exportDatabaseAsJSON: () => void;
  exportDatabaseAsCSV: (tableName?: 'products' | 'invoices' | 'expenses' | 'all') => void;
  restoreDatabaseFromSnapshot: (snapshotId: string) => boolean;
  restoreDatabaseFromJSONString: (jsonContent: string, mode?: 'overwrite' | 'merge') => { success: boolean; message: string; stats?: any };
  restoreDatabaseFromCSVString: (csvContent: string, targetType: 'products' | 'expenses') => { success: boolean; message: string; count?: number };
  deleteSnapshot: (snapshotId: string) => void;

  // Email Notification System (Daily Summary & Critical Low-Stock Alerts)
  emailConfig: EmailNotificationConfig;
  updateEmailConfig: (config: Partial<EmailNotificationConfig>) => void;
  sentEmailLogs: SentEmailLog[];
  sendDailySalesSummaryEmail: (recipientOverride?: string) => Promise<{ success: boolean; message: string; logId?: string }>;
  sendLowStockAlertEmail: (productsToAlert?: Product[], recipientOverride?: string) => Promise<{ success: boolean; message: string; logId?: string }>;
  sendTestEmail: (recipientOverride?: string) => Promise<{ success: boolean; message: string; logId?: string }>;
  deleteEmailLog: (logId: string) => void;
  clearAllEmailLogs: () => void;

  // Unit price helper
  calculateItemPrice: (
    product: Product,
    unitName: string,
    quantity: number
  ) => { unitPrice: number; totalPrice: number };

  // Financial Reports & Value Added Tax (VAT / ضريبة القيمة المضافة)
  vatSettings: VatSettings;
  updateVatSettings: (settings: Partial<VatSettings>) => void;
  getMonthlyTaxReport: (year: number, month: number) => MonthlyTaxReportSummary;
  availableTaxPeriods: Array<{ year: number; month: number; periodKey: string; labelAr: string; invoicesCount: number }>;
  exportTaxReportCSV: (report: MonthlyTaxReportSummary) => void;

  // ملاحظة: واجهات «دفتر الشكك» و«الموردون والمشتريات» (Customers/Suppliers)
  // مُعرّفة في src/types/index.ts وستُضاف هنا عند تنفيذها.
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [businessType, setBusinessType] = useState<BusinessType>('grocery');

  // Store information
  const [storeName, setStoreName] = useState<string>('بقالة ومحلات الأمانة الذكية');
  const [storePhone, setStorePhone] = useState<string>('0912345678 - 0123456789');
  const [storeAddress, setStoreAddress] = useState<string>('السوق المركزي، الخرطوم / بورتسودان');

  // Load state with fallback
  const [staffList, setStaffList] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('hisabati_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(staffList[0]);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('hisabati_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('hisabati_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('hisabati_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [dictionary, setDictionary] = useState<TradeDictionaryItem[]>(() => {
    const saved = localStorage.getItem('hisabati_dictionary');
    return saved ? JSON.parse(saved) : INITIAL_DICTIONARY;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('hisabati_audit');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('hisabati_movements');
    return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
  });

  const [priceHistories, setPriceHistories] = useState<PriceHistory[]>([]);

  // Notifications State
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('hisabati_read_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('hisabati_dismissed_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Web Speech API Voice Alert State
  const [speechSettings, setSpeechSettingsState] = useState<SpeechSettings>(() => {
    return speechAlertService.getSettings();
  });

  // Backup & Snapshots State
  const [backupSchedule, setBackupScheduleState] = useState<BackupScheduleConfig>(() => {
    const saved = localStorage.getItem('hisabati_backup_schedule');
    if (saved) return JSON.parse(saved);
    return {
      enabled: true,
      frequency: 'daily',
      timeOfDay: '23:00',
      lastBackupDate: '2026-10-10 12:00',
      nextBackupDate: '2026-10-11 23:00',
      autoDownload: false,
      maxSnapshotsToKeep: 10,
    };
  });

  const [databaseSnapshots, setDatabaseSnapshots] = useState<DatabaseSnapshot[]>(() => {
    const saved = localStorage.getItem('hisabati_snapshots');
    return saved ? JSON.parse(saved) : [];
  });

  // Email Notification State
  const [emailConfig, setEmailConfigState] = useState<EmailNotificationConfig>(() => {
    const saved = localStorage.getItem('hisabati_email_config');
    if (saved) return JSON.parse(saved);
    return {
      enabled: true,
      managerEmail: 'alsiralsaig@gmail.com',
      additionalEmails: [],
      dailySummaryEnabled: true,
      dailySummaryTime: '22:00',
      lowStockAlertsEnabled: true,
      includeProfitInSummary: true,
      lastDailyReportSent: '2026-10-10 21:00',
      lastLowStockAlertSent: undefined,
    };
  });

  const [sentEmailLogs, setSentEmailLogs] = useState<SentEmailLog[]>(() => {
    const saved = localStorage.getItem('hisabati_email_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'mail-01',
        timestamp: '2026-10-10 21:00',
        recipient: 'alsiralsaig@gmail.com',
        subject: '📊 التقرير اليومي لملخص المبيعات - حساباتي السودان',
        type: 'daily_summary',
        status: 'delivered',
        summaryText: 'إجمالي المبيعات: 1,350,000 ج.س | عدد الفواتير: 4 | صافي الأرباح: 227,000 ج.س',
        htmlPreview: '<div dir="rtl" style="font-family: Cairo, Tahoma, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px;"><h3 style="color: #10b981;">📊 تقرير ملخص المبيعات اليومي - حساباتي السودان 🇸🇩</h3><p style="color:#94a3b8;">إجمالي المبيعات: 1,350,000 ج.س | صافي الربح الفعلي: 227,000 ج.س</p></div>',
      },
      {
        id: 'mail-02',
        timestamp: '2026-10-10 18:30',
        recipient: 'alsiralsaig@gmail.com',
        subject: '⚠️ تنبيه عاجل: أصناف المخزون بلغت مستوى إعادة الطلب',
        type: 'low_stock_alert',
        status: 'delivered',
        summaryText: 'تنبيه نقص المخزون لـ 3 أصناف: سكر كنانة، زيت طعام يارا، شاي الغزالتين',
        htmlPreview: '<div dir="rtl" style="font-family: Cairo, Tahoma, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px;"><h3 style="color: #f59e0b;">⚠️ تنبيه نواقص المخزون ومستوى إعادة الطلب 🇸🇩</h3><p style="color:#94a3b8;">أصناف قاربت على النفاد وتحتاج لتوريد عاجل من الموردين.</p></div>',
      },
    ];
  });

  // Value Added Tax (VAT / ضريبة القيمة المضافة) State
  const [vatSettings, setVatSettingsState] = useState<VatSettings>(() => {
    const saved = localStorage.getItem('hisabati_vat_settings');
    return saved ? JSON.parse(saved) : DEFAULT_VAT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('hisabati_vat_settings', JSON.stringify(vatSettings));
  }, [vatSettings]);

  useEffect(() => {
    localStorage.setItem('hisabati_email_config', JSON.stringify(emailConfig));
  }, [emailConfig]);

  useEffect(() => {
    localStorage.setItem('hisabati_email_logs', JSON.stringify(sentEmailLogs));
  }, [sentEmailLogs]);

  useEffect(() => {
    localStorage.setItem('hisabati_backup_schedule', JSON.stringify(backupSchedule));
  }, [backupSchedule]);

  useEffect(() => {
    localStorage.setItem('hisabati_snapshots', JSON.stringify(databaseSnapshots));
  }, [databaseSnapshots]);

  useEffect(() => {
    localStorage.setItem('hisabati_read_notifications', JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  useEffect(() => {
    localStorage.setItem('hisabati_dismissed_notifications', JSON.stringify(dismissedNotificationIds));
  }, [dismissedNotificationIds]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('hisabati_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('hisabati_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('hisabati_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('hisabati_staff', JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem('hisabati_dictionary', JSON.stringify(dictionary));
  }, [dictionary]);

  useEffect(() => {
    localStorage.setItem('hisabati_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('hisabati_movements', JSON.stringify(stockMovements));
  }, [stockMovements]);

  // Log audit helper
  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleString('ar-SD', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Calculate price dynamically for units
  const calculateItemPrice = (product: Product, unitName: string, quantity: number) => {
    let unitPrice = product.sellingPrice;

    if (product.allowedUnits && Array.isArray(product.allowedUnits)) {
      const match = product.allowedUnits.find((u) => u.unitName === unitName);
      if (match) {
        if (match.customPrice !== undefined && match.customPrice > 0) {
          unitPrice = match.customPrice;
        } else if (match.conversionFactor) {
          unitPrice = Math.round(product.sellingPrice * match.conversionFactor);
        }
      }
    }

    // Special Sudanese units fallback
    if (unitName === 'رطل' && product.baseUnit === 'كيلوجرام') {
      unitPrice = Math.round(product.sellingPrice * 0.45);
    } else if (unitName === 'نص كيلو' || unitName === 'نصف كيلو') {
      unitPrice = Math.round(product.sellingPrice * 0.5);
    } else if (unitName === 'ربع كيلو') {
      unitPrice = Math.round(product.sellingPrice * 0.25);
    }

    return {
      unitPrice,
      totalPrice: unitPrice * quantity,
    };
  };

  // Add Product
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newId = `prod-${Date.now().toString().slice(-6)}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
    };
    setProducts((prev) => [newProduct, ...prev]);
    addAuditLog('إضافة منتج جديد', `تمت إضافة المنتج: ${newProduct.nameAr} بسعر بيع ${newProduct.sellingPrice} ج.س`);
  };

  // Update Product (with price change tracking)
  const updateProduct = (updated: Product) => {
    setProducts((prev) => {
      const old = prev.find((p) => p.id === updated.id);
      if (old) {
        if (old.sellingPrice !== updated.sellingPrice || old.purchasePrice !== updated.purchasePrice) {
          const historyEntry: PriceHistory = {
            id: `ph-${Date.now()}`,
            productId: updated.id,
            productName: updated.nameAr,
            oldPurchasePrice: old.purchasePrice,
            newPurchasePrice: updated.purchasePrice,
            oldSellingPrice: old.sellingPrice,
            newSellingPrice: updated.sellingPrice,
            changedAt: new Date().toISOString(),
            changedBy: currentUser.name,
          };
          setPriceHistories((h) => [historyEntry, ...h]);
          addAuditLog(
            'تحديث أسعار المنتج',
            `تعديل سعر ${updated.nameAr} من ${old.sellingPrice} إلى ${updated.sellingPrice} ج.س`
          );
        }
      }
      return prev.map((p) => (p.id === updated.id ? updated : p));
    });
  };

  // Delete Product
  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      addAuditLog('حذف منتج', `تم حذف الصنف: ${prod.nameAr} (كود: ${prod.code})`);
    }
  };

  // Stock Adjustment / Inbound Purchase / Waste
  const adjustStock = (
    productId: string,
    quantityDelta: number,
    type: 'purchase' | 'adjustment' | 'waste' | 'return',
    note?: string
  ): boolean => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return false;

    const newStock = prod.currentStock + quantityDelta;
    if (newStock < 0 && !currentUser.permissions.canOverrideStock) {
      return false; // Negative stock prohibited unless permitted
    }

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: prod.id,
      productName: prod.nameAr,
      type,
      quantity: Math.abs(quantityDelta),
      unit: prod.baseUnit,
      previousStock: prod.currentStock,
      newStock,
      referenceId: `REF-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString('ar-SD'),
      userId: currentUser.id,
      userName: currentUser.name,
      note: note || `تحديث مخزون يدوي (${type})`,
    };

    setStockMovements((prev) => [movement, ...prev]);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, currentStock: newStock } : p))
    );
    addAuditLog('تحديث رصيد المخزون', `${type} للصنف ${prod.nameAr}: ${quantityDelta > 0 ? '+' : ''}${quantityDelta} ${prod.baseUnit}`);

    // Real-time Voice Announcement on Stock Level Changes (e.g. reduction or running out)
    if (newStock <= prod.minStockAlert) {
      setTimeout(() => {
        speechAlertService.announceStockAlert(
          prod.nameAr,
          newStock,
          prod.baseUnit,
          prod.minStockAlert
        );
      }, 200);
    } else if (quantityDelta > 0 && speechSettings.announceSalesRestock) {
      setTimeout(() => {
        speechAlertService.speak(
          `تم توريد واستلام ${quantityDelta} ${prod.baseUnit} من صنف ${prod.nameAr} بنجاح.`
        );
      }, 200);
    }

    return true;
  };

  // Create Invoice (Calculates exact COGS & gross margin, updates stock)
  const createInvoice = (
    invoiceData: Omit<Invoice, 'id' | 'date' | 'costOfGoodsSold' | 'netGrossProfit'>
  ): { success: boolean; invoiceId?: string; error?: string } => {
    // Check stock availability
    for (const item of invoiceData.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        // Approximate base units deducted based on unit mapping
        let unitsToDeduct = item.quantity;
        const mappedUnit = prod.allowedUnits?.find((u) => u.unitName === item.unit);
        if (mappedUnit && mappedUnit.conversionFactor) {
          unitsToDeduct = item.quantity * mappedUnit.conversionFactor;
        } else if (item.unit === 'رطل' && prod.baseUnit === 'كيلوجرام') {
          unitsToDeduct = item.quantity * 0.45;
        }

        if (prod.currentStock < unitsToDeduct && !currentUser.permissions.canOverrideStock) {
          return {
            success: false,
            error: `الكمية المتوفرة من "${prod.nameAr}" لا تكفي (${prod.currentStock} ${prod.baseUnit} متاحة فقط).`,
          };
        }
      }
    }

    // Calculate real COGS and item margins
    let totalCOGS = 0;
    const enrichedItems: InvoiceItem[] = invoiceData.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      let costPerUnit = prod ? prod.purchasePrice : 0;

      // Adjust cost if selling in different unit
      const mappedUnit = prod?.allowedUnits?.find((u) => u.unitName === item.unit);
      if (mappedUnit && mappedUnit.conversionFactor) {
        costPerUnit = prod!.purchasePrice * mappedUnit.conversionFactor;
      } else if (item.unit === 'رطل' && prod?.baseUnit === 'كيلوجرام') {
        costPerUnit = Math.round(prod.purchasePrice * 0.45);
      }

      const itemTotalCost = costPerUnit * item.quantity;
      totalCOGS += itemTotalCost;

      return {
        ...item,
        costPrice: costPerUnit,
        profit: item.totalPrice - itemTotalCost,
      };
    });

    const netGrossProfit = invoiceData.total - totalCOGS;

    const newInvoiceNumber = `INV-2026-${(1042 + invoices.length).toString()}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: newInvoiceNumber,
      date: new Date().toLocaleString('ar-SD', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      items: enrichedItems,
      costOfGoodsSold: Math.round(totalCOGS),
      netGrossProfit: Math.round(netGrossProfit),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      status: 'completed',
    };

    // Deduct stock for each item & log movement
    setProducts((prev) => {
      return prev.map((p) => {
        const soldItem = invoiceData.items.find((i) => i.productId === p.id);
        if (!soldItem) return p;

        let unitsToDeduct = soldItem.quantity;
        const mappedUnit = p.allowedUnits?.find((u) => u.unitName === soldItem.unit);
        if (mappedUnit && mappedUnit.conversionFactor) {
          unitsToDeduct = soldItem.quantity * mappedUnit.conversionFactor;
        } else if (soldItem.unit === 'رطل' && p.baseUnit === 'كيلوجرام') {
          unitsToDeduct = soldItem.quantity * 0.45;
        }

        const newStock = Math.max(0, p.currentStock - unitsToDeduct);

        // Record stock movement
        const mov: StockMovement = {
          id: `mov-${Date.now()}-${p.id}`,
          productId: p.id,
          productName: p.nameAr,
          type: 'sale',
          quantity: unitsToDeduct,
          unit: p.baseUnit,
          previousStock: p.currentStock,
          newStock,
          referenceId: newInvoiceNumber,
          timestamp: newInvoice.date,
          userId: currentUser.id,
          userName: currentUser.name,
          note: `فاتورة بيع #${newInvoiceNumber}`,
        };
        setStockMovements((m) => [mov, ...m]);

        return { ...p, currentStock: newStock };
      });
    });

    setInvoices((prev) => [newInvoice, ...prev]);
    addAuditLog(
      'إصدار فاتورة جديدة',
      `تم إصدار الفاتورة #${newInvoiceNumber} بقيمة ${newInvoice.total} ج.س (طريقة الدفع: ${newInvoice.paymentMethod})`
    );

    // Announce any items that just dropped to or below reorder level or ran out of stock
    setTimeout(() => {
      enrichedItems.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          let unitsDeducted = item.quantity;
          const mappedUnit = prod.allowedUnits?.find((u) => u.unitName === item.unit);
          if (mappedUnit && mappedUnit.conversionFactor) {
            unitsDeducted = item.quantity * mappedUnit.conversionFactor;
          } else if (item.unit === 'رطل' && prod.baseUnit === 'كيلوجرام') {
            unitsDeducted = item.quantity * 0.45;
          }
          const finalStock = Math.max(0, prod.currentStock - unitsDeducted);
          if (finalStock <= prod.minStockAlert) {
            speechAlertService.announceStockAlert(
              prod.nameAr,
              finalStock,
              prod.baseUnit,
              prod.minStockAlert
            );
          }
        }
      });
    }, 300);

    return { success: true, invoiceId: newInvoiceNumber };
  };

  // Return / Cancel Invoice
  const returnInvoice = (invoiceId: string, reason?: string): boolean => {
    if (!currentUser.permissions.canProcessReturns) return false;

    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv || inv.status === 'returned') return false;

    // Refund items back to stock
    setProducts((prev) => {
      return prev.map((p) => {
        const item = inv.items.find((i) => i.productId === p.id);
        if (!item) return p;

        let unitsToAdd = item.quantity;
        const mappedUnit = p.allowedUnits?.find((u) => u.unitName === item.unit);
        if (mappedUnit && mappedUnit.conversionFactor) {
          unitsToAdd = item.quantity * mappedUnit.conversionFactor;
        }

        const newStock = p.currentStock + unitsToAdd;

        const mov: StockMovement = {
          id: `mov-ret-${Date.now()}-${p.id}`,
          productId: p.id,
          productName: p.nameAr,
          type: 'return',
          quantity: unitsToAdd,
          unit: p.baseUnit,
          previousStock: p.currentStock,
          newStock,
          referenceId: `RET-${inv.id}`,
          timestamp: new Date().toLocaleString('ar-SD'),
          userId: currentUser.id,
          userName: currentUser.name,
          note: reason || `إرجاع فاتورة #${inv.id}`,
        };
        setStockMovements((m) => [mov, ...m]);

        return { ...p, currentStock: newStock };
      });
    });

    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, status: 'returned' } : i))
    );

    addAuditLog('إرجاع فاتورة', `تم إرجاع الفاتورة #${invoiceId} واستعادة بضاعتها للمخزون.`);
    return true;
  };

  // Expenses
  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      createdBy: currentUser.name,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    addAuditLog('تسجيل مصروف تشغيلي', `تسجيل مصروف: ${newExpense.title} بقيمة ${newExpense.amount} ج.س (${newExpense.category})`);
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)));
    addAuditLog('تعديل مصروف تشغيلي', `تعديل مصروف: ${updatedExpense.title} بقيمة ${updatedExpense.amount} ج.س`);
  };

  const deleteExpense = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (exp) {
      addAuditLog('حذف مصروف تشغيلي', `تم حذف المصروف: ${exp.title} بقيمة ${exp.amount} ج.س`);
    }
  };

  // Staff Management
  const updateStaffMember = (updated: UserProfile) => {
    setStaffList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
    addAuditLog('تعديل صلاحيات موظف', `تحديث بيانات وصلاحيات الموظف: ${updated.name}`);
  };

  const addStaffMember = (newUserData: Omit<UserProfile, 'id'>) => {
    const newUser: UserProfile = {
      ...newUserData,
      id: `user-${Date.now()}`,
    };
    setStaffList((prev) => [...prev, newUser]);
    addAuditLog('إضافة موظف جديد', `إضافة موظف: ${newUser.name} بدور: ${newUser.role}`);
  };

  // Sudanese Dictionary Management
  const addDictionaryItem = (itemData: Omit<TradeDictionaryItem, 'id'>) => {
    const newItem: TradeDictionaryItem = {
      ...itemData,
      id: `dict-${Date.now()}`,
    };
    setDictionary((prev) => [newItem, ...prev]);
    addAuditLog('تحديث القاموس التجاري', `إضافة مصطلح تجاري سوداني جديد: "${newItem.dialectTerm}"`);
  };

  const deleteDictionaryItem = (id: string) => {
    setDictionary((prev) => prev.filter((d) => d.id !== id));
  };

  // Stock Notifications Computed & Handlers
  const stockNotifications: StockNotification[] = products
    .filter((p) => p.currentStock <= p.minStockAlert)
    .map((p) => {
      const isCritical = p.currentStock <= 0 || p.currentStock <= p.minStockAlert * 0.4;
      return {
        id: `notif-${p.id}`,
        productId: p.id,
        productName: p.nameAr,
        code: p.code,
        currentStock: p.currentStock,
        minStockAlert: p.minStockAlert,
        baseUnit: p.baseUnit,
        shelfLocation: p.shelfLocation,
        severity: (p.currentStock <= 0 ? 'critical' : isCritical ? 'warning' : 'info') as any,
        timestamp: new Date().toLocaleDateString('ar-SD'),
        isRead: readNotificationIds.includes(p.id),
        isDismissed: dismissedNotificationIds.includes(p.id),
      };
    })
    .sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return (a.currentStock / (a.minStockAlert || 1)) - (b.currentStock / (b.minStockAlert || 1));
    });

  const unreadNotificationsCount = stockNotifications.filter((n) => !n.isRead && !n.isDismissed).length;

  const markNotificationAsRead = (id: string) => {
    const prodId = id.replace('notif-', '');
    setReadNotificationIds((prev) => (prev.includes(prodId) ? prev : [...prev, prodId]));
  };

  const markAllNotificationsAsRead = () => {
    const allIds = products.filter((p) => p.currentStock <= p.minStockAlert).map((p) => p.id);
    setReadNotificationIds(allIds);
  };

  const dismissNotification = (id: string) => {
    const prodId = id.replace('notif-', '');
    setDismissedNotificationIds((prev) => (prev.includes(prodId) ? prev : [...prev, prodId]));
  };

  const restoreDismissedNotifications = () => {
    setDismissedNotificationIds([]);
  };

  const quickRestockProduct = (productId: string, quantityToAdd: number): boolean => {
    const success = adjustStock(
      productId,
      quantityToAdd,
      'purchase',
      `توريد سريع استجابة لتنبيه إعادة الطلب (+${quantityToAdd})`
    );
    if (success) {
      setReadNotificationIds((prev) => prev.filter((id) => id !== productId));
      setDismissedNotificationIds((prev) => prev.filter((id) => id !== productId));
    }
    return success;
  };

  const updateProductReorderLevel = (productId: string, newMinStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, minStockAlert: newMinStock } : p))
    );
    addAuditLog('تعديل حد إعادة الطلب', `تحديث حد الطلب للمنتج إلى ${newMinStock}`);
  };

  // --- Web Speech API Voice Notification Engine ---
  const isSpeechSupported = speechAlertService.checkSupport();

  const updateSpeechSettings = (newSettings: Partial<SpeechSettings>) => {
    speechAlertService.saveSettings(newSettings);
    setSpeechSettingsState(speechAlertService.getSettings());
  };

  const speakAlert = (text: string, force: boolean = false, priority: 'critical' | 'normal' = 'normal'): boolean => {
    return speechAlertService.speak(text, force, priority);
  };

  const announceProductStockAlert = (product: Product, force: boolean = false): boolean => {
    return speechAlertService.announceStockAlert(
      product.nameAr,
      product.currentStock,
      product.baseUnit,
      product.minStockAlert,
      force
    );
  };

  const stopSpeechAlert = () => {
    speechAlertService.cancel();
  };

  // --- Database Backup, Scheduling & Restore Engine ---
  const updateBackupSchedule = (config: Partial<BackupScheduleConfig>) => {
    setBackupScheduleState((prev) => {
      const updated = { ...prev, ...config };
      // Calculate next backup date based on frequency
      const now = new Date();
      if (updated.frequency === 'daily') {
        now.setDate(now.getDate() + 1);
      } else if (updated.frequency === 'weekly') {
        now.setDate(now.getDate() + 7);
      } else if (updated.frequency === 'monthly') {
        now.setMonth(now.getMonth() + 1);
      }
      updated.nextBackupDate = `${now.toISOString().split('T')[0]} ${updated.timeOfDay}`;
      return updated;
    });
    addAuditLog('تعديل جدولة النسخ الاحتياطي', `تحديث وتيرة النسخ الاحتياطي إلى ${config.frequency || backupSchedule.frequency}`);
  };

  const createDatabaseSnapshot = (
    title?: string,
    type: 'manual' | 'scheduled' | 'pre_restore_checkpoint' = 'manual'
  ): DatabaseSnapshot => {
    const now = new Date();
    const dateStr = now.toLocaleString('ar-SD', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const totalRev = invoices
      .filter((i) => i.status === 'completed')
      .reduce((s, i) => s + i.total, 0);

    const snapshot: DatabaseSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: dateStr,
      title:
        title ||
        (type === 'scheduled'
          ? `نسخة مجدولة (${backupSchedule.frequency === 'daily' ? 'يومية' : backupSchedule.frequency === 'weekly' ? 'أسبوعية' : 'شهرية'})`
          : type === 'pre_restore_checkpoint'
          ? 'نقطة أمان تلقائية قبل الاستعادة'
          : 'نسخة احتياطية يدوية'),
      type,
      data: {
        products,
        invoices,
        expenses,
        staffList,
        dictionary,
        auditLogs,
        stockMovements,
        storeSettings: {
          storeName,
          storePhone,
          storeAddress,
          businessType,
        },
      },
      stats: {
        productsCount: products.length,
        invoicesCount: invoices.length,
        expensesCount: expenses.length,
        totalRevenue: totalRev,
      },
      version: '1.2.0',
    };

    setDatabaseSnapshots((prev) => {
      const updated = [snapshot, ...prev];
      return updated.slice(0, backupSchedule.maxSnapshotsToKeep || 15);
    });

    setBackupScheduleState((prev) => ({
      ...prev,
      lastBackupDate: dateStr,
    }));

    addAuditLog('إنشاء نسخة احتياطية', `تم حفظ نسخة "${snapshot.title}" بحجم ${snapshot.stats.productsCount} صنف و${snapshot.stats.invoicesCount} فاتورة.`);

    return snapshot;
  };

  const exportDatabaseAsJSON = () => {
    const snapshot = createDatabaseSnapshot('تصدير قاعدة البيانات (JSON)');
    const jsonString = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hisabati_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addAuditLog('تصدير JSON', 'تصدير ملف نسخة احتياطية كاملة للمتجر بصيغة JSON.');
  };

  const exportDatabaseAsCSV = (tableName: 'products' | 'invoices' | 'expenses' | 'all' = 'products') => {
    const BOM = '\uFEFF'; // UTF-8 Byte Order Mark for Excel Arabic support

    const downloadCSVFile = (content: string, filename: string) => {
      const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const dateStr = new Date().toISOString().slice(0, 10);

    if (tableName === 'products' || tableName === 'all') {
      const productHeaders = ['الباركود', 'اسم المنتج', 'التصنيف', 'سعر الشراء', 'سعر البيع', 'الرصيد المتاح', 'الوحدة الأساسية', 'حد الطلب', 'موقع الرف'];
      const productRows = products.map((p) => [
        `"${p.code}"`,
        `"${p.nameAr.replace(/"/g, '""')}"`,
        `"${p.categoryAr.replace(/"/g, '""')}"`,
        p.purchasePrice,
        p.sellingPrice,
        p.currentStock,
        `"${p.baseUnit}"`,
        p.minStockAlert,
        `"${p.shelfLocation.replace(/"/g, '""')}"`,
      ]);
      const csv = [productHeaders.join(','), ...productRows.map((r) => r.join(','))].join('\n');
      downloadCSVFile(csv, `hisabati_products_${dateStr}.csv`);
    }

    if (tableName === 'invoices' || tableName === 'all') {
      const invoiceHeaders = ['رقم الفاتورة', 'التاريخ', 'اسم العميل', 'طريقة الدفع', 'المجموع الفرعي', 'الخصم', 'الإجمالي', 'المدفوع', 'المتبقي', 'الكاشير', 'الحالة'];
      const invoiceRows = invoices.map((i) => [
        `"${i.id}"`,
        `"${i.date}"`,
        `"${(i.customerName || 'نقدي').replace(/"/g, '""')}"`,
        `"${i.paymentMethod}"`,
        i.subtotal,
        i.discount,
        i.total,
        i.paidAmount,
        i.remainingAmount,
        `"${i.cashierName.replace(/"/g, '""')}"`,
        `"${i.status}"`,
      ]);
      const csv = [invoiceHeaders.join(','), ...invoiceRows.map((r) => r.join(','))].join('\n');
      downloadCSVFile(csv, `hisabati_invoices_${dateStr}.csv`);
    }

    if (tableName === 'expenses' || tableName === 'all') {
      const expenseHeaders = ['المعرف', 'البيان', 'المبلغ', 'التصنيف', 'التاريخ', 'ملاحظات', 'المسجل'];
      const expenseRows = expenses.map((e) => [
        `"${e.id}"`,
        `"${e.title.replace(/"/g, '""')}"`,
        e.amount,
        `"${e.category}"`,
        `"${e.date}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
        `"${(e.createdBy || '').replace(/"/g, '""')}"`,
      ]);
      const csv = [expenseHeaders.join(','), ...expenseRows.map((r) => r.join(','))].join('\n');
      downloadCSVFile(csv, `hisabati_expenses_${dateStr}.csv`);
    }

    addAuditLog('تصدير CSV', `تم تصدير جداول البيانات (${tableName}) كملفات CSV متوافقة مع إكسل.`);
  };

  const restoreDatabaseFromSnapshot = (snapshotId: string): boolean => {
    const target = databaseSnapshots.find((s) => s.id === snapshotId);
    if (!target) return false;

    // Safety checkpoint before overwriting
    createDatabaseSnapshot('نقطة أمان تلقائية قبل استعادة سابقة', 'pre_restore_checkpoint');

    setProducts(target.data.products || []);
    setInvoices(target.data.invoices || []);
    setExpenses(target.data.expenses || []);
    if (target.data.staffList) setStaffList(target.data.staffList);
    if (target.data.dictionary) setDictionary(target.data.dictionary);
    if (target.data.auditLogs) setAuditLogs(target.data.auditLogs);
    if (target.data.stockMovements) setStockMovements(target.data.stockMovements);
    if (target.data.storeSettings) {
      setStoreName(target.data.storeSettings.storeName);
      setStorePhone(target.data.storeSettings.storePhone);
      setStoreAddress(target.data.storeSettings.storeAddress);
      setBusinessType(target.data.storeSettings.businessType);
    }

    addAuditLog('استعادة قاعدة البيانات', `تمت استعادة البيانات بنجاح من النسخة المحفوظة: ${target.title} (${target.createdAt})`);
    return true;
  };

  const restoreDatabaseFromJSONString = (
    jsonContent: string,
    mode: 'overwrite' | 'merge' = 'overwrite'
  ): { success: boolean; message: string; stats?: any } => {
    try {
      const parsed = JSON.parse(jsonContent);

      // Support either direct snapshot format or wrapper
      const snapshotData = parsed.data || parsed;
      if (!snapshotData.products || !Array.isArray(snapshotData.products)) {
        return {
          success: false,
          message: 'الملف غير صالح: لا يحتوي على بنية بيانات المنتجات والمخزون المطلوبة.',
        };
      }

      // Create safety checkpoint first
      createDatabaseSnapshot('نقطة أمان تلقائية قبل استيراد ملف خارجي', 'pre_restore_checkpoint');

      if (mode === 'overwrite') {
        setProducts(snapshotData.products);
        if (snapshotData.invoices) setInvoices(snapshotData.invoices);
        if (snapshotData.expenses) setExpenses(snapshotData.expenses);
        if (snapshotData.staffList) setStaffList(snapshotData.staffList);
        if (snapshotData.dictionary) setDictionary(snapshotData.dictionary);
        if (snapshotData.auditLogs) setAuditLogs(snapshotData.auditLogs);
        if (snapshotData.stockMovements) setStockMovements(snapshotData.stockMovements);
        if (snapshotData.storeSettings) {
          if (snapshotData.storeSettings.storeName) setStoreName(snapshotData.storeSettings.storeName);
          if (snapshotData.storeSettings.storePhone) setStorePhone(snapshotData.storeSettings.storePhone);
          if (snapshotData.storeSettings.storeAddress) setStoreAddress(snapshotData.storeSettings.storeAddress);
          if (snapshotData.storeSettings.businessType) setBusinessType(snapshotData.storeSettings.businessType);
        }
      } else {
        // Merge mode
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = snapshotData.products.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
        if (snapshotData.invoices) {
          setInvoices((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newItems = snapshotData.invoices.filter((i: any) => !existingIds.has(i.id));
            return [...prev, ...newItems];
          });
        }
        if (snapshotData.expenses) {
          setExpenses((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newItems = snapshotData.expenses.filter((e: any) => !existingIds.has(e.id));
            return [...prev, ...newItems];
          });
        }
      }

      const importedStats = {
        productsCount: snapshotData.products.length,
        invoicesCount: snapshotData.invoices ? snapshotData.invoices.length : 0,
        expensesCount: snapshotData.expenses ? snapshotData.expenses.length : 0,
      };

      addAuditLog('استعادة بيانات خارجية', `تم استيراد ${importedStats.productsCount} صنف و${importedStats.invoicesCount} فاتورة (نمط: ${mode === 'overwrite' ? 'استبدال كامل' : 'دمج'}).`);

      return {
        success: true,
        message: 'تمت استعادة البيانات بنجاح وفحص سلامة السجلات.',
        stats: importedStats,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `خطأ أثناء قراءة ملف النسخة الاحتياطية: ${err.message || 'تنسيق JSON غير صالح'}`,
      };
    }
  };

  const restoreDatabaseFromCSVString = (
    csvContent: string,
    targetType: 'products' | 'expenses'
  ): { success: boolean; message: string; count?: number } => {
    try {
      const lines = csvContent.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        return { success: false, message: 'ملف CSV فارغ أو لا يحتوي على صفوف بيانات كافية.' };
      }

      // Checkpoint
      createDatabaseSnapshot('نقطة أمان قبل استيراد CSV', 'pre_restore_checkpoint');

      let importedCount = 0;
      if (targetType === 'products') {
        const newProducts: Product[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 5) {
            const code = cols[0] || `SKU-${Date.now()}-${i}`;
            const nameAr = cols[1];
            const categoryAr = cols[2] || 'عام';
            const purchasePrice = parseFloat(cols[3]) || 0;
            const sellingPrice = parseFloat(cols[4]) || 0;
            const currentStock = parseFloat(cols[5]) || 0;
            const baseUnit = cols[6] || 'حبة';
            const minStockAlert = parseFloat(cols[7]) || 10;
            const shelfLocation = cols[8] || 'الرف الرئيسي';

            if (nameAr) {
              newProducts.push({
                id: `prod-csv-${Date.now()}-${i}`,
                code,
                nameAr,
                categoryAr,
                purchasePrice,
                sellingPrice,
                currentStock,
                baseUnit,
                minStockAlert,
                shelfLocation,
                businessType,
                aliases: [nameAr],
                allowedUnits: [],
              });
              importedCount++;
            }
          }
        }
        if (newProducts.length > 0) {
          setProducts((prev) => [...prev, ...newProducts]);
        }
      }

      addAuditLog('استيراد CSV', `تم استيراد ${importedCount} سجل بنجاح من ملف CSV.`);
      return { success: true, message: `تم استيراد ${importedCount} صنف بنجاح!`, count: importedCount };
    } catch (err: any) {
      return { success: false, message: `فشل استيراد CSV: ${err.message}` };
    }
  };

  const deleteSnapshot = (snapshotId: string) => {
    setDatabaseSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
    addAuditLog('حذف نقطة استعادة', `تم حذف النسخة الاحتياطية #${snapshotId}`);
  };

  // Email Notification Handlers
  const updateEmailConfig = (config: Partial<EmailNotificationConfig>) => {
    setEmailConfigState((prev) => ({ ...prev, ...config }));
    addAuditLog('تحديث إعدادات البريد', 'تم تحديث إعدادات التنبيهات والتقارير البريدية لمدير المتجر.');
  };

  const deleteEmailLog = (logId: string) => {
    setSentEmailLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  const clearAllEmailLogs = () => {
    setSentEmailLogs([]);
    addAuditLog('سجل البريد', 'تم مسح كافة سجلات الإشعارات البريدية.');
  };

  const sendDailySalesSummaryEmail = async (
    recipientOverride?: string
  ): Promise<{ success: boolean; message: string; logId?: string }> => {
    const targetRecipient = recipientOverride || emailConfig.managerEmail;
    if (!targetRecipient) {
      return { success: false, message: 'يرجى تحديد عنوان البريد الإلكتروني لمدير المتجر أولاً.' };
    }

    try {
      const activeInvoices = invoices.filter((i) => i.status === 'completed');
      const totalSales = activeInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalCOGS = activeInvoices.reduce((sum, inv) => sum + (inv.costOfGoodsSold || 0), 0);
      const grossProfit = totalSales - totalCOGS;
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const realNetProfit = grossProfit - totalExpenses;

      const cashSales = activeInvoices
        .filter((i) => i.paymentMethod === 'cash')
        .reduce((sum, i) => sum + i.total, 0);
      const bankakSales = activeInvoices
        .filter((i) => i.paymentMethod === 'bankak')
        .reduce((sum, i) => sum + i.total, 0);
      const fawrySales = activeInvoices
        .filter((i) => i.paymentMethod === 'fawry')
        .reduce((sum, i) => sum + i.total, 0);
      const creditSales = activeInvoices
        .filter((i) => i.paymentMethod === 'credit')
        .reduce((sum, i) => sum + i.total, 0);

      const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;
      const todayDate = new Date().toLocaleDateString('ar-SD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const emailSubject = `📊 التقرير المالي وملخص المبيعات اليومي [${todayDate}] - ${storeName || 'حساباتي السودان'}`;
      const summaryText = `إجمالي المبيعات: ${totalSales.toLocaleString('ar-SD')} ج.س | الأرباح الصافية: ${realNetProfit.toLocaleString('ar-SD')} ج.س | الفواتير: ${activeInvoices.length} | تنبيهات النواقص: ${lowStockCount}`;

      const htmlContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #090d16; color: #f1f5f9; border-radius: 16px; border: 1px solid #1e293b; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 20px; color: #ffffff; font-weight: 800;">🇸🇩 ${storeName || 'حساباتي السودان'}</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #10b981;">تقرير ملخص المبيعات والأداء المالي اليومي</p>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">${todayDate} • نظام POS المحاسبي الذكي</div>
          </div>

          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            مرحباً سعادة المدير، نرفق لك الملخص التنفيذي لحركة المبيعات وصافي الأرباح ونشاط المتجر لليوم:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
            <tbody>
              <tr style="background: #0f172a; border-bottom: 1px solid #334155;">
                <td style="padding: 12px; font-weight: bold; color: #94a3b8;">إجمالي المبيعات المحققة</td>
                <td style="padding: 12px; color: #38bdf8; font-weight: bold; font-family: monospace; font-size: 15px; text-align: left;">${totalSales.toLocaleString('ar-SD')} ج.س (${activeInvoices.length} فواتير)</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 12px; font-weight: bold; color: #94a3b8;">تكلفة البضاعة المباعة (COGS)</td>
                <td style="padding: 12px; color: #f59e0b; font-weight: bold; font-family: monospace; text-align: left;">${totalCOGS.toLocaleString('ar-SD')} ج.س</td>
              </tr>
              <tr style="background: #0f172a; border-bottom: 1px solid #334155;">
                <td style="padding: 12px; font-weight: bold; color: #94a3b8;">المصروفات التشغيلية المباشرة</td>
                <td style="padding: 12px; color: #f43f5e; font-weight: bold; font-family: monospace; text-align: left;">${totalExpenses.toLocaleString('ar-SD')} ج.س</td>
              </tr>
              <tr style="background: #064e3b; border-bottom: 1px solid #059669;">
                <td style="padding: 12px; font-weight: bold; color: #a7f3d0; font-size: 14px;">صافي الربح الفعلي المحقق</td>
                <td style="padding: 12px; color: #34d399; font-weight: 800; font-family: monospace; font-size: 16px; text-align: left;">${realNetProfit.toLocaleString('ar-SD')} ج.س</td>
              </tr>
            </tbody>
          </table>

          <div style="background: #0f172a; padding: 14px; border-radius: 12px; border: 1px solid #334155; margin-top: 15px;">
            <div style="font-size: 13px; font-weight: bold; color: #e2e8f0; margin-bottom: 8px;">توزيع طرق التحصيل والدفع:</div>
            <div style="font-size: 12px; color: #94a3b8; line-height: 1.8;">
              <div>💵 كاش ونقدي: <b style="color: #f8fafc;">${cashSales.toLocaleString('ar-SD')} ج.س</b></div>
              <div>📱 تطبيق بنكك (Bankak): <b style="color: #38bdf8;">${bankakSales.toLocaleString('ar-SD')} ج.س</b></div>
              <div>⚡ تطبيق فوري (Fawry): <b style="color: #a855f7;">${fawrySales.toLocaleString('ar-SD')} ج.س</b></div>
              <div>📝 آجل / ذمم: <b style="color: #f59e0b;">${creditSales.toLocaleString('ar-SD')} ج.س</b></div>
            </div>
          </div>

          ${
            lowStockCount > 0
              ? `<div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 12px; border-radius: 10px; margin-top: 16px; font-size: 12px; color: #fbbf24;">
                  ⚠️ <b>تنبيه مخزون:</b> يوجد <b>${lowStockCount}</b> أصناف بلغت حد إعادة الطلب وتحتاج للتوريد لضمان استمرارية البيع.
                </div>`
              : ''
          }

          <div style="border-top: 1px solid #1e293b; margin-top: 24px; padding-top: 14px; font-size: 11px; color: #64748b; text-align: center;">
            تم إرسال هذا التقرير آلياً وفق إعدادات التنبيهات البريدية لنظام «حساباتي السودان» • مرسل إلى: ${targetRecipient}
          </div>
        </div>
      `;

      const response = await fetch('/api/notifications/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: targetRecipient,
          subject: emailSubject,
          type: 'daily_summary',
          summaryText,
          htmlContent,
        }),
      });

      const resData = await response.json();
      const newLogId = resData.messageId || `mail-${Date.now()}`;

      const newLog: SentEmailLog = {
        id: newLogId,
        timestamp: new Date().toLocaleString('ar-SD'),
        recipient: targetRecipient,
        subject: emailSubject,
        type: 'daily_summary',
        status: 'delivered',
        summaryText,
        htmlPreview: htmlContent,
      };

      setSentEmailLogs((prev) => [newLog, ...prev]);
      setEmailConfigState((prev) => ({
        ...prev,
        lastDailyReportSent: new Date().toLocaleString('ar-SD'),
      }));

      addAuditLog('إرسال تقرير مبيعات بريدي', `تم إرسال ملخص المبيعات اليومي إلى بريد المدير: ${targetRecipient}`);

      return {
        success: true,
        message: `تم إرسال التقرير اليومي بنجاح إلى: ${targetRecipient}`,
        logId: newLogId,
      };
    } catch (err: any) {
      console.error('Error sending daily summary email:', err);
      return { success: false, message: `فشل الإرسال: ${err.message || 'خطأ في الاتصال بخادم البريد'}` };
    }
  };

  const sendLowStockAlertEmail = async (
    productsToAlert?: Product[],
    recipientOverride?: string
  ): Promise<{ success: boolean; message: string; logId?: string }> => {
    const targetRecipient = recipientOverride || emailConfig.managerEmail;
    if (!targetRecipient) {
      return { success: false, message: 'يرجى تحديد عنوان البريد الإلكتروني لمدير المتجر أولاً.' };
    }

    const itemsToReport =
      productsToAlert && productsToAlert.length > 0
        ? productsToAlert
        : products.filter((p) => p.currentStock <= p.minStockAlert);

    if (itemsToReport.length === 0) {
      return { success: true, message: 'كافة الأصناف في المخزون تتجاوز حد إعادة الطلب، لا توجد نواقص حرجة حالياً.' };
    }

    try {
      const emailSubject = `⚠️ تنبيه عاجل: [${itemsToReport.length} أصناف] بلغت مستوى إعادة الطلب - ${storeName || 'حساباتي السودان'}`;
      const summaryText = `تنبيه نواقص لـ ${itemsToReport.length} أصناف حرجة: ${itemsToReport.slice(0, 3).map((p) => p.nameAr).join('، ')}${itemsToReport.length > 3 ? ' وغيرها' : ''}`;

      const htmlContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #090d16; color: #f1f5f9; border-radius: 16px; border: 1px solid #451a03; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 14px; margin-bottom: 18px;">
            <h1 style="margin: 0; font-size: 19px; color: #f59e0b; font-weight: 800;">⚠️ تنبيه فوري بنواقص المخزون ومستوى إعادة الطلب</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">متجر: ${storeName || 'حساباتي السودان'}</p>
          </div>

          <p style="font-size: 14px; color: #e2e8f0; line-height: 1.6;">
            عزيزي مدير المتجر، وصل رصيد الأصناف التالية إلى <strong>مستوى إعادة الطلب (Reorder Level)</strong> أو أقل منه. يرجى التواصل مع الموردين والتوريد الفوري لتفادي نفاد البضاعة:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px;">
            <thead>
              <tr style="background: #1e293b; color: #94a3b8; text-align: right;">
                <th style="padding: 10px; border-radius: 6px 0 0 6px;">اسم المنتج</th>
                <th style="padding: 10px;">الرصيد المتبقي</th>
                <th style="padding: 10px;">حد إعادة الطلب</th>
                <th style="padding: 10px; border-radius: 0 6px 6px 0;">مكان التخزين / الرف</th>
              </tr>
            </thead>
            <tbody>
              ${itemsToReport
                .map(
                  (item) => `
                <tr style="border-bottom: 1px solid #1e293b; background: ${item.currentStock <= 0 ? 'rgba(239, 68, 68, 0.1)' : 'transparent'};">
                  <td style="padding: 10px; color: #f8fafc; font-weight: 600;">
                    ${item.nameAr}
                    <div style="font-size: 10px; color: #64748b; font-family: monospace;">باركود: ${item.code}</div>
                  </td>
                  <td style="padding: 10px; color: ${item.currentStock <= 0 ? '#ef4444' : '#f59e0b'}; font-weight: bold; font-family: monospace;">
                    ${item.currentStock} ${item.baseUnit}
                  </td>
                  <td style="padding: 10px; color: #94a3b8; font-family: monospace;">
                    ${item.minStockAlert} ${item.baseUnit}
                  </td>
                  <td style="padding: 10px; color: #38bdf8;">
                    ${item.shelfLocation || 'غير محدد'}
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div style="background: #0f172a; padding: 12px; border-radius: 10px; border: 1px solid #334155; font-size: 12px; color: #94a3b8;">
            💡 <b>إجراء مقترح:</b> يمكنك استخدام ميزة «إعادة التوريد السريع» أو تسجيل فاتورة مشتريات جديدة من قائمة المخزون لتحديث الأرصدة تلقائياً.
          </div>

          <div style="border-top: 1px solid #1e293b; margin-top: 24px; padding-top: 12px; font-size: 11px; color: #64748b; text-align: center;">
            إشعار آلي مرسل إلى: ${targetRecipient}
          </div>
        </div>
      `;

      const response = await fetch('/api/notifications/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: targetRecipient,
          subject: emailSubject,
          type: 'low_stock_alert',
          summaryText,
          htmlContent,
        }),
      });

      const resData = await response.json();
      const newLogId = resData.messageId || `mail-${Date.now()}`;

      const newLog: SentEmailLog = {
        id: newLogId,
        timestamp: new Date().toLocaleString('ar-SD'),
        recipient: targetRecipient,
        subject: emailSubject,
        type: 'low_stock_alert',
        status: 'delivered',
        summaryText,
        htmlPreview: htmlContent,
      };

      setSentEmailLogs((prev) => [newLog, ...prev]);
      setEmailConfigState((prev) => ({
        ...prev,
        lastLowStockAlertSent: new Date().toLocaleString('ar-SD'),
      }));

      addAuditLog('إرسال تنبيه مخزون بريدي', `تم إرسال تنبيه بنواقص المخزون لـ ${itemsToReport.length} أصناف إلى: ${targetRecipient}`);

      return {
        success: true,
        message: `تم إرسال تنبيه النواقص (${itemsToReport.length} أصناف) بنجاح إلى: ${targetRecipient}`,
        logId: newLogId,
      };
    } catch (err: any) {
      console.error('Error sending low stock alert email:', err);
      return { success: false, message: `فشل الإرسال: ${err.message || 'خطأ في الاتصال بخادم البريد'}` };
    }
  };

  const sendTestEmail = async (
    recipientOverride?: string
  ): Promise<{ success: boolean; message: string; logId?: string }> => {
    const targetRecipient = recipientOverride || emailConfig.managerEmail;
    if (!targetRecipient) {
      return { success: false, message: 'يرجى كتابة بريد إلكتروني لإرسال التجربة.' };
    }

    try {
      const emailSubject = `🧪 رسالة اختبار الاتصال بنظام الإشعارات - ${storeName || 'حساباتي السودان'}`;
      const summaryText = 'رسالة فحص تجريبية للتحقق من وصول الإشعارات البريدية بنجاح.';

      const htmlContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #090d16; color: #f1f5f9; border-radius: 14px; border: 1px solid #10b981; padding: 22px;">
          <h2 style="color: #10b981; margin: 0 0 10px 0;">🧪 رسالة فحص الاتصال بالبريد</h2>
          <p style="color: #cbd5e1; font-size: 14px;">تم استلام هذه الرسالة بنجاح من خادم إشعارات تطبيق <strong>${storeName || 'حساباتي السودان'}</strong>.</p>
          <div style="background: #0f172a; padding: 12px; border-radius: 8px; font-size: 12px; color: #38bdf8; margin: 15px 0;">
            ✓ خادم الإشعارات: نشط وجاهز<br/>
            ✓ حالة قاعدة البيانات: متصلة ومحدثة<br/>
            ✓ تاريخ الاختبار: ${new Date().toLocaleString('ar-SD')}
          </div>
          <p style="color: #64748b; font-size: 11px;">هذا البريد مخصص لاختبار إعدادات صندوق الوارد لمدير المتجر.</p>
        </div>
      `;

      const response = await fetch('/api/notifications/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: targetRecipient,
          subject: emailSubject,
          type: 'test',
          summaryText,
          htmlContent,
        }),
      });

      const resData = await response.json();
      const newLogId = resData.messageId || `mail-test-${Date.now()}`;

      const newLog: SentEmailLog = {
        id: newLogId,
        timestamp: new Date().toLocaleString('ar-SD'),
        recipient: targetRecipient,
        subject: emailSubject,
        type: 'test',
        status: 'delivered',
        summaryText,
        htmlPreview: htmlContent,
      };

      setSentEmailLogs((prev) => [newLog, ...prev]);
      addAuditLog('فحص البريد', `تم إرسال رسالة بريدية تجريبية إلى: ${targetRecipient}`);

      return {
        success: true,
        message: `تم إرسال الرسالة التجريبية بنجاح إلى: ${targetRecipient}`,
        logId: newLogId,
      };
    } catch (err: any) {
      return { success: false, message: `فشل إرسال التجربة: ${err.message}` };
    }
  };

  // Reset demo data
  const resetToDefaultData = () => {
    setProducts(INITIAL_PRODUCTS);
    setStaffList(INITIAL_STAFF);
    setInvoices(INITIAL_INVOICES);
    setExpenses(INITIAL_EXPENSES);
    setDictionary(INITIAL_DICTIONARY);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setStockMovements(INITIAL_MOVEMENTS);
    setCurrentUser(INITIAL_STAFF[0]);
    setReadNotificationIds([]);
    setDismissedNotificationIds([]);
    setVatSettingsState(DEFAULT_VAT_SETTINGS);
    localStorage.clear();
    addAuditLog('إعادة ضبط البيانات', 'تمت استعادة البيانات التجريبية الافتراضية.');
  };

  // VAT and Tax calculation methods
  const updateVatSettings = (newSettings: Partial<VatSettings>) => {
    setVatSettingsState((prev) => ({ ...prev, ...newSettings }));
    addAuditLog(
      'تحديث إعدادات الضريبة',
      `تم تعديل إعدادات ضريبة القيمة المضافة (النسبة: ${newSettings.taxRate ?? vatSettings.taxRate}%).`
    );
  };

  const getMonthlyTaxReport = (year: number, month: number): MonthlyTaxReportSummary => {
    return generateMonthlyTaxReport(invoices, expenses, vatSettings, year, month);
  };

  const availableTaxPeriods = getAvailableTaxPeriods(invoices, expenses);

  const exportTaxReportCSV = (report: MonthlyTaxReportSummary) => {
    const periodInvoices = invoices.filter((inv) => {
      if (inv.status !== 'completed') return false;
      const ym = parseYearMonth(inv.date);
      return ym && ym.year === report.year && ym.month === report.month;
    });
    exportTaxReportToCSV(report, periodInvoices, vatSettings);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        businessType,
        setBusinessType,
        currentUser,
        setCurrentUser,
        staffList,
        updateStaffMember,
        addStaffMember,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        invoices,
        createInvoice,
        returnInvoice,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        dictionary,
        addDictionaryItem,
        deleteDictionaryItem,
        auditLogs,
        stockMovements,
        priceHistories,
        resetToDefaultData,
        storeName,
        setStoreName,
        storePhone,
        setStorePhone,
        storeAddress,
        setStoreAddress,
        calculateItemPrice,
        stockNotifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        dismissNotification,
        restoreDismissedNotifications,
        quickRestockProduct,
        updateProductReorderLevel,
        speechSettings,
        updateSpeechSettings,
        isSpeechSupported,
        speakAlert,
        announceProductStockAlert,
        stopSpeechAlert,
        backupSchedule,
        updateBackupSchedule,
        databaseSnapshots,
        createDatabaseSnapshot,
        exportDatabaseAsJSON,
        exportDatabaseAsCSV,
        restoreDatabaseFromSnapshot,
        restoreDatabaseFromJSONString,
        restoreDatabaseFromCSVString,
        deleteSnapshot,
        emailConfig,
        updateEmailConfig,
        sentEmailLogs,
        sendDailySalesSummaryEmail,
        sendLowStockAlertEmail,
        sendTestEmail,
        deleteEmailLog,
        clearAllEmailLogs,
        vatSettings,
        updateVatSettings,
        getMonthlyTaxReport,
        availableTaxPeriods,
        exportTaxReportCSV,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
