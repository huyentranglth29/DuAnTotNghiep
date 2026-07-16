import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import Login from '../features/Login/Index';
import PorgotPass from '../features/Login/component/PorgotPass';
import Register from '../features/Login/component/Register';
import {
  clearAuthSession,
  loginWithApi,
  registerWithApi,
  restoreAuthSession,
} from '../services/voucherService';

type LoginScreen = 'login' | 'porgotPass' | 'register';
type RegisteredUser = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
};

type LoginNavigatorProps = {
  onAuthenticated?: () => void;
};

const REGISTERED_USER_KEY = '@filmgo_registered_user';

/** Tài khoản demo — trùng user seed Mongo */
const SEED_DEMO_USER: RegisteredUser = {
  fullName: 'FilmGo User',
  email: 'user@filmgo.com',
  password: 'User@123456',
};

const isSameCredentials = (
  user: RegisteredUser,
  email: string,
  password: string,
) =>
  email.trim().toLowerCase() === user.email.trim().toLowerCase() &&
  password === user.password;

/** Alias cũ demo@filmgo.vn → tài khoản seed API */
const resolveLoginEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  if (normalized === 'demo@filmgo.vn') {
    return SEED_DEMO_USER.email;
  }
  return normalized;
};

function LoginNavigator({onAuthenticated}: LoginNavigatorProps) {
  const [activeScreen, setActiveScreen] = useState<LoginScreen>('login');
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(
    null,
  );

  useEffect(() => {
    loadRegisteredUser();
    restoreAuthSession().catch(() => undefined);
  }, []);

  const loadRegisteredUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem(REGISTERED_USER_KEY);
      if (savedUser) {
        setRegisteredUser(JSON.parse(savedUser));
      }
    } catch {
      setRegisteredUser(null);
    }
  };

  const saveRegisteredUser = async (user: RegisteredUser) => {
    setRegisteredUser(user);
    try {
      await AsyncStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.warn('Không lưu được tài khoản xuống máy:', error);
    }
  };

  const findRegisteredUser = async () => {
    if (registeredUser) {
      return registeredUser;
    }
    try {
      const savedUser = await AsyncStorage.getItem(REGISTERED_USER_KEY);
      if (!savedUser) {
        return null;
      }
      const parsedUser = JSON.parse(savedUser) as RegisteredUser;
      setRegisteredUser(parsedUser);
      return parsedUser;
    } catch {
      return null;
    }
  };

  if (activeScreen === 'porgotPass') {
    return <PorgotPass onBackToLogin={() => setActiveScreen('login')} />;
  }

  if (activeScreen === 'register') {
    return (
      <Register
        onBackToLogin={() => setActiveScreen('login')}
        onRegisterSuccess={async user => {
          await registerWithApi({
            fullName: user.fullName,
            email: user.email,
            password: user.password,
            phone: user.phone || '',
          });
          await saveRegisteredUser(user);
          setActiveScreen('login');
        }}
      />
    );
  }

  return (
    <Login
      onForgotPasswordPress={() => setActiveScreen('porgotPass')}
      onRegisterPress={() => setActiveScreen('register')}
      onLoginPress={async ({email, password}) => {
        const apiEmail = resolveLoginEmail(email);
        const apiPassword =
          email.trim().toLowerCase() === 'demo@filmgo.vn' &&
          password === '123456'
            ? SEED_DEMO_USER.password
            : password;

        try {
          await loginWithApi({email: apiEmail, password: apiPassword});
          onAuthenticated?.();
          return true;
        } catch (loginError) {
          const localUser = await findRegisteredUser();
          if (localUser && isSameCredentials(localUser, email, password)) {
            try {
              await registerWithApi({
                fullName: localUser.fullName,
                email: localUser.email,
                password: localUser.password,
                phone: localUser.phone || '',
              });
            } catch {
              // Email đã có trên server
            }
            try {
              await loginWithApi({
                email: localUser.email,
                password: localUser.password,
              });
              onAuthenticated?.();
              return true;
            } catch {
              await clearAuthSession();
              return false;
            }
          }

          console.warn('Login API:', (loginError as Error)?.message);
          await clearAuthSession();
          return false;
        }
      }}
    />
  );
}

export default LoginNavigator;
