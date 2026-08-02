import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {clearAuthSession, restoreAuthSession} from '../services/voucherService';

export type AuthStatus = 'loading' | 'guest' | 'authenticated';

export type AuthPromptOptions = {
  title: string;
  message: string;
  primaryLabel?: string;
  secondaryLabel?: string;
};

type PendingAction = (() => void | Promise<void>) | null;

type AuthContextValue = {
  status: AuthStatus;
  isAuthenticated: boolean;
  isGuest: boolean;
  authPrompt: AuthPromptOptions | null;
  loginVisible: boolean;
  loginInitialScreen: 'login' | 'porgotPass' | 'register';
  requestAuth: (
    options: AuthPromptOptions,
    onAuthenticated?: () => void | Promise<void>,
  ) => boolean;
  openLoginModal: (initialScreen?: 'login' | 'porgotPass' | 'register') => void;
  closeLoginModal: () => void;
  dismissAuthPrompt: () => void;
  handleAuthenticated: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [authPrompt, setAuthPrompt] = useState<AuthPromptOptions | null>(null);
  const [loginVisible, setLoginVisible] = useState(false);
  const [loginInitialScreen, setLoginInitialScreen] = useState<
    'login' | 'porgotPass' | 'register'
  >('login');
  const pendingActionRef = useRef<PendingAction>(null);

  useEffect(() => {
    let mounted = true;

    restoreAuthSession()
      .then(token => {
        if (!mounted) {
          return;
        }
        setStatus(token ? 'authenticated' : 'guest');
      })
      .catch(() => {
        if (mounted) {
          setStatus('guest');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const runPendingAction = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) {
      void action();
    }
  }, []);

  const handleAuthenticated = useCallback(() => {
    setStatus('authenticated');
    setLoginVisible(false);
    setAuthPrompt(null);
    runPendingAction();
  }, [runPendingAction]);

  const openLoginModal = useCallback(
    (initialScreen: 'login' | 'porgotPass' | 'register' = 'login') => {
      setLoginInitialScreen(initialScreen);
      setLoginVisible(true);
    },
    [],
  );

  const closeLoginModal = useCallback(() => {
    setLoginVisible(false);
  }, []);

  const dismissAuthPrompt = useCallback(() => {
    setAuthPrompt(null);
    pendingActionRef.current = null;
  }, []);

  const requestAuth = useCallback(
    (
      options: AuthPromptOptions,
      onAuthenticated?: () => void | Promise<void>,
    ) => {
      if (status === 'authenticated') {
        if (onAuthenticated) {
          void onAuthenticated();
        }
        return true;
      }

      pendingActionRef.current = onAuthenticated || null;
      setAuthPrompt(options);
      return false;
    },
    [status],
  );

  const logout = useCallback(async () => {
    pendingActionRef.current = null;
    setAuthPrompt(null);
    setLoginVisible(false);
    await clearAuthSession();
    setStatus('guest');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated: status === 'authenticated',
      isGuest: status === 'guest',
      authPrompt,
      loginVisible,
      loginInitialScreen,
      requestAuth,
      openLoginModal,
      closeLoginModal,
      dismissAuthPrompt,
      handleAuthenticated,
      logout,
    }),
    [
      authPrompt,
      closeLoginModal,
      dismissAuthPrompt,
      handleAuthenticated,
      loginInitialScreen,
      loginVisible,
      logout,
      openLoginModal,
      requestAuth,
      status,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const {requestAuth} = useAuth();
  return requestAuth;
}
