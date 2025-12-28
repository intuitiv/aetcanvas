// components/BrandIcons.js
// Official brand icons for Gmail, Webex, Calendar, etc.
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G, Rect, Circle, Polygon } from 'react-native-svg';

// Gmail official logo (simplified envelope with M)
export const GmailIcon = ({ size = 16, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
            d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
            fill={color || '#EA4335'}
        />
    </Svg>
);

// Webex logo (stylized W)
export const WebexIcon = ({ size = 16, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <G>
            <Circle cx="12" cy="12" r="10" fill={color || '#00bceb'} />
            <Path
                d="M7 8l2.5 8 2.5-6 2.5 6 2.5-8"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </G>
    </Svg>
);

// Google Calendar logo
export const CalendarIcon = ({ size = 16, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <G>
            <Rect x="3" y="4" width="18" height="18" rx="2" fill={color || '#4285F4'} />
            <Rect x="3" y="4" width="18" height="5" fill={color || '#1967D2'} />
            <Path d="M7 2v4M17 2v4" stroke={color || '#4285F4'} strokeWidth="2" strokeLinecap="round" />
            <Rect x="7" y="12" width="3" height="3" fill="white" />
            <Rect x="11" y="12" width="3" height="3" fill="white" />
            <Rect x="15" y="12" width="2" height="3" fill="white" />
            <Rect x="7" y="16" width="3" height="3" fill="white" />
            <Rect x="11" y="16" width="3" height="3" fill="white" />
        </G>
    </Svg>
);

// Document/File icon
export const DocumentIcon = ({ size = 16, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            fill={color || '#a5e8c0'}
        />
        <Polygon points="14 2 14 8 20 8" fill={color ? color + '80' : '#6dd19a'} />
    </Svg>
);

// Link/URL icon
export const LinkIcon = ({ size = 16, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
            stroke={color || '#a5c4e8'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
            stroke={color || '#a5c4e8'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

// Brain/Memory icon
export const MemoryIcon = ({ size = 16, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
            d="M12 2a9 9 0 0 0-9 9c0 3.1 1.6 5.9 4 7.5V22h10v-3.5c2.4-1.6 4-4.4 4-7.5a9 9 0 0 0-9-9z"
            fill={color || '#c4a5e8'}
        />
        <Path
            d="M9 13c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2M8 9h1M15 9h1M9 16v2M15 16v2M12 16v3"
            stroke="white"
            strokeWidth="1.2"
            strokeLinecap="round"
        />
    </Svg>
);

// Export all brand icons in a lookup
export const BRAND_ICONS = {
    gmail: GmailIcon,
    webex: WebexIcon,
    calendar: CalendarIcon,
    document: DocumentIcon,
    url: LinkIcon,
    memory: MemoryIcon,
};

// Render brand icon by type
export const BrandIcon = ({ type, size = 16, color }) => {
    const IconComponent = BRAND_ICONS[type];
    if (IconComponent) {
        return <IconComponent size={size} color={color} />;
    }
    // Fallback to a simple circle
    return (
        <View style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color || '#888'
        }} />
    );
};

export default BrandIcon;
