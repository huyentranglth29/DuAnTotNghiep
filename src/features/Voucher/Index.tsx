import React, {useEffect, useState} from 'react';
import AddVoucherScreen from './screens/AddVoucherScreen';
import MyVoucherScreen from './screens/MyVoucherScreen';
import VoucherHistoryScreen from './screens/VoucherHistoryScreen';
import {VoucherHistoryFilter} from './types';

type VoucherRoute = 'myVoucher' | 'addVoucher' | 'history';

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

  return (
    <MyVoucherScreen
      onAddVoucher={() => setRoute('addVoucher')}
      onOpenHistory={() => setRoute('history')}
    />
  );
}

export default Voucher;
