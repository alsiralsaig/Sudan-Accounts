/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LandingPageView } from './components/LandingPageView';
import { PosView } from './components/PosView';
import { InventoryView } from './components/InventoryView';
import { InvoicesView } from './components/InvoicesView';
import { DashboardView } from './components/DashboardView';
import { StaffView } from './components/StaffView';
import { DictionaryView } from './components/DictionaryView';
import { VerificationModal } from './components/VerificationModal';
import { BackupRestoreView } from './components/BackupRestoreView';
import { VoiceSaleAssistant } from './components/VoiceSaleAssistant';
import { InvoiceReceiptModal } from './components/InvoiceReceiptModal';
import { FinancialTaxReportsView } from './components/FinancialTaxReportsView';
import { ExpensesPnlView } from './components/ExpensesPnlView';
import {
  Heart,
  Store,
  FileCheck,
  ShieldAlert,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, resetToDefaultData, storeName } = useApp();

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const handleInvoiceCreated = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setActiveTab('pos');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar onOpenVoiceModal={() => setIsVoiceModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPageView
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onGoToPOS={() => setActiveTab('pos')}
          />
        )}

        {activeTab === 'pos' && (
          <PosView
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onViewInvoiceReceipt={(id) => setSelectedInvoiceId(id)}
          />
        )}

        {activeTab === 'inventory' && <InventoryView />}

        {activeTab === 'invoices' && (
          <InvoicesView onSelectInvoice={(id) => setSelectedInvoiceId(id)} />
        )}

        {activeTab === 'dashboard' && <DashboardView />}

        {activeTab === 'expenses' && <ExpensesPnlView />}

        {activeTab === 'taxes' && <FinancialTaxReportsView />}

        {activeTab === 'staff' && <StaffView />}

        {activeTab === 'dictionary' && <DictionaryView />}

        {activeTab === 'backup' && <BackupRestoreView />}

        {activeTab === 'verifier' && <VerificationModal />}
      </main>

      {/* Voice Sale Assistant Modal */}
      <VoiceSaleAssistant
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onInvoiceCreated={handleInvoiceCreated}
      />

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />

      {/* Global Footer (Hidden in print) */}
      <footer className="no-print bg-slate-950 border-t border-slate-900 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">حساباتي السودان</span>
            <span>-</span>
            <span>نظام محاسبي ذكي ونقاط بيع مصمم خصيصاً للتجار والأسواق السودانية 🇸🇩</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (confirm('هل تريد استعادة البيانات التجريبية الافتراضية؟')) {
                  resetToDefaultData();
                }
              }}
              className="text-slate-500 hover:text-amber-400 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط البيانات التجريبية</span>
            </button>
            <span>•</span>
            <span className="text-slate-600">دقة حسابية 100% بدون تخمين أسعار</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
