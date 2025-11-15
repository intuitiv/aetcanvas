// components/CurrentToast.js
import React from 'react';
import { View } from 'react-native';

/**
 * Minimal safe replacement for Tamagui CurrentToast.
 * Keeps exported functions so imports don't break.
 * This intentionally renders nothing — replace with a richer toast
 * implementation later if you want.
 */

export function CurrentToast() {
    return null;
}

export function ToastControl() {
    // lightweight stub used for demos; you can expand this later.
    return <View />;
}
