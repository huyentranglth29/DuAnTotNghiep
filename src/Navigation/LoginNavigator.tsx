import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import Login from '../features/Login/Index';
import PorgotPass from '../features/Login/component/PorgotPass';
import Register from '../features/Login/component/Register';
import {login, register} from '../services/apiService';

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
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);

  useEffect(() => {
    loadRegisteredUser();
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
          await register({
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
        const defaultUser = DEFAULT_USERS.find(item =>
          isSameCredentials(item, email, password),
        );

        if (defaultUser) {
          onAuthenticated?.();
          return true;
        }

        const response = (await login({email, password})) as any;
        if (response && response.success) {
          onAuthenticated?.();
          return true;
        }

        throw new Error(response?.message || 'Email hoặc mật khẩu không đúng');
      }}
    />
  );
}

export default LoginNavigator;
