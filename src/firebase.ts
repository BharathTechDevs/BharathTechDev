import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration — Firestore client is offline.');
    }
  }
}

export interface CloudRegistrationRecord {
  ownerUid: string;
  uid: string;
  section: 'service' | 'workshop' | 'event';
  itemId: string;
  itemTitle: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientRole?: string;
  requirements?: string;
  notes?: string;
  budget?: string;
  timeline?: string;
  amount: number;
  paymentStatus: 'VERIFIED' | 'NOT_REQUIRED' | 'PENDING';
  paymentId?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  chatId?: string;
  issuedAt?: string;
  validUntil?: string;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

function sanitizeDocKeyPart(val: string): string {
  return String(val || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');
}

function buildRegistrationDocId(ownerUid: string, uid: string): string {
  const safeUid = sanitizeDocKeyPart(uid);
  const raw = `${ownerUid}_${safeUid}`;
  return raw.slice(0, 140);
}

function clip(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDocsInFirestore(result.user);
  return result.user;
}

export async function signOutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('Firebase signOut notice:', err);
  }
}

export async function ensureUserDocsInFirestore(
  firebaseUser: FirebaseUser | null = auth.currentUser,
  extra?: { phone?: string; company?: string; linkedUids?: string[] }
): Promise<void> {
  if (!firebaseUser || !firebaseUser.emailVerified || !firebaseUser.email) return;

  const userDocPath = `users/${firebaseUser.uid}`;
  const privateDocPath = `users/${firebaseUser.uid}/private/info`;

  try {
    const publicRef = doc(db, 'users', firebaseUser.uid);
    const existingPublic = await getDoc(publicRef);
    const existingRole = existingPublic.exists() ? existingPublic.data()?.role : 'client';
    await setDoc(
      publicRef,
      {
        displayName: clip(firebaseUser.displayName || firebaseUser.email.split('@')[0], 120) || 'S-CODERS Client',
        role: existingRole === 'admin' ? 'admin' : 'client',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore public profile sync warning:', err);
  }

  try {
    const privRef = doc(db, 'users', firebaseUser.uid, 'private', 'info');
    const existingPriv = await getDoc(privRef);
    const prevData = existingPriv.exists() ? existingPriv.data() : {};
    const prevUids: string[] = Array.isArray(prevData?.linkedUids) ? prevData.linkedUids : [];
    const mergedUids = Array.from(
      new Set([
        ...prevUids,
        ...(Array.isArray(extra?.linkedUids) ? extra!.linkedUids : []).map((u) => sanitizeDocKeyPart(u)).filter(Boolean),
      ])
    ).slice(0, 50);

    await setDoc(privRef, {
      email: clip(firebaseUser.email.toLowerCase(), 180),
      phone: clip(extra?.phone ?? prevData?.phone ?? '', 40),
      company: clip(extra?.company ?? prevData?.company ?? '', 180),
      linkedUids: mergedUids,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn(`Firestore private profile sync warning [${privateDocPath} | ${userDocPath}]:`, err);
  }
}

export async function syncRegistrationToFirestore(params: {
  uid: string;
  section: 'service' | 'workshop' | 'event';
  itemId: string;
  itemTitle: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientRole?: string;
  requirements?: string;
  notes?: string;
  budget?: string;
  timeline?: string;
  amount?: number;
  paymentStatus?: 'VERIFIED' | 'NOT_REQUIRED' | 'PENDING';
  paymentId?: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  chatId?: string;
  issuedAt?: string;
  validUntil?: string;
}): Promise<boolean> {
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.emailVerified) return false;

  const cleanUid = sanitizeDocKeyPart(params.uid);
  if (cleanUid.length < 4) return false;

  const docId = buildRegistrationDocId(fbUser.uid, cleanUid);
  const path = `registrations/${docId}`;

  try {
    const regRef = doc(db, 'registrations', docId);
    const snap = await getDoc(regRef);

    const safeEmail = clip((params.clientEmail || fbUser.email || '').toLowerCase(), 180);
    if (!safeEmail.includes('@')) return false;

    const safeName = clip(params.clientName || fbUser.displayName || 'S-CODERS Client', 120) || 'S-CODERS Client';
    const safePhone = clip(params.clientPhone || '', 40);
    const safeRole = clip(params.clientRole || '', 180);
    const safeReq = clip(params.requirements || '', 2000);
    const safeNotes = clip(params.notes || '', 2000);
    const safeBudget = clip(params.budget || '', 100);
    const safeTimeline = clip(params.timeline || '', 100);
    const safeItemTitle = clip(params.itemTitle || 'S-CODERS Offering', 200) || 'S-CODERS Offering';

    if (snap.exists()) {
      const existing = snap.data();
      await updateDoc(regRef, {
        clientName: safeName || existing.clientName || 'S-CODERS Client',
        clientEmail: safeEmail || existing.clientEmail,
        clientPhone: safePhone !== undefined ? safePhone : existing.clientPhone || '',
        clientRole: safeRole || existing.clientRole || '',
        requirements: safeReq || existing.requirements || '',
        notes: params.notes !== undefined ? safeNotes : existing.notes || '',
        budget: safeBudget || existing.budget || '',
        timeline: safeTimeline || existing.timeline || '',
        itemTitle: safeItemTitle || existing.itemTitle,
        updatedAt: serverTimestamp(),
      });
    } else {
      const amt = Number(params.amount);
      const boundedAmount = Number.isFinite(amt) && amt >= 0 && amt <= 10000000 ? amt : 0;
      const payStatus: 'VERIFIED' | 'NOT_REQUIRED' | 'PENDING' =
        params.paymentStatus === 'VERIFIED' || params.paymentStatus === 'PENDING'
          ? params.paymentStatus
          : 'NOT_REQUIRED';
      const status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' =
        params.status === 'EXPIRED' || params.status === 'REVOKED' ? params.status : 'ACTIVE';

      await setDoc(regRef, {
        ownerUid: fbUser.uid,
        uid: cleanUid,
        section: params.section,
        itemId: clip(params.itemId || params.section, 120) || params.section,
        itemTitle: safeItemTitle,
        clientName: safeName,
        clientEmail: safeEmail,
        clientPhone: safePhone,
        clientRole: safeRole,
        requirements: safeReq,
        notes: safeNotes,
        budget: safeBudget,
        timeline: safeTimeline,
        amount: boundedAmount,
        paymentStatus: payStatus,
        paymentId: clip(params.paymentId || '', 120),
        status,
        chatId: clip(params.chatId || '', 120),
        issuedAt: clip(params.issuedAt || new Date().toISOString(), 64),
        validUntil: clip(params.validUntil || '', 64),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await ensureUserDocsInFirestore(fbUser, {
      phone: safePhone || undefined,
      company: safeRole || undefined,
      linkedUids: [cleanUid],
    });
    return true;
  } catch (err) {
    console.warn(`Firestore registration sync warning [${path}]:`, err);
    return false;
  }
}

export async function fetchUserRegistrationsFromFirestore(): Promise<CloudRegistrationRecord[]> {
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.emailVerified) return [];

  const path = 'registrations';
  try {
    const q = query(collection(db, 'registrations'), where('ownerUid', '==', fbUser.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as CloudRegistrationRecord);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function fetchUserPrivateInfoFromFirestore(): Promise<{
  email?: string;
  phone?: string;
  company?: string;
  linkedUids?: string[];
} | null> {
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.emailVerified) return null;

  const path = `users/${fbUser.uid}/private/info`;
  try {
    const snap = await getDoc(doc(db, 'users', fbUser.uid, 'private', 'info'));
    if (!snap.exists()) return null;
    return snap.data() as {
      email?: string;
      phone?: string;
      company?: string;
      linkedUids?: string[];
    };
  } catch (err) {
    console.warn(`Firestore private read warning [${path}]:`, err);
    return null;
  }
}
