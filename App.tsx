import React, {useState} from 'react';
import LoginNavigator from './src/Navigation/LoginNavigator';
import TabNavigator from './src/Navigation/TabNavigator';
import QueryProvider from './src/providers/QueryProvider';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <QueryProvider>
      {!isLoggedIn ? (
        <LoginNavigator onAuthenticated={() => setIsLoggedIn(true)} />
      ) : (
        <TabNavigator />
      )}
    </QueryProvider>
  );
}

export default App;