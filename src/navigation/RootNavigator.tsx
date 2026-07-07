/**
 * Root bottom-tab navigator + deep-link config.
 *
 * Tabs: Home · Browse · Cart (with live badge) · Account.
 * The `forkly://` linking config lets preview + content deep links route to the
 * right screen; preview URLs (?sfp-preview=…) are additionally forwarded to the
 * SDK by PersonalizationProvider.
 */

import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from './types';
import { colors } from '../theme';
import { HomeStack, BrowseStack, AccountStack } from './stacks';
import CartScreen from '../screens/CartScreen';
import { useCart } from '../context/CartContext';

const Tab = createBottomTabNavigator<RootTabParamList>();

const linking: LinkingOptions<RootTabParamList> = {
  prefixes: ['forkly://', 'personalizationdemo://'],
  config: {
    screens: {
      HomeTab: {
        screens: {
          Home: 'home',
          RestaurantDetail: 'restaurant/:restaurantId',
          DishDetail: 'dish/:itemId',
        },
      },
      BrowseTab: { screens: { Browse: 'browse' } },
      CartTab: 'cart',
      AccountTab: { screens: { Account: 'account', Activity: 'activity' } },
    },
  },
};

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={[styles.tabIcon, { color }]}>{emoji}</Text>;
}

export default function RootNavigator() {
  const cart = useCart();
  return (
    <NavigationContainer linking={linking}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        }}>
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
          }}
        />
        <Tab.Screen
          name="BrowseTab"
          component={BrowseStack}
          options={{
            title: 'Browse',
            tabBarIcon: ({ color }) => <TabIcon emoji="🔍" color={color} />,
          }}
        />
        <Tab.Screen
          name="CartTab"
          component={CartScreen}
          options={{
            title: 'Cart',
            tabBarIcon: ({ color }) => <TabIcon emoji="🛒" color={color} />,
            tabBarBadge: cart.count > 0 ? cart.count : undefined,
          }}
        />
        <Tab.Screen
          name="AccountTab"
          component={AccountStack}
          options={{
            title: 'Account',
            tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: { fontSize: 20 },
});
