import React, {useState} from 'react';
import DifferentMenuScreen, {
  DifferentScreenName,
} from './screens/DifferentMenuScreen';
import FreeVoucherScreen from './screens/FreeVoucherScreen';
import MemberScreen from './screens/MemberScreen';
import NotificationScreen from './screens/NotificationScreen';
import RecruitmentScreen from './screens/RecruitmentScreen';
import SettingScreen from './screens/SettingScreen';
import MyTicketsScreen from './screens/MyTicketsScreen';

type DifferentProps = {
  onDetailChange?: (isDetail: boolean) => void;
  onLogout: () => void;
  initialScreen?: DifferentScreenName;
};

function Different({onDetailChange, onLogout, initialScreen = 'menu'}: DifferentProps) {
  const [activeScreen, setActiveScreen] = useState<DifferentScreenName>(initialScreen);

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

  if (activeScreen === 'myTickets') {
    return <MyTicketsScreen onBack={goBack} />;
  }

  if (activeScreen === 'notification') {
    return <NotificationScreen onBack={goBack} />;
  }

  if (activeScreen === 'member') {
    return <MemberScreen onBack={goBack} onLogout={onLogout} />;
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
