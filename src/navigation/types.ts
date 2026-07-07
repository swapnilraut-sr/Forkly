/**
 * Navigation param lists.
 *
 * Structure:
 *   RootTabs (bottom tabs)
 *     ├─ HomeStack (native stack)
 *     │    ├─ Home
 *     │    ├─ RestaurantDetail   (1 level deep — has its own ContentZones)
 *     │    └─ DishDetail         (2 levels deep — has a ContentZone)
 *     ├─ BrowseStack (native stack)
 *     │    ├─ Browse
 *     │    └─ RestaurantDetail
 *     ├─ Cart
 *     └─ AccountStack (native stack)
 *          ├─ Account
 *          └─ Activity            (SDK call log)
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  Home: undefined;
  RestaurantDetail: { restaurantId: string };
  DishDetail: { itemId: string };
};

export type BrowseStackParamList = {
  Browse: undefined;
  RestaurantDetail: { restaurantId: string };
  DishDetail: { itemId: string };
};

export type AccountStackParamList = {
  Account: undefined;
  Activity: undefined;
};

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  BrowseTab: NavigatorScreenParams<BrowseStackParamList>;
  CartTab: undefined;
  AccountTab: NavigatorScreenParams<AccountStackParamList>;
};
