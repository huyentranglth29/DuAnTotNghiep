import React from 'react';
import EmptyDetailScreen from '../component/EmptyDetailScreen';

type NotificationScreenProps = {
  onBack: () => void;
};

function NotificationScreen({ onBack }: NotificationScreenProps) {
  return (
    <EmptyDetailScreen
      title="THÔNG BÁO"
      message="Danh sách trống"
      messagePosition="top"
      showMore
      onBack={onBack}
    />
  );
}

export default NotificationScreen;
