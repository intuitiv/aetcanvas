// components/MobileBottomNav.js
// Bottom navigation bar for mobile devices

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const COLORS = {
  bg: "#212121",
  panel: "#2f2f2f",
  border: "rgba(255, 255, 255, 0.1)",
  text: "#ececf1",
  textDim: "#8e8ea0",
  accent: "#10a37f",
  accentBg: "rgba(16, 163, 127, 0.15)",
  success: "#10b981",
};

const NAV_ITEMS = [
  {
    id: "chat",
    icon: "chatbubble",
    iconOutline: "chatbubble-outline",
    label: "Chat",
  },
  {
    id: "connections",
    icon: "link",
    iconOutline: "link-outline",
    label: "Connect",
  },
  {
    id: "notifications",
    icon: "notifications",
    iconOutline: "notifications-outline",
    label: "Alerts",
  },
];

export const MobileBottomNav = ({
  activeTab = "chat",
  onTabPress,
  isConnected = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const iconName = isActive ? item.icon : item.iconOutline;

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navItem}
              onPress={() => onTabPress?.(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={iconName}
                  size={22}
                  color={isActive ? COLORS.accent : COLORS.textDim}
                />
                {/* Connection status dot for Connect tab */}
                {item.id === "connections" && (
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isConnected
                          ? COLORS.success
                          : COLORS.textDim,
                      },
                    ]}
                  />
                )}
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {item.label}
              </Text>
              {/* Active indicator line */}
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Safe area padding for iPhone home indicator */}
      <View style={styles.safeAreaBottom} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.panel,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    position: "relative",
  },

  iconContainer: {
    position: "relative",
    marginBottom: 4,
  },

  statusDot: {
    position: "absolute",
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.panel,
  },

  label: {
    fontSize: 10,
    color: COLORS.textDim,
    fontWeight: "500",
  },

  labelActive: {
    color: COLORS.accent,
    fontWeight: "600",
  },

  activeIndicator: {
    position: "absolute",
    top: 0,
    left: "25%",
    right: "25%",
    height: 2,
    backgroundColor: COLORS.accent,
    borderRadius: 1,
  },

  safeAreaBottom: {
    height: 0,
    backgroundColor: 'transparent',
  },
});

export default MobileBottomNav;
