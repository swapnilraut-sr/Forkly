/**
 * Forkly — a demo food-delivery app that validates the public API surface of
 * `@salesforce-personalization/react-native-personalization`.
 *
 * Provider stack:
 *   SafeAreaProvider
 *     └─ PersonalizationProvider  (SDK bootstrap: logging, launch event, preview deep links)
 *          └─ CartProvider        (cart state → Cart/Order events)
 *               └─ RootNavigator  (bottom tabs + nested stacks)
 *
 * The native Salesforce SDK is initialized by the host app in AppDelegate.swift
 * (iOS) / MainApplication.kt (Android) before React Native starts — there is no
 * JS-side configure().
 */

import * as React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersonalizationProvider } from './src/context/PersonalizationContext';
import { CartProvider } from './src/context/CartContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <PersonalizationProvider>
        <CartProvider>
          <RootNavigator />
        </CartProvider>
      </PersonalizationProvider>
    </SafeAreaProvider>
  );
}
