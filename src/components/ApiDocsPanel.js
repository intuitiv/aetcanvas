import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { API_BASE } from '../services/api';

export const ApiDocsPanel = ({ docType }) => {
    // docType: 'arch' | 'map'
    const getUrl = () => {
        if (docType === 'arch') return `${API_BASE}/docs/architecture_diagram.html`;
        if (docType === 'map') return `${API_BASE}/docs/component_map.html`;
        return 'about:blank';
    };

    return (
        <View style={styles.container}>
            <iframe 
                src={getUrl()}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="API Doc"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f1a', // Match app bg
    },
});
