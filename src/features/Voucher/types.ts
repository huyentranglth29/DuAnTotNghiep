import {ImageSourcePropType} from 'react-native';

export type VoucherNewsTab = 'promotions' | 'sideNews';

export type VoucherNewsItem = {
  id: string;
  tab: VoucherNewsTab;
  title: string;
  publishedAt: string;
  image: ImageSourcePropType;
  summary: string;
  body: string[];
};
