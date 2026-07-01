import React, {useState} from 'react';
import LoginNavigator from './src/Navigation/LoginNavigator';
import TabNavigator from './src/Navigation/TabNavigator';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginNavigator onAuthenticated={() => setIsLoggedIn(true)} />;
  }

  return <TabNavigator />;
}

export default App;