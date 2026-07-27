import React, {useEffect, useState} from 'react';
import AddVoucherScreen from './screens/AddVoucherScreen';
import MyVoucherScreen from './screens/MyVoucherScreen';
import VoucherGuideScreen from './screens/VoucherGuideScreen';
import VoucherHistoryScreen from './screens/VoucherHistoryScreen';
import {VoucherHistoryFilter} from './types';

type VoucherRoute = 'myVoucher' | 'addVoucher' | 'history' | 'guide';

type VoucherProps = {
  onDetailChange?: (isDetail: boolean) => void;
};

function Voucher({onDetailChange}: VoucherProps) {
  const [route, setRoute] = useState<VoucherRoute>('myVoucher');
  const [historyFilter, setHistoryFilter] =
    useState<VoucherHistoryFilter>('all');

  useEffect(() => {
    onDetailChange?.(route !== 'myVoucher');
  }, [onDetailChange, route]);

  if (route === 'addVoucher') {
    return <AddVoucherScreen onBack={() => setRoute('myVoucher')} />;
  }

  if (route === 'history') {
    return (
      <VoucherHistoryScreen
        activeFilter={historyFilter}
        onBack={() => setRoute('myVoucher')}
        onChangeFilter={setHistoryFilter}
      />
    );
  }

  if (route === 'guide') {
    return <VoucherGuideScreen onBack={() => setRoute('myVoucher')} />;
  }

  return (
    <MyVoucherScreen
      onAddVoucher={() => setRoute('addVoucher')}
      onOpenHistory={() => setRoute('history')}
      onOpenGuide={() => setRoute('guide')}
    />
  );
}

export default Voucher;
