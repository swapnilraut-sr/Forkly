/**
 * Per-tab native stacks.
 *
 * HomeStack and BrowseStack both push into RestaurantDetail / DishDetail so the
 * same ContentZone-bearing detail screens are reachable from two entry points.
 * AccountStack pushes into the Activity log.
 */

import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  AccountStackParamList,
  BrowseStackParamList,
  HomeStackParamList,
} from './types';
import { colors } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import BrowseScreen from '../screens/BrowseScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import DishDetailScreen from '../screens/DishDetailScreen';
import AccountScreen from '../screens/AccountScreen';
import ActivityScreen from '../screens/ActivityScreen';

const headerOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text },
} as const;

const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
export function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={headerOptions}>
      <HomeStackNav.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStackNav.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ title: 'Restaurant' }}
      />
      <HomeStackNav.Screen
        name="DishDetail"
        component={DishDetailScreen}
        options={{ title: 'Dish' }}
      />
    </HomeStackNav.Navigator>
  );
}

const BrowseStackNav = createNativeStackNavigator<BrowseStackParamList>();
export function BrowseStack() {
  return (
    <BrowseStackNav.Navigator screenOptions={headerOptions}>
      <BrowseStackNav.Screen name="Browse" component={BrowseScreen} options={{ headerShown: false }} />
      <BrowseStackNav.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ title: 'Restaurant' }}
      />
      <BrowseStackNav.Screen
        name="DishDetail"
        component={DishDetailScreen}
        options={{ title: 'Dish' }}
      />
    </BrowseStackNav.Navigator>
  );
}

const AccountStackNav = createNativeStackNavigator<AccountStackParamList>();
export function AccountStack() {
  return (
    <AccountStackNav.Navigator screenOptions={headerOptions}>
      <AccountStackNav.Screen name="Account" component={AccountScreen} options={{ headerShown: false }} />
      <AccountStackNav.Screen name="Activity" component={ActivityScreen} options={{ title: 'SDK Activity' }} />
    </AccountStackNav.Navigator>
  );
}
