// components/Provider.js
import React from 'react';

/**
 * Minimal provider that mirrors TamaguiProvider usage without adding
 * Tamagui. This simply passes children through.
 *
 * If you want theme handling or toast behaviour later, we can extend
 * this into a proper Context provider that matches your app's needs.
 */

export function Provider({ children }) {
    return children;
}
