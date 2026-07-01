import React, { useState } from 'react';
import {
  AccountInfoScreen,
  ChangePasswordScreen,
  MemberCardDetailScreen,
  PointHistoryScreen,
  PointsScreen,
  TransactionHistoryScreen,
} from './member/MemberDetailScreens';
import MemberHomeScreen from './member/MemberHomeScreen';
import { MemberScreenName } from './member/memberData';

type MemberScreenProps = {
  onBack: () => void;
};

function MemberScreen({ onBack }: MemberScreenProps) {
  const [screen, setScreen] = useState<MemberScreenName>('home');

  if (screen === 'points') {
    return (
      <PointsScreen
        onBack={() => setScreen('home')}
        onHistory={() => setScreen('pointHistory')}
      />
    );
  }

  if (screen === 'pointHistory') {
    return <PointHistoryScreen onBack={() => setScreen('points')} />;
  }

  if (screen === 'transactions') {
    return <TransactionHistoryScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'card') {
    return <MemberCardDetailScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'account') {
    return <AccountInfoScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'changePassword') {
    return <ChangePasswordScreen onBack={() => setScreen('home')} />;
  }

  return <MemberHomeScreen onBack={onBack} onOpen={setScreen} />;
}

export default MemberScreen;
