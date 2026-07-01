import React, {useState} from 'react';
import Login from '../features/Login/Index';
import PorgotPass from '../features/Login/component/PorgotPass';
import Register from '../features/Login/component/Register';

type LoginScreen = 'login' | 'porgotPass' | 'register';
type RegisteredUser = {
  fullName: string;
  email: string;
  password: string;
};

type LoginNavigatorProps = {
  onAuthenticated?: () => void;
};

function LoginNavigator({onAuthenticated}: LoginNavigatorProps) {
  const [activeScreen, setActiveScreen] = useState<LoginScreen>('login');
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);

  if (activeScreen === 'porgotPass') {
    return <PorgotPass onBackToLogin={() => setActiveScreen('login')} />;
  }

  if (activeScreen === 'register') {
    return (
      <Register
        onBackToLogin={() => setActiveScreen('login')}
        onRegisterSuccess={user => {
          setRegisteredUser(user);
          setActiveScreen('login');
        }}
      />
    );
  }

  return (
    <Login
      onForgotPasswordPress={() => setActiveScreen('porgotPass')}
      onRegisterPress={() => setActiveScreen('register')}
      onLoginPress={({email, password}) => {
        if (
          registeredUser &&
          email.trim().toLowerCase() === registeredUser.email.trim().toLowerCase() &&
          password === registeredUser.password
        ) {
          onAuthenticated?.();
          return true;
        }

        return false;
      }}
    />
  );
}

export default LoginNavigator;
