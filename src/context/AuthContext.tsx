import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Business, Customer, Credit, Payment, AuditLog, UserRole, UserProfile } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  activeBusiness: Business | null;
  userRole: UserRole;
  businesses: Business[];
  customers: Customer[];
  credits: Credit[];
  payments: Payment[];
  auditLogs: AuditLog[];
  loading: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  errorMessage: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  createBusiness: (name: string, phone: string, address: string, city: string) => Promise<void>;
  updateBusiness: (data: Partial<Business>) => Promise<void>;
  switchBusiness: (businessId: string) => void;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('owner');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setSyncStatus('syncing');
        try {
          await ensureUserProfileAndBusiness(user);
        } catch (err) {
          console.error("Auth profile error:", err);
          setErrorMessage("Impossible de charger les données du commerçant.");
          setSyncStatus('error');
        }
      } else {
        setUserProfile(null);
        setActiveBusiness(null);
        setBusinesses([]);
        setCustomers([]);
        setCredits([]);
        setPayments([]);
        setAuditLogs([]);
        setSyncStatus('synced');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to ensure initial user & business exist
  const ensureUserProfileAndBusiness = async (user: FirebaseUser, requestedRole: UserRole = 'owner') => {
    const userDocRef = doc(db, 'users', user.uid);
    let userSnapshot;
    try {
      userSnapshot = await getDoc(userDocRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
    }

    let defaultBizId = '';

    if (!userSnapshot.exists()) {
      // First time user: Create profile and default boutique
      const newBizId = `biz_${user.uid.substring(0, 8)}_${Date.now().toString(36)}`;
      defaultBizId = newBizId;
      const now = new Date().toISOString();

      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || 'commercant@dds-confiance.ml',
        displayName: user.displayName || 'Commerçant DDS',
        photoURL: user.photoURL || '',
        activeBusinessId: newBizId,
        createdAt: now,
      };

      const defaultBiz: Business = {
        id: newBizId,
        name: 'Établissements Diaby & Frères',
        ownerId: user.uid,
        ownerEmail: user.email || 'commercant@dds-confiance.ml',
        phone: '+223 76 00 12 34',
        address: 'Grand Marché, Rue 14',
        city: 'Bamako',
        currency: 'FCFA',
        slogan: 'Vos crédits sous contrôle, votre commerce en confiance.',
        createdAt: now,
      };

      const membershipId = `mem_${user.uid}_${newBizId}`;
      const membership = {
        id: membershipId,
        businessId: newBizId,
        userId: user.uid,
        userEmail: user.email || 'commercant@dds-confiance.ml',
        role: requestedRole,
        createdAt: now,
      };

      try {
        await setDoc(userDocRef, profile);
        await setDoc(doc(db, 'businesses', newBizId), defaultBiz);
        await setDoc(doc(db, 'memberships', membershipId), membership);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `businesses/${newBizId}`);
      }

      setUserProfile(profile);
      setActiveBusiness(defaultBiz);
      setBusinesses([defaultBiz]);
      setUserRole(requestedRole);
    } else {
      const pData = userSnapshot.data() as UserProfile;
      setUserProfile(pData);
      defaultBizId = pData.activeBusinessId || '';

      // Fetch businesses owned by or associated with user
      try {
        const bizSnap = await getDoc(doc(db, 'businesses', defaultBizId));
        if (bizSnap.exists()) {
          const biz = bizSnap.data() as Business;
          setActiveBusiness(biz);
          setBusinesses([biz]);
        }
      } catch (err) {
        console.warn("Could not fetch active business:", err);
      }
    }
  };

  // 2. Real-time Listeners for Active Business Data
  useEffect(() => {
    if (!currentUser || !activeBusiness) {
      setCustomers([]);
      setCredits([]);
      setPayments([]);
      setAuditLogs([]);
      return;
    }

    setSyncStatus('syncing');

    // Customers listener
    const custQuery = query(
      collection(db, 'customers'),
      where('businessId', '==', activeBusiness.id)
    );
    const unsubCust = onSnapshot(
      custQuery,
      (snapshot) => {
        const list: Customer[] = [];
        snapshot.forEach((d) => list.push(d.data() as Customer));
        // Sort by updatedAt desc
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setCustomers(list);
        setSyncStatus('synced');
      },
      (error) => {
        setSyncStatus('error');
        handleFirestoreError(error, OperationType.LIST, 'customers');
      }
    );

    // Credits listener
    const creditsQuery = query(
      collection(db, 'credits'),
      where('businessId', '==', activeBusiness.id)
    );
    const unsubCredits = onSnapshot(
      creditsQuery,
      (snapshot) => {
        const list: Credit[] = [];
        snapshot.forEach((d) => list.push(d.data() as Credit));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCredits(list);
        setSyncStatus('synced');
      },
      (error) => {
        setSyncStatus('error');
        handleFirestoreError(error, OperationType.LIST, 'credits');
      }
    );

    // Payments listener
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('businessId', '==', activeBusiness.id)
    );
    const unsubPayments = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const list: Payment[] = [];
        snapshot.forEach((d) => list.push(d.data() as Payment));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPayments(list);
        setSyncStatus('synced');
      },
      (error) => {
        setSyncStatus('error');
        handleFirestoreError(error, OperationType.LIST, 'payments');
      }
    );

    // AuditLogs listener
    const logsQuery = query(
      collection(db, 'auditLogs'),
      where('businessId', '==', activeBusiness.id)
    );
    const unsubLogs = onSnapshot(
      logsQuery,
      (snapshot) => {
        const list: AuditLog[] = [];
        snapshot.forEach((d) => list.push(d.data() as AuditLog));
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAuditLogs(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'auditLogs');
      }
    );

    return () => {
      unsubCust();
      unsubCredits();
      unsubPayments();
      unsubLogs();
    };
  }, [currentUser, activeBusiness?.id]);

  const signInWithGoogle = async () => {
    try {
      setSyncStatus('syncing');
      setErrorMessage(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      setSyncStatus('synced');
    } catch (err: unknown) {
      console.error("Google sign in error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('popup-closed-by-user')) {
        setErrorMessage("La fenêtre de connexion Google a été fermée.");
      } else if (errorMsg.includes('popup-blocked')) {
        setErrorMessage("La fenêtre de connexion a été bloquée par le navigateur. Veuillez autoriser les popups pour ce site.");
      } else if (errorMsg.includes('unauthorized-domain')) {
        setErrorMessage("Domaine non autorisé dans Firebase Authentication. Le projet a été synchronisé, veuillez réessayer.");
      } else {
        setErrorMessage("Erreur d'authentification Google : " + errorMsg);
      }
      setSyncStatus('error');
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const createBusiness = async (name: string, phone: string, address: string, city: string) => {
    if (!currentUser) return;
    const newBizId = `biz_${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const newBiz: Business = {
      id: newBizId,
      name: name.trim(),
      ownerId: currentUser.uid,
      ownerEmail: currentUser.email || 'commercant@dds-confiance.ml',
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim() || 'Bamako',
      currency: 'FCFA',
      slogan: 'Vos crédits sous contrôle, votre commerce en confiance.',
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'businesses', newBizId), newBiz);
      setActiveBusiness(newBiz);
      setBusinesses((prev) => [...prev, newBiz]);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `businesses/${newBizId}`);
    }
  };

  const updateBusiness = async (data: Partial<Business>) => {
    if (!activeBusiness) return;
    const updated = { ...activeBusiness, ...data };
    try {
      await setDoc(doc(db, 'businesses', activeBusiness.id), updated, { merge: true });
      setActiveBusiness(updated);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `businesses/${activeBusiness.id}`);
    }
  };

  const switchBusiness = (businessId: string) => {
    const target = businesses.find((b) => b.id === businessId);
    if (target) {
      setActiveBusiness(target);
    }
  };

  const contextValue = useMemo(
    () => ({
      currentUser,
      userProfile,
      activeBusiness,
      userRole,
      businesses,
      customers,
      credits,
      payments,
      auditLogs,
      loading,
      syncStatus,
      errorMessage,
      signInWithGoogle,
      signOut,
      createBusiness,
      updateBusiness,
      switchBusiness,
      setUserRole,
    }),
    [
      currentUser,
      userProfile,
      activeBusiness,
      userRole,
      businesses,
      customers,
      credits,
      payments,
      auditLogs,
      loading,
      syncStatus,
      errorMessage,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
