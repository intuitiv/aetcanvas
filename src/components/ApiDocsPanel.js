import React from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Text, TouchableOpacity, Linking, Image } from 'react-native';
import { API_BASE } from '../services/api';

export const ApiDocsPanel = ({ docType }) => {
    // docType: 'arch' | 'map'
    const getUrl = () => {
        if (docType === 'arch') return `${API_BASE}/docs/architecture_diagram.html`;
        if (docType === 'map') return `${API_BASE}/docs/component_map.html`;
        return 'about:blank';
    };

    const url = getUrl();
    const title = docType === 'arch' ? 'Architecture Diagram' : 'Component Map';
    const icon = docType === 'arch' ? '📐' : '🗺️';

    const handleOpenBrowser = () => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    // Web Implementation: Use iframe
    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <iframe 
                    src={url}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title={title}
                />
            </View>
        );
    }

    // Native Implementation: Show Open Button
    return (
        <View style={styles.nativeContainer}>
            <View style={styles.card}>
                <Text style={styles.icon}>{icon}</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>
                    Complex diagrams are best viewed in a browser.
                </Text>
                
                <TouchableOpacity style={styles.button} onPress={handleOpenBrowser}>
                    <Text style={styles.buttonText}>Open in Browser</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#212121', 
    },
    nativeContainer: {
        flex: 1,
        backgroundColor: '#212121',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#2f2f2f',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ececf1',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#8e8ea0',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    button: {
        backgroundColor: '#10a37f',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
