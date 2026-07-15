import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import Login from '../features/Login/Index';
import PorgotPass from '../features/Login/component/PorgotPass';
import Register from '../features/Login/component/Register';
import {
  loginWithApi,
  registerWithApi,
  restoreAuthSession,
} from '../services/voucherService';

type LoginScreen = 'login' | 'porgotPass' | 'register';
type RegisteredUser = {
  fullName: string;
  email: string;
  password: string;
};

type LoginNavigatorProps = {
  onAuthenticated?: () => void;
};

const REGISTERED_USER_KEY = '@filmgo_registered_user';
const DEFAULT_USERS: RegisteredUser[] = [
  {
    fullName: 'FilmGo Demo',
    email: 'demo@filmgo.vn',
    password: '123456',
  },
];

const isSameCredentials = (
  user: RegisteredUser,
  email: string,
  password: string,
) =>
  email.trim().toLowerCase() === user.email.trim().toLowerCase() &&
  password === user.password;

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
          try {
            await registerWithApi({
              fullName: user.fullName,
              email: user.email,
              password: user.password,
            });
          } catch (error) {
            console.warn('Register API:', (error as Error)?.message);
          }
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
        try {
          await loginWithApi({email, password});
          onAuthenticated?.();
          return true;
        } catch {
          const user = await findRegisteredUser();
          const defaultUser = DEFAULT_USERS.find(item =>
            isSameCredentials(item, email, password),
          );

          if (
            (user && isSameCredentials(user, email, password)) ||
            defaultUser
          ) {
            onAuthenticated?.();
            return true;
          }

          return false;
        }
      }}
    />
  );
}

export default LoginNavigator;
