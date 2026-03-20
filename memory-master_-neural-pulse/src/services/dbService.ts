import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  setDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { ScoreEntry, UserProfile, Difficulty, GameMode } from '../types/game';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const testConnection = async (): Promise<boolean> => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
      return false;
    }
    // Other errors (like permission denied) still mean we are online
    return true;
  }
};

const SCORES_COLLECTION = 'scores';
const USERS_COLLECTION = 'users';

export const saveScore = async (score: ScoreEntry) => {
  const path = SCORES_COLLECTION;
  try {
    await addDoc(collection(db, path), {
      ...score,
      date: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const getLeaderboard = async (difficulty: Difficulty, mode: GameMode, limitCount: number = 10) => {
  const path = SCORES_COLLECTION;
  try {
    const q = query(
      collection(db, path),
      where('difficulty', '==', difficulty),
      where('mode', '==', mode),
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp)?.toDate().toISOString() || new Date().toISOString()
    })) as ScoreEntry[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const createUserProfile = async (profile: UserProfile) => {
  const path = `${USERS_COLLECTION}/${profile.uid}`;
  try {
    await setDoc(doc(db, USERS_COLLECTION, profile.uid), {
      ...profile,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updateUserStats = async (uid: string, stats: Partial<UserProfile['stats']>, achievementId?: string) => {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const updateData: any = {
      'stats.gamesPlayed': increment(1),
      'stats.totalMoves': increment(stats.totalMoves || 0),
      'stats.totalTime': increment(stats.totalTime || 0),
    };

    if (stats.bestScore !== undefined) {
      const currentProfile = await getUserProfile(uid);
      if (currentProfile && stats.bestScore > currentProfile.stats.bestScore) {
        updateData['stats.bestScore'] = stats.bestScore;
      }
    }

    if (stats.wins) {
      updateData['stats.wins'] = increment(1);
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};
