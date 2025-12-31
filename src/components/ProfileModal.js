// components/ProfileModal.js
// User profile viewing and editing modal

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    ActivityIndicator,
    Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_BASE } from '../services/api';

const COLORS = {
    bg: '#0f0f1a',
    panel: '#1a1a2e',
    card: '#252542',
    border: 'rgba(99, 102, 241, 0.2)',
    text: '#e2e8f0',
    textDim: '#9ca3af',
    accent: '#6366f1',
    accentBg: 'rgba(99, 102, 241, 0.15)',
    success: '#22c55e',
    gmail: '#ea4335',
    outlook: '#0078d4',
    webex: '#00bceb',
    tabActive: '#6366f1',
    tabInactive: 'transparent',
};

export const ProfileModal = ({ visible, onClose }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // Editable fields
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [timezone, setTimezone] = useState('');
    const [phonePersonal, setPhonePersonal] = useState('');
    const [phoneWork, setPhoneWork] = useState('');

    useEffect(() => {
        if (visible) {
            fetchProfile();
        }
    }, [visible]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`);
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                setDisplayName(data.display_name || data.full_name || '');
                setBio(data.bio || '');
                setTimezone(data.timezone || 'Asia/Kolkata');
                setPhonePersonal(data.phone_personal || '');
                setPhoneWork(data.phone_work || '');
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    display_name: displayName,
                    bio,
                    timezone,
                    phone_personal: phonePersonal,
                    phone_work: phoneWork,
                }),
            });
            if (response.ok) {
                const updated = await response.json();
                setProfile(updated);
                setEditMode(false);
            }
        } catch (err) {
            console.error('Failed to save profile:', err);
        }
        setSaving(false);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>My Profile</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={COLORS.textDim} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.accent} />
                        </View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            <ScrollView style={styles.content}>
                                {/* Avatar & Name */}
                                <View style={styles.avatarSection}>
                                    <View style={styles.avatar}>
                                        {profile?.photo_url ? (
                                            <Image source={{ uri: profile.photo_url }} style={styles.avatarImage} />
                                        ) : (
                                            <Text style={styles.avatarText}>
                                                {getInitials(displayName || profile?.full_name)}
                                            </Text>
                                        )}
                                    </View>
                                    {editMode ? (
                                        <TextInput
                                            style={styles.nameInput}
                                            value={displayName}
                                            onChangeText={setDisplayName}
                                            placeholder="Display Name"
                                            placeholderTextColor={COLORS.textDim}
                                        />
                                    ) : (
                                        <Text style={styles.name}>{displayName || profile?.full_name || 'Set your name'}</Text>
                                    )}
                                </View>

                                {/* Bio */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionLabel}>Bio</Text>
                                    {editMode ? (
                                        <TextInput
                                            style={[styles.input, styles.bioInput]}
                                            value={bio}
                                            onChangeText={setBio}
                                            placeholder="Tell us about yourself..."
                                            placeholderTextColor={COLORS.textDim}
                                            multiline
                                        />
                                    ) : (
                                        <Text style={styles.bioText}>{bio || 'No bio set'}</Text>
                                    )}
                                </View>

                                {/* Connected Accounts */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionLabel}>Connected Accounts</Text>

                                    {profile?.gmail_id && (
                                        <View style={styles.channelRow}>
                                            <View style={[styles.channelBadge, { backgroundColor: COLORS.gmail + '20' }]}>
                                                <Text style={[styles.channelBadgeText, { color: COLORS.gmail }]}>G</Text>
                                            </View>
                                            <Text style={styles.channelLabel}>Gmail (Personal)</Text>
                                            <Text style={styles.channelValue}>{profile.gmail_id}</Text>
                                        </View>
                                    )}

                                    {profile?.outlook_id && (
                                        <View style={styles.channelRow}>
                                            <View style={[styles.channelBadge, { backgroundColor: COLORS.outlook + '20' }]}>
                                                <Text style={[styles.channelBadgeText, { color: COLORS.outlook }]}>O</Text>
                                            </View>
                                            <Text style={styles.channelLabel}>Outlook (Work)</Text>
                                            <Text style={styles.channelValue}>{profile.outlook_id}</Text>
                                        </View>
                                    )}

                                    {profile?.webex_email && (
                                        <View style={styles.channelRow}>
                                            <View style={[styles.channelBadge, { backgroundColor: COLORS.webex + '20' }]}>
                                                <Text style={[styles.channelBadgeText, { color: COLORS.webex }]}>W</Text>
                                            </View>
                                            <Text style={styles.channelLabel}>Webex</Text>
                                            <Text style={styles.channelValue}>{profile.webex_email}</Text>
                                        </View>
                                    )}

                                    {!profile?.gmail_id && !profile?.outlook_id && !profile?.webex_email && (
                                        <Text style={styles.noChannels}>No accounts connected. Go to Settings to connect.</Text>
                                    )}
                                </View>

                                {/* Phone Numbers */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionLabel}>Phone Numbers</Text>
                                    {editMode ? (
                                        <>
                                            <View style={styles.inputRow}>
                                                <Text style={styles.inputLabel}>Personal:</Text>
                                                <TextInput
                                                    style={styles.phoneInput}
                                                    value={phonePersonal}
                                                    onChangeText={setPhonePersonal}
                                                    placeholder="+91 98765 43210"
                                                    placeholderTextColor={COLORS.textDim}
                                                />
                                            </View>
                                            <View style={styles.inputRow}>
                                                <Text style={styles.inputLabel}>Work:</Text>
                                                <TextInput
                                                    style={styles.phoneInput}
                                                    value={phoneWork}
                                                    onChangeText={setPhoneWork}
                                                    placeholder="+91 98765 43210"
                                                    placeholderTextColor={COLORS.textDim}
                                                />
                                            </View>
                                        </>
                                    ) : (
                                        <>
                                            {profile?.phone_personal && (
                                                <Text style={styles.phoneText}>📱 Personal: {profile.phone_personal}</Text>
                                            )}
                                            {profile?.phone_work && (
                                                <Text style={styles.phoneText}>📞 Work: {profile.phone_work}</Text>
                                            )}
                                            {!profile?.phone_personal && !profile?.phone_work && (
                                                <Text style={styles.noChannels}>No phone numbers set</Text>
                                            )}
                                        </>
                                    )}
                                </View>

                                {/* Timezone */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionLabel}>Timezone</Text>
                                    {editMode ? (
                                        <TextInput
                                            style={styles.input}
                                            value={timezone}
                                            onChangeText={setTimezone}
                                            placeholder="Asia/Kolkata"
                                            placeholderTextColor={COLORS.textDim}
                                        />
                                    ) : (
                                        <Text style={styles.valueText}>{timezone || 'Not set'}</Text>
                                    )}
                                </View>
                            </ScrollView>

                            {/* Footer */}
                            <View style={styles.footer}>
                                {editMode ? (
                                    <>
                                        <TouchableOpacity style={styles.cancelButton} onPress={() => setEditMode(false)}>
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                                            {saving ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.saveButtonText}>Save</Text>
                                            )}
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(true)}>
                                        <Ionicons name="pencil" size={16} color="#fff" />
                                        <Text style={styles.editButtonText}>Edit Profile</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
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
        maxWidth: 450,
        maxHeight: '80%',
        backgroundColor: COLORS.panel,
        borderRadius: 16,
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
    loadingContainer: {
        padding: 60,
        alignItems: 'center',
    },
    content: {
        padding: 16,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.accentBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.accent,
    },
    name: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
    },
    nameInput: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 10,
        textAlign: 'center',
        minWidth: 200,
    },
    section: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 12,
        color: COLORS.textDim,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 12,
        color: COLORS.text,
        fontSize: 14,
    },
    bioInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    bioText: {
        color: COLORS.text,
        fontSize: 14,
        lineHeight: 20,
    },
    channelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    channelBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    channelBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    channelLabel: {
        color: COLORS.textDim,
        fontSize: 13,
        marginRight: 8,
    },
    channelValue: {
        color: COLORS.text,
        fontSize: 13,
        flex: 1,
        textAlign: 'right',
    },
    noChannels: {
        color: COLORS.textDim,
        fontSize: 13,
        fontStyle: 'italic',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    inputLabel: {
        color: COLORS.textDim,
        fontSize: 13,
        width: 70,
    },
    phoneInput: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 10,
        color: COLORS.text,
        fontSize: 14,
    },
    phoneText: {
        color: COLORS.text,
        fontSize: 14,
        marginBottom: 6,
    },
    valueText: {
        color: COLORS.text,
        fontSize: 14,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.accent,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        gap: 6,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    cancelButtonText: {
        color: COLORS.textDim,
        fontSize: 14,
    },
    saveButton: {
        backgroundColor: COLORS.accent,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ProfileModal;
