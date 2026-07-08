import {ImageSourcePropType} from 'react-native';

export type PromotionTab = 'promotions' | 'sideNews';

export type PromotionItem = {
  id: string;
  tab: PromotionTab;
  title: string;
  publishedAt: string;
  image: ImageSourcePropType;
  summary: string;
  body: string[];
};
