import {
  Product,
  UserProfile,
  SudaneseUnitDef,
  TradeDictionaryItem,
  Invoice,
  Expense,
  AuditLog,
  StockMovement,
  CustomerCreditAccount,
  CustomerCreditTransaction,
  Supplier,
  PurchaseInvoice,
} from '../types';

export const SUDANESE_UNITS: SudaneseUnitDef[] = [
  {
    id: 'kg',
    nameAr: 'كيلوجرام',
    pluralAr: 'كيلو / كيلوجرامات',
    symbolAr: 'كجم',
    type: 'weight',
    equivalentStandard: '1,000 جرام',
    description: 'الوحدة المترية القياسية للوزن في المبيعات التموينية والخضار.',
  },
  {
    id: 'ratl',
    nameAr: 'رطل',
    pluralAr: 'أرطال',
    symbolAr: 'رطل',
    type: 'weight',
    equivalentStandard: '450 جرام تقريباً (أو نصف كيلو في العرف)',
    description: 'الوحدة السودانية التقليدية الأكثر استخداماً في تجارة السكر والشاي والزيت.',
  },
  {
    id: 'ouqya',
    nameAr: 'أوقية (وقية)',
    pluralAr: 'أواقي',
    symbolAr: 'وقية',
    type: 'weight',
    equivalentStandard: '37.5 جرام',
    description: 'تستخدم في توابل الدكان، البن، والبهارات والعطور السودانية.',
  },
  {
    id: 'ton',
    nameAr: 'طن',
    pluralAr: 'أطنان',
    symbolAr: 'طن',
    type: 'weight',
    equivalentStandard: '1,000 كجم',
    description: 'يستخدم في تجارة الجملة الكبيرة، الأسمنت، السكر، والحبوب.',
  },
  {
    id: 'liter',
    nameAr: 'لتر',
    pluralAr: 'لترات',
    symbolAr: 'لتر',
    type: 'volume',
    equivalentStandard: '1,000 مل',
    description: 'وحدة قياس السوائل كالألبان والمياه والعصائر.',
  },
  {
    id: 'jirkana',
    nameAr: 'جركانة / باغة',
    pluralAr: 'جراكن / باغات',
    symbolAr: 'جركانة',
    type: 'container',
    equivalentStandard: 'غالباً 4 لتر أو 18 لتر (باغة زيت كبيرة)',
    description: 'عبوة الزيوت والسوائل التموينية الشائعة في المحلات السودانية.',
  },
  {
    id: 'piece',
    nameAr: 'حبة / قطعة',
    pluralAr: 'حبات / قطع',
    symbolAr: 'حبة',
    type: 'count',
    equivalentStandard: 'قطعة واحدة',
    description: 'للمعلبات، الصابون، البسكويت والمنتجات المفردة.',
  },
  {
    id: 'dasta',
    nameAr: 'دستة',
    pluralAr: 'دستات',
    symbolAr: 'دستة',
    type: 'count',
    equivalentStandard: '12 قطعة',
    description: 'الوحدة التجارية لبيع الصابون، الدفاتر، الأقلام، والمنظفات.',
  },
  {
    id: 'kartona',
    nameAr: 'كرتونة / باكت',
    pluralAr: 'كراتين / باكتات',
    symbolAr: 'كرتونة',
    type: 'container',
    equivalentStandard: 'من 12 إلى 48 قطعة حسب الصنف',
    description: 'العبوة الكلية للمصانع (مثل كرتونة صابون 24 حبة، باكت دقيق 10 كيلو).',
  },
  {
    id: 'gawal',
    nameAr: 'جوال / شكارة / شوال',
    pluralAr: 'جوالات / شكاير',
    symbolAr: 'جوال',
    type: 'container',
    equivalentStandard: '50 كجم (للسكر والدقيق) أو 100 كجم (للحبوب)',
    description: 'الوحدة الأساسية في تجارة الجملة للمحاصيل والمواد التموينية.',
  },
  {
    id: 'rabta',
    nameAr: 'ربطة',
    pluralAr: 'ربطات',
    symbolAr: 'ربطة',
    type: 'count',
    equivalentStandard: 'حزمة مجمعة',
    description: 'للخضروات الورقية (جرجير، ملوخية، كرجك) وأكياس التغليف.',
  },
  {
    id: 'kouz',
    nameAr: 'كوز / مكيال',
    pluralAr: 'كيزان',
    symbolAr: 'كوز',
    type: 'volume',
    equivalentStandard: 'مكيال تقليدي للحبوب والفول السوداني والذرة',
    description: 'مكيال بلدي شائع في الأسواق الشعبية ومحلات الغلال.',
  },
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_STAFF: UserProfile[] = [
  {
    id: 'user-01',
    name: 'المالك',
    role: 'owner',
    phone: '',
    permissions: {
      canViewProfits: true,
      canViewCOGS: true,
      canEditPrices: true,
      canOverrideStock: true,
      canManageStaff: true,
      canViewAuditLogs: true,
      canManageSettings: true,
      canProcessReturns: true,
    },
  },
];

export const INITIAL_DICTIONARY: TradeDictionaryItem[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_MOVEMENTS: StockMovement[] = [];

export const INITIAL_CUSTOMERS: CustomerCreditAccount[] = [];

export const INITIAL_CUSTOMER_TRANSACTIONS: CustomerCreditTransaction[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_PURCHASE_INVOICES: PurchaseInvoice[] = [];
