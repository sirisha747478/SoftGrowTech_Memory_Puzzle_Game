import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  getAuth
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { createUserProfile, getUserProfile } from './dbService';
import { UserProfile } from '../types/game';

export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user profile exists, if not create it
    const profile = await getUserProfile(user.uid);
    if (!profile) {
      const newProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        email: user.email || '',
        photoURL: user.photoURL || '',
        stats: {
          gamesPlayed: 0,
          wins: 0,
          bestScore: 0,
          totalMoves: 0,
          totalTime: 0,
        },
        achievements: [],
        createdAt: new Date().toISOString(),
      };
      await createUserProfile(newProfile);
    }
    return user;
  } catch (error: any) {
    console.error('Error logging in with Google:', error);
    // Re-throw the error so the UI can handle it
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
