import React, { useState } from 'react';
import DifferentMenuScreen, {
  DifferentScreenName,
} from './screens/DifferentMenuScreen';
import FreeVoucherScreen from './screens/FreeVoucherScreen';
import MemberScreen from './screens/MemberScreen';
import NotificationScreen from './screens/NotificationScreen';
import RecruitmentScreen from './screens/RecruitmentScreen';
import SettingScreen from './screens/SettingScreen';

type DifferentProps = {
  onDetailChange?: (isDetail: boolean) => void;
};

function Different({ onDetailChange }: DifferentProps) {
  const [activeScreen, setActiveScreen] = useState<DifferentScreenName>('menu');

  const openScreen = (screen: DifferentScreenName) => {
    setActiveScreen(screen);
    onDetailChange?.(screen !== 'menu');
  };

  const goBack = () => {
    openScreen('menu');
  };

  if (activeScreen === 'voucher') {
    return <FreeVoucherScreen onBack={goBack} />;
  }

  if (activeScreen === 'notification') {
    return <NotificationScreen onBack={goBack} />;
  }

  if (activeScreen === 'member') {
    return <MemberScreen onBack={goBack} />;
  }

  if (activeScreen === 'career') {
    return <RecruitmentScreen onBack={goBack} />;
  }

  if (activeScreen === 'setting') {
    return <SettingScreen onBack={goBack} />;
  }

  return <DifferentMenuScreen onOpenScreen={openScreen} />;
}

export default Different;
