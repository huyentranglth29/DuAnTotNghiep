import React from 'react';
import EmptyDetailScreen from '../component/EmptyDetailScreen';

type FreeVoucherScreenProps = {
  onBack: () => void;
};

function FreeVoucherScreen({ onBack }: FreeVoucherScreenProps) {
  return (
    <EmptyDetailScreen
      title="VOUCHER MIỄN PHÍ"
      message="Không có voucher miễn phí"
      messagePosition="center"
      onBack={onBack}
    />
  );
}

export default FreeVoucherScreen;
