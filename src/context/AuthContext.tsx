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
  onSnapshot
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Business, Customer, Credit, Payment, AuditLog, UserRole, UserProfile } from '../types';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  currentUser: AppUser | null;
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
  pinCode: string;
  signInWithPin: (pin: string) => Promise<{ success: boolean; message?: string }>;
  updatePinCode: (newPin: string) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  createBusiness: (name: string, phone: string, address: string, city: string) => Promise<void>;
  updateBusiness: (data: Partial<Business>) => Promise<void>;
  switchBusiness: (businessId: string) => void;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PIN = '00223';
const PIN_STORAGE_KEY = 'dds_pin_code';
const PIN_AUTH_KEY = 'dds_pin_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
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

  // Stored PIN code (default: 00223)
  const [pinCode, setPinCode] = useState<string>(() => {
    return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
  });

  // Helper to construct merchant user object
  const getMerchantUser = (): AppUser => ({
    uid: 'merchant_00223',
    email: 'diaby607622@gmail.com',
    displayName: 'Commerçant DDS (Mali)',
    photoURL: null,
  });

  // 1. Initial Auth Check (PIN session or Firebase Auth)
  useEffect(() => {
    const isPinActive = localStorage.getItem(PIN_AUTH_KEY) === 'true';

    if (isPinActive) {
      const merchantUser = getMerchantUser();
      setCurrentUser(merchantUser);
      ensureUserProfileAndBusiness(merchantUser)
        .catch((err) => console.warn('Error loading merchant business:', err))
        .finally(() => setLoading(false));
      return;
    }

    // Firebase Auth Observer as secondary
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const appUser: AppUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        setCurrentUser(appUser);
        setSyncStatus('syncing');
        try {
          await ensureUserProfileAndBusiness(appUser);
        } catch (err) {
          console.error('Auth profile error:', err);
          setErrorMessage('Impossible de charger les données du commerçant.');
          setSyncStatus('error');
        }
      } else {
        const pinCheck = localStorage.getItem(PIN_AUTH_KEY) === 'true';
        if (!pinCheck) {
          setCurrentUser(null);
          setUserProfile(null);
          setActiveBusiness(null);
          setBusinesses([]);
          setCustomers([]);
          setCredits([]);
          setPayments([]);
          setAuditLogs([]);
          setSyncStatus('synced');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to ensure initial user & business exist
  const ensureUserProfileAndBusiness = async (user: AppUser, requestedRole: UserRole = 'owner') => {
    const sanitizedUid = user.uid.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const userDocRef = doc(db, 'users', sanitizedUid);
    let userSnapshot;
    try {
      userSnapshot = await getDoc(userDocRef);
    } catch (e) {
      console.warn('Could not read user profile from Firestore:', e);
    }

    let defaultBizId = `biz_${sanitizedUid}_bamako`;

    if (!userSnapshot || !userSnapshot.exists()) {
      const now = new Date().toISOString();

      const profile: UserProfile = {
        uid: sanitizedUid,
        email: user.email || 'diaby607622@gmail.com',
        displayName: user.displayName || 'Commerçant DDS',
        photoURL: user.photoURL || '',
        activeBusinessId: defaultBizId,
        createdAt: now,
      };

      const defaultBiz: Business = {
        id: defaultBizId,
        name: 'Établissements Diaby & Frères',
        ownerId: sanitizedUid,
        ownerEmail: user.email || 'diaby607622@gmail.com',
        phone: '+223 76 00 12 34',
        address: 'Grand Marché, Rue 14',
        city: 'Bamako',
        currency: 'FCFA',
        slogan: 'Vos crédits sous contrôle, votre commerce en confiance.',
        createdAt: now,
      };

      const membershipId = `mem_${sanitizedUid}_${defaultBizId}`;
      const membership = {
        id: membershipId,
        businessId: defaultBizId,
        userId: sanitizedUid,
        userEmail: user.email || 'diaby607622@gmail.com',
        role: requestedRole,
        createdAt: now,
      };

      try {
        await setDoc(userDocRef, profile);
        await setDoc(doc(db, 'businesses', defaultBizId), defaultBiz);
        await setDoc(doc(db, 'memberships', membershipId), membership);
      } catch (e) {
        console.warn('Failed creating default business in Firestore:', e);
      }

      setUserProfile(profile);
      setActiveBusiness(defaultBiz);
      setBusinesses([defaultBiz]);
      setUserRole(requestedRole);
    } else {
      const pData = userSnapshot.data() as UserProfile;
      setUserProfile(pData);
      defaultBizId = pData.activeBusinessId || defaultBizId;

      try {
        const bizSnap = await getDoc(doc(db, 'businesses', defaultBizId));
        if (bizSnap.exists()) {
          const biz = bizSnap.data() as Business;
          setActiveBusiness(biz);
          setBusinesses([biz]);
        } else {
          // If referenced business doc not found, re-create default
          const defaultBiz: Business = {
            id: defaultBizId,
            name: 'Établissements Diaby & Frères',
            ownerId: sanitizedUid,
            ownerEmail: user.email || 'diaby607622@gmail.com',
            phone: '+223 76 00 12 34',
            address: 'Grand Marché, Rue 14',
            city: 'Bamako',
            currency: 'FCFA',
            slogan: 'Vos crédits sous contrôle, votre commerce en confiance.',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'businesses', defaultBizId), defaultBiz);
          setActiveBusiness(defaultBiz);
          setBusinesses([defaultBiz]);
        }
      } catch (err) {
        console.warn('Could not fetch active business:', err);
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
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setCustomers(list);
        setSyncStatus('synced');
      },
      (error) => {
        setSyncStatus('offline');
        console.warn('Firestore customers listener error:', error);
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
        setSyncStatus('offline');
        console.warn('Firestore credits listener error:', error);
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
        setSyncStatus('offline');
        console.warn('Firestore payments listener error:', error);
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
        console.warn('Firestore auditLogs listener error:', error);
      }
    );

    return () => {
      unsubCust();
      unsubCredits();
      unsubPayments();
      unsubLogs();
    };
  }, [currentUser?.uid, activeBusiness?.id]);

  // Sign in via PIN Code (primary method: 00223)
  const signInWithPin = async (inputPin: string): Promise<{ success: boolean; message?: string }> => {
    const cleanInput = inputPin.trim();
    const storedPin = localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;

    if (cleanInput === storedPin || cleanInput === DEFAULT_PIN) {
      setLoading(true);
      setErrorMessage(null);
      localStorage.setItem(PIN_AUTH_KEY, 'true');
      const merchantUser = getMerchantUser();
      setCurrentUser(merchantUser);

      try {
        await ensureUserProfileAndBusiness(merchantUser);
        setSyncStatus('synced');
        setLoading(false);
        return { success: true };
      } catch (err) {
        console.error('Error during PIN login profile setup:', err);
        setLoading(false);
        return { success: true };
      }
    } else {
      const msg = 'Code PIN incorrect. Veuillez vérifier votre code secret.';
      setErrorMessage(msg);
      return { success: false, message: msg };
    }
  };

  // Update PIN code
  const updatePinCode = (newPin: string) => {
    const cleanPin = newPin.trim();
    if (cleanPin.length >= 4) {
      localStorage.setItem(PIN_STORAGE_KEY, cleanPin);
      setPinCode(cleanPin);
    }
  };

  // Google Auth Sign-in (secondary alternative)
  const signInWithGoogle = async () => {
    try {
      setSyncStatus('syncing');
      setErrorMessage(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        const appUser: AppUser = {
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
        };
        setCurrentUser(appUser);
        await ensureUserProfileAndBusiness(appUser);
      }
      setSyncStatus('synced');
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('popup-closed-by-user')) {
        setErrorMessage('La fenêtre de connexion Google a été fermée.');
      } else if (errorMsg.includes('popup-blocked')) {
        setErrorMessage('La fenêtre de connexion a été bloquée par le navigateur. Veuillez autoriser les popups ou utiliser le code PIN 00223.');
      } else if (errorMsg.includes('unauthorized-domain')) {
        setErrorMessage('Domaine non autorisé dans Firebase Auth. Utilisez le code PIN 00223 pour un accès direct immédiat.');
      } else {
        setErrorMessage("Erreur d'authentification Google : " + errorMsg);
      }
      setSyncStatus('error');
    }
  };

  const signOut = async () => {
    localStorage.removeItem(PIN_AUTH_KEY);
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setUserProfile(null);
    setActiveBusiness(null);
    setBusinesses([]);
    setCustomers([]);
    setCredits([]);
    setPayments([]);
    setAuditLogs([]);
    setErrorMessage(null);
    setSyncStatus('synced');
  };

  const createBusiness = async (name: string, phone: string, address: string, city: string) => {
    if (!currentUser) return;
    const newBizId = `biz_${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const newBiz: Business = {
      id: newBizId,
      name: name.trim(),
      ownerId: currentUser.uid,
      ownerEmail: currentUser.email || 'diaby607622@gmail.com',
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
      console.error('Failed to create business in Firestore:', e);
      setActiveBusiness(newBiz);
      setBusinesses((prev) => [...prev, newBiz]);
    }
  };

  const updateBusiness = async (data: Partial<Business>) => {
    if (!activeBusiness) return;
    const updated = { ...activeBusiness, ...data };
    try {
      await setDoc(doc(db, 'businesses', activeBusiness.id), updated, { merge: true });
      setActiveBusiness(updated);
    } catch (e) {
      console.error('Failed to update business in Firestore:', e);
      setActiveBusiness(updated);
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
      pinCode,
      signInWithPin,
      updatePinCode,
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
      pinCode,
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
