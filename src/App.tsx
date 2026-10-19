import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CustomersList } from './components/CustomersList';
import { SalesView } from './components/SalesView';
import { CreditsList } from './components/CreditsList';
import { PaymentsList } from './components/PaymentsList';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { VerificationSuiteModal } from './components/VerificationSuiteModal';
import { NewCustomerModal } from './components/NewCustomerModal';
import { NewSaleModal } from './components/NewSaleModal';
import { SaleReceiptModal } from './components/SaleReceiptModal';
import { NewCreditModal } from './components/NewCreditModal';
import { NewPaymentModal } from './components/NewPaymentModal';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { Customer, Credit, Payment, Sale } from './types';
import { printSaleThermalDirect } from './lib/print';
import { Loader2 } from 'lucide-react';
import { LoginView } from './components/LoginView';

const MainAppContent: React.FC = () => {
  const { loading, currentUser, customers, credits, payments, activeBusiness } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Modals state
  const [isVerificationSuiteOpen, setIsVerificationSuiteOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [isNewCreditModalOpen, setIsNewCreditModalOpen] = useState(false);
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [preselectedCreditForPayment, setPreselectedCreditForPayment] = useState<Credit | null>(null);
  const [preselectedCustomerForCredit, setPreselectedCustomerForCredit] = useState<Customer | null>(null);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);

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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 p-4">
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base mb-3 shadow-md">
          DDS
        </div>
        <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          <span>Chargement de DDS Crédit Confiance...</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Données sécurisées • Bamako, Mali
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Header with Global Search */}
      <Header
        onOpenVerificationSuite={() => setIsVerificationSuiteOpen(true)}
        onOpenNewCredit={(cust) => handleOpenNewCredit(cust)}
        onOpenNewPayment={(cred) => handleOpenNewPayment(cred)}
        onOpenNewCustomer={() => setIsNewCustomerModalOpen(true)}
        onSelectCustomer={(cust) => setSelectedCustomerForDetail(cust)}
        onOpenWhatsApp={(name, phone, debt) => handleOpenWhatsApp(name, phone, debt)}
        onNavigateToCustomers={() => setCurrentTab('customers')}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-24 lg:pb-8">
        
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenNewSale={() => setIsNewSaleModalOpen(true)}
          onOpenNewCredit={() => handleOpenNewCredit()}
          onOpenNewPayment={() => handleOpenNewPayment()}
          onOpenNewCustomer={() => setIsNewCustomerModalOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentTab === 'dashboard' && (
            <Dashboard
              onOpenNewCustomer={() => setIsNewCustomerModalOpen(true)}
              onOpenNewSale={() => setIsNewSaleModalOpen(true)}
              onOpenNewCredit={() => handleOpenNewCredit()}
              onOpenNewPayment={handleOpenNewPayment}
              onOpenWhatsApp={handleOpenWhatsApp}
              onSelectTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'sales' && (
            <SalesView
              onOpenNewSale={() => setIsNewSaleModalOpen(true)}
              onOpenSaleReceipt={(sale) => setSelectedSaleForReceipt(sale)}
              onOpenPaymentForCredit={(cred) => handleOpenNewPayment(cred)}
              onOpenWhatsApp={(name, phone, debt, dueDate) => handleOpenWhatsApp(name, phone, debt, dueDate)}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersList
              onOpenNewCredit={(cust) => handleOpenNewCredit(cust)}
              onOpenNewPayment={(credit) => handleOpenNewPayment(credit)}
              onOpenNewCustomer={() => setIsNewCustomerModalOpen(true)}
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

      {/* New Customer Modal */}
      {isNewCustomerModalOpen && (
        <NewCustomerModal
          onClose={() => setIsNewCustomerModalOpen(false)}
          onSuccess={(cust) => {
            setIsNewCustomerModalOpen(false);
            setSelectedCustomerForDetail(cust);
          }}
        />
      )}

      {/* New Sale Modal */}
      {isNewSaleModalOpen && (
        <NewSaleModal
          onClose={() => setIsNewSaleModalOpen(false)}
          onSuccess={(sale, autoPrint) => {
            setIsNewSaleModalOpen(false);
            setSelectedSaleForReceipt(sale);
            if (autoPrint && activeBusiness) {
              printSaleThermalDirect(activeBusiness, sale, '58mm');
            }
          }}
        />
      )}

      {/* Sale Receipt Modal */}
      {selectedSaleForReceipt && (
        <SaleReceiptModal
          sale={selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
          onOpenPaymentModal={(sale) => {
            setSelectedSaleForReceipt(null);
            if (sale.creditId) {
              const cred = credits.find((c) => c.id === sale.creditId);
              if (cred) handleOpenNewPayment(cred);
            }
          }}
        />
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

      {/* Customer Detail Modal from Global Search */}
      {selectedCustomerForDetail && activeBusiness && (
        <CustomerDetailModal
          customer={selectedCustomerForDetail}
          business={activeBusiness}
          credits={credits}
          payments={payments}
          onClose={() => setSelectedCustomerForDetail(null)}
          onOpenNewCredit={(cust) => {
            setSelectedCustomerForDetail(null);
            handleOpenNewCredit(cust);
          }}
          onOpenNewPayment={(cred) => {
            setSelectedCustomerForDetail(null);
            handleOpenNewPayment(cred);
          }}
          onOpenWhatsApp={(name, phone, debt) => {
            setSelectedCustomerForDetail(null);
            handleOpenWhatsApp(name, phone, debt);
          }}
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
