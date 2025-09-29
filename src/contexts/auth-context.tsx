
'use client';

import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, signInWithCustomToken } from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Custom error for unapproved emails
export class UnapprovedEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnapprovedEmailError';
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isImpersonating: boolean;
  impersonatedUser: User | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (name: string, photoURL: string) => Promise<void>;
  updateUserPassword: (currentPass: string, newPass: string) => Promise<void>;
  impersonateUser: (targetUid: string) => Promise<void>;
  stopImpersonating: () => Promise<void>;
  updateWhatsappMessageTemplate: (template: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to fetch user data
const fetchUserData = async (uid: string): Promise<User | null> => {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        const userData = userDoc.data();
        const firebaseUser = auth.currentUser;
        return { 
            uid: uid,
            email: firebaseUser?.email || userData.email,
            nome: userData.nome || firebaseUser?.displayName,
            fotoPerfil: userData.fotoPerfil || firebaseUser?.photoURL,
            ...userData,
        } as User;
    }
    return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        // Check if we are in impersonation mode from sessionStorage
        const adminSession = sessionStorage.getItem('admin_session');
        const impersonationTargetUid = sessionStorage.getItem('impersonation_target_uid');

        if (adminSession && impersonationTargetUid && firebaseUser?.uid === impersonationTargetUid) {
            // We are in impersonation mode
            const originalAdminUser = JSON.parse(adminSession);
            setUser(originalAdminUser); // Set admin as the "real" user
            const targetUser = await fetchUserData(impersonationTargetUid);
            setImpersonatedUser(targetUser);
            setIsImpersonating(true);
        } else if (firebaseUser) {
            // Normal login flow
            const userData = await fetchUserData(firebaseUser.uid);
            setUser(userData);
            setIsImpersonating(false);
            setImpersonatedUser(null);
            sessionStorage.removeItem('admin_session');
            sessionStorage.removeItem('impersonation_target_uid');
        } else {
            // Logged out
            setUser(null);
            setIsImpersonating(false);
            setImpersonatedUser(null);
            sessionStorage.removeItem('admin_session');
            sessionStorage.removeItem('impersonation_target_uid');
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, 'users', auth.currentUser!.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro de Login',
        description: 'As credenciais fornecidas estão incorretas. Por favor, tente novamente.',
      });
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const approvedEmailsRef = collection(db, 'approvedEmails');
      const q = query(approvedEmailsRef, where('email', '==', email.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setLoading(false);
        throw new UnapprovedEmailError('Seu e-mail não está na lista de aprovados. Por favor, realize a compra de um plano para se cadastrar.');
      }
      
      const approvedData = querySnapshot.docs[0].data();
      const userPlan = approvedData.plan as User['plan'];

      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      const initialName = email.split('@')[0];

      await updateProfile(firebaseUser, {
          displayName: initialName,
      });
      
      const newUser: User = {
        uid: firebaseUser.uid,
        nome: initialName,
        email: email.toLowerCase(),
        fotoPerfil: `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
        createdAt: Timestamp.now(),
        plan: userPlan,
        active: true,
        role: 'user',
      };

      await setDoc(doc(db, "users", firebaseUser.uid), newUser);
      
      setUser(newUser);
      router.push('/dashboard');

    } catch (error: any) {
       if (error instanceof UnapprovedEmailError) {
           throw error; // Re-throw the custom error to be caught by the UI
       }
       if (error.code === 'auth/email-already-in-use') {
         toast({
            variant: 'destructive',
            title: 'Erro de Cadastro',
            description: 'Este e-mail já está em uso.',
         });
       } else {
         toast({
          variant: 'destructive',
          title: 'Erro de Cadastro',
          description: 'Não foi possível criar sua conta. Verifique os dados e tente novamente.',
        });
       }
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserProfile = async (name: string, photoURL: string) => {
    setLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Usuário não autenticado.");

      await updateProfile(firebaseUser, { displayName: name, photoURL: photoURL });
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, { nome: name, fotoPerfil: photoURL });

      setUser(prevUser => prevUser ? { ...prevUser, nome: name, fotoPerfil: photoURL } : null);

      toast({ description: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o perfil.' });
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserPassword = async (currentPass: string, newPass: string) => {
    setLoading(true);
    try {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser || !firebaseUser.email) throw new Error("Usuário não autenticado.");

        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPass);
        await reauthenticateWithCredential(firebaseUser, credential);

        await updatePassword(firebaseUser, newPass);
        
        toast({ description: 'Senha alterada com sucesso!' });
    } catch (error) {
         toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível alterar a senha. Verifique sua senha atual.' });
        console.error("Password update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (isImpersonating) {
        await stopImpersonating();
      } else {
        await signOut(auth);
        router.push('/login');
      }
    } catch(error) {
       toast({
        variant: 'destructive',
        title: 'Erro de Logout',
        description: 'Ocorreu um erro ao tentar sair. Por favor, tente novamente.',
      });
      console.error("Logout error:", error);
    }
  };
  
  const impersonateUser = async (targetUid: string) => {
    if (!user || user.role !== 'admin') {
        toast({ variant: 'destructive', description: 'Apenas administradores podem usar esta função.' });
        return;
    }

    try {
        setLoading(true);
        sessionStorage.setItem('admin_session', JSON.stringify(user));
        sessionStorage.setItem('impersonation_target_uid', targetUid);

        // This is a simplified, client-side only impersonation.
        // For production, you'd generate a custom token on the server.
        const targetUserData = await fetchUserData(targetUid);
        if (targetUserData) {
            setImpersonatedUser(targetUserData);
            setIsImpersonating(true);
            // We don't actually sign in as the user here, just update the state
            // The onAuthStateChanged listener will handle the logic based on sessionStorage
            // To trigger it, we can force a reload or a state change that affects it.
            // For a smoother UX, we'll just update the state directly
            // and the layout will react to isImpersonating. The actual "user" object
            // for auth purposes remains the admin.
             toast({ description: `Entrando como ${targetUserData.nome}...`});
             router.push('/dashboard');
        } else {
            throw new Error("Usuário alvo não encontrado.");
        }
    } catch (error) {
        console.error("Impersonation error: ", error);
        toast({ variant: 'destructive', description: 'Falha ao tentar entrar como usuário.' });
        sessionStorage.removeItem('admin_session');
        sessionStorage.removeItem('impersonation_target_uid');
    } finally {
        setLoading(false);
    }
  };

  const stopImpersonating = async () => {
    try {
        setLoading(true);
        const adminSession = sessionStorage.getItem('admin_session');
        if (adminSession) {
            const adminUser = JSON.parse(adminSession);
            setUser(adminUser);
        }
        setIsImpersonating(false);
        setImpersonatedUser(null);
        sessionStorage.removeItem('admin_session');
        sessionStorage.removeItem('impersonation_target_uid');
        toast({ description: 'Retornando para sua conta de administrador.' });
        router.push('/admin');
    } catch (error) {
        console.error("Error stopping impersonation: ", error);
        toast({ variant: 'destructive', description: 'Falha ao retornar para a conta de admin.' });
    } finally {
        setLoading(false);
    }
  };

  const updateWhatsappMessageTemplate = async (template: string) => {
    setLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Usuário não autenticado.");

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, { whatsappMessageTemplate: template });

      setUser(prevUser => prevUser ? { ...prevUser, whatsappMessageTemplate: template } : null);

      toast({ description: 'Mensagem de confirmação atualizada!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a mensagem.' });
      console.error("WhatsApp template update error:", error);
    } finally {
      setLoading(false);
    }
  };


  // The user object available to the app should be the impersonated one if active
  const effectiveUser = isImpersonating ? impersonatedUser : user;

  const value = { user: effectiveUser, loading, login, signup, logout, updateUserProfile, updateUserPassword, isImpersonating, impersonatedUser, impersonateUser, stopImpersonating, updateWhatsappMessageTemplate };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
