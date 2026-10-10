import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CustomersList } from './components/CustomersList';
import { CreditsList } from './components/CreditsList';
import { PaymentsList } from './components/PaymentsList';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { VerificationSuiteModal } from './components/VerificationSuiteModal';
import { NewCreditModal } from './components/NewCreditModal';
import { NewPaymentModal } from './components/NewPaymentModal';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
import { Customer, Credit, Payment } from './types';
import { Loader2 } from 'lucide-react';
import { LoginView } from './components/LoginView';

const MainAppContent: React.FC = () => {
  const { loading, currentUser, customers, credits, payments } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Modals state
  const [isVerificationSuiteOpen, setIsVerificationSuiteOpen] = useState(false);
  const [isNewCreditModalOpen, setIsNewCreditModalOpen] = useState(false);
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [preselectedCreditForPayment, setPreselectedCreditForPayment] = useState<Credit | null>(null);
  const [preselectedCustomerForCredit, setPreselectedCustomerForCredit] = useState<Customer | null>(null);

  // WhatsApp modal state
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    customerName: string;
    phone: string;
    amount: number;
    dueDate?: string;
  } | null>(null);

  const handleOpenNewPayment = (prefillCredit?: Credit) => {
    setPreselectedCreditForPayment(prefillCredit || null);
    setIsNewPaymentModalOpen(true);
  };

  const handleOpenNewCredit = (prefillCustomer?: Customer) => {
    setPreselectedCustomerForCredit(prefillCustomer || null);
    setIsNewCreditModalOpen(true);
  };

  const handleOpenWhatsApp = (customerName: string, phone: string, amount: number, dueDate?: string) => {
    setWhatsAppModalData({ customerName, phone, amount, dueDate });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-xl mb-4 animate-pulse">
          DDS
        </div>
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Chargement de DDS Crédit Confiance...</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Initialisation de la base sécurisée Cloud Firestore (Bamako)
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <Header
        onOpenVerificationSuite={() => setIsVerificationSuiteOpen(true)}
        onOpenNewCredit={() => handleOpenNewCredit()}
        onOpenNewPayment={() => handleOpenNewPayment()}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 lg:pb-8">
        
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenNewCredit={() => handleOpenNewCredit()}
          onOpenNewPayment={() => handleOpenNewPayment()}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentTab === 'dashboard' && (
            <Dashboard
              onOpenNewCustomer={() => setCurrentTab('customers')}
              onOpenNewCredit={() => handleOpenNewCredit()}
              onOpenNewPayment={handleOpenNewPayment}
              onOpenWhatsApp={handleOpenWhatsApp}
              onSelectTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersList
              onOpenNewCredit={(cust) => handleOpenNewCredit(cust)}
              onOpenNewPayment={(credit) => handleOpenNewPayment(credit)}
              onOpenWhatsApp={(name, phone, debt) => handleOpenWhatsApp(name, phone, debt)}
            />
          )}

          {currentTab === 'credits' && (
            <CreditsList
              onOpenNewPayment={handleOpenNewPayment}
              onOpenWhatsApp={handleOpenWhatsApp}
              isNewCreditModalOpen={isNewCreditModalOpen}
              onCloseNewCreditModal={() => setIsNewCreditModalOpen(false)}
              onOpenNewCreditModal={() => handleOpenNewCredit()}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentsList
              isNewPaymentModalOpen={isNewPaymentModalOpen}
              preselectedCreditForPayment={preselectedCreditForPayment}
              onCloseNewPaymentModal={() => setIsNewPaymentModalOpen(false)}
              onOpenNewPaymentModal={() => handleOpenNewPayment()}
            />
          )}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Verification Suite Modal */}
      {isVerificationSuiteOpen && (
        <VerificationSuiteModal onClose={() => setIsVerificationSuiteOpen(false)} />
      )}

      {/* New Credit Modal from any tab */}
      {isNewCreditModalOpen && currentTab !== 'credits' && (
        <NewCreditModal
          preselectedCustomer={preselectedCustomerForCredit}
          onClose={() => setIsNewCreditModalOpen(false)}
          onSuccess={() => setIsNewCreditModalOpen(false)}
        />
      )}

      {/* New Payment Modal from any tab */}
      {isNewPaymentModalOpen && currentTab !== 'payments' && (
        <NewPaymentModal
          preselectedCredit={preselectedCreditForPayment}
          onClose={() => setIsNewPaymentModalOpen(false)}
          onSuccess={() => setIsNewPaymentModalOpen(false)}
        />
      )}

      {/* WhatsApp Modal */}
      {whatsAppModalData && (
        <WhatsAppReminderModal
          customerName={whatsAppModalData.customerName}
          phone={whatsAppModalData.phone}
          amount={whatsAppModalData.amount}
          dueDate={whatsAppModalData.dueDate}
          onClose={() => setWhatsAppModalData(null)}
        />
      )}

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
