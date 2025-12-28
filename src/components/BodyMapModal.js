// components/BodyMapModal.js
// Placeholder modal for Body Map feature (System visualization)

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
} from 'react-native';

const COLORS = {
    bg: '#0f0f1a',
    panel: '#1a1a2e',
    border: 'rgba(99, 102, 241, 0.2)',
    text: '#e2e8f0',
    textDim: '#9ca3af',
    accent: '#6366f1',
};

export const BodyMapModal = ({ visible, onClose }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>📊 Body Map</Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.diagram}>
                            {`
       🧠 Brain
         │
    ┌────┴────┐
    │         │
   👁️ Eyes   👂 Ears
    │         │
    └────┬────┘
         │
       👄 Mouth
         │
       🫁 Stomach
         │
    ┌────┴────┐
    │         │
   🦾 Limbs  💪 Limbs
`}
                        </Text>

                        <View style={styles.statusSection}>
                            <Text style={styles.statusTitle}>System Status</Text>

                            <View style={styles.statusItem}>
                                <Text style={styles.statusLabel}>🧠 Brain (Reasoning)</Text>
                                <Text style={styles.statusValue}>● Active</Text>
                            </View>

                            <View style={styles.statusItem}>
                                <Text style={styles.statusLabel}>👄 Mouth (Ingestion)</Text>
                                <Text style={styles.statusValue}>● Ready</Text>
                            </View>

                            <View style={styles.statusItem}>
                                <Text style={styles.statusLabel}>🦾 Limbs (Gmail)</Text>
                                <Text style={styles.statusValue}>● Connected</Text>
                            </View>

                            <View style={styles.statusItem}>
                                <Text style={styles.statusLabel}>🫁 Stomach (Storage)</Text>
                                <Text style={styles.statusValue}>● Online</Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Full interactive body map coming soon
                        </Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modal: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: COLORS.bg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },

    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.panel,
        justifyContent: 'center',
        alignItems: 'center',
    },

    closeIcon: {
        fontSize: 16,
        color: COLORS.textDim,
    },

    content: {
        padding: 20,
    },

    diagram: {
        fontFamily: 'monospace',
        fontSize: 14,
        color: COLORS.accent,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
    },

    statusSection: {
        backgroundColor: COLORS.panel,
        borderRadius: 12,
        padding: 16,
    },

    statusTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },

    statusItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    statusLabel: {
        fontSize: 13,
        color: COLORS.textDim,
    },

    statusValue: {
        fontSize: 13,
        color: '#10b981',
    },

    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        alignItems: 'center',
    },

    footerText: {
        fontSize: 12,
        color: COLORS.textDim,
        fontStyle: 'italic',
    },
});

export default BodyMapModal;
