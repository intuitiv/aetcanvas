// components/ContactsTab.js
// Contacts directory tab - list, search, and manage contacts

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    TextInput,
    ActivityIndicator,
    Modal,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../services/api';

const COLORS = {
    bg: '#212121',
    panel: '#2f2f2f',
    card: '#3a3a3a',
    border: 'rgba(255, 255, 255, 0.1)',
    text: '#ececf1',
    textDim: '#b4b4b4',
    accent: '#10a37f',
    accentBg: 'rgba(16, 163, 127, 0.15)',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    gmail: '#ea4335',
    outlook: '#0078d4',
    webex: '#00bceb',
};

const CONTACT_TYPE_ICONS = {
    person: 'person',
    group: 'people',
    room: 'chatbubbles',
    organization: 'business',
};

const ContactItem = ({ contact, onPress, onFavoriteToggle, onSpamToggle }) => {
    // Get channels from contact.channels object
    const channels = contact.channels || {};
    const hasGmail = !!channels.personal_email;
    const hasOutlook = !!channels.work_email || !!channels.outlook;
    const hasWebex = !!channels.webex_id || !!channels.webex_email;

    // Determine primary color based on sources
    const getSourceColor = () => {
        if ((hasGmail || hasOutlook) && hasWebex) return '#22c55e'; // Both = green
        if (hasWebex) return COLORS.webex;
        if (hasOutlook) return COLORS.outlook;
        if (hasGmail) return COLORS.gmail;
        return COLORS.textDim;
    };

    return (
        <TouchableOpacity
            style={[styles.contactItem, contact.is_spam && styles.contactItemSpam]}
            onPress={() => onPress(contact)}
        >
            {/* Source color indicator */}
            <View style={[styles.sourceIndicator, { backgroundColor: getSourceColor() }]} />

            {/* Name */}
            <Text style={[styles.contactName, contact.is_spam && styles.contactNameSpam]} numberOfLines={1}>
                {contact.name}
            </Text>

            {/* Right side icons */}
            <View style={styles.contactIcons}>
                {/* Spam indicator */}
                {contact.is_spam && (
                    <Ionicons name="ban" size={14} color={COLORS.danger} style={styles.contactIcon} />
                )}

                {/* Favorite star */}
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        onFavoriteToggle(contact);
                    }}
                >
                    <Ionicons
                        name={contact.is_favorite ? 'star' : 'star-outline'}
                        size={16}
                        color={contact.is_favorite ? COLORS.warning : 'rgba(255,255,255,0.2)'}
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const ContactDetail = ({ contact, visible, onClose, onUpdate }) => {
    // Track all editable fields in state
    const [formData, setFormData] = useState({
        name: '',
        contact_type: 'person',
        category: '',
        user_relationship: '',
    });
    const [newAlias, setNewAlias] = useState('');
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null); // 'type', 'category', 'relationship'

    // Suggestions for dropdowns (users can add custom)
    const TYPE_OPTIONS = ['person', 'group', 'room', 'organization'];

    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name || '',
                contact_type: contact.contact_type || 'person',
                category: contact.category || '',
                user_relationship: contact.user_relationship || '',
            });
            setHasChanges(false);
        }
    }, [contact]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!contact || !hasChanges) return;
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/contacts/${contact.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                const updated = await response.json();
                onUpdate(updated);
                setHasChanges(false);
            }
        } catch (err) {
            console.error('Failed to update contact:', err);
        }
        setSaving(false);
    };

    const handleAddAlias = async () => {
        if (!contact || !newAlias.trim()) return;
        try {
            const response = await fetch(`${API_BASE_URL}/contacts/${contact.id}/aliases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alias: newAlias.trim() }),
            });
            if (response.ok) {
                const refreshed = await fetch(`${API_BASE_URL}/contacts/${contact.id}`);
                if (refreshed.ok) {
                    onUpdate(await refreshed.json());
                }
                setNewAlias('');
            }
        } catch (err) {
            console.error('Failed to add alias:', err);
        }
    };

    const handleRemoveAlias = async (aliasId) => {
        if (!contact) return;
        try {
            await fetch(`${API_BASE_URL}/contacts/${contact.id}/aliases/${aliasId}`, {
                method: 'DELETE',
            });
            const refreshed = await fetch(`${API_BASE_URL}/contacts/${contact.id}`);
            if (refreshed.ok) {
                onUpdate(await refreshed.json());
            }
        } catch (err) {
            console.error('Failed to remove alias:', err);
        }
    };

    const toggleFavorite = async () => {
        if (!contact) return;
        try {
            await fetch(`${API_BASE_URL}/contacts/${contact.id}/favorite?is_favorite=${!contact.is_favorite}`, {
                method: 'POST',
            });
            const refreshed = await fetch(`${API_BASE_URL}/contacts/${contact.id}`);
            if (refreshed.ok) {
                onUpdate(await refreshed.json());
            }
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        }
    };

    const toggleSpam = async () => {
        if (!contact) return;
        try {
            await fetch(`${API_BASE_URL}/contacts/${contact.id}/spam?is_spam=${!contact.is_spam}`, {
                method: 'POST',
            });
            const refreshed = await fetch(`${API_BASE_URL}/contacts/${contact.id}`);
            if (refreshed.ok) {
                onUpdate(await refreshed.json());
            }
        } catch (err) {
            console.error('Failed to toggle spam:', err);
        }
    };

    const toggleInformational = async () => {
        if (!contact) return;
        try {
            await fetch(`${API_BASE_URL}/contacts/${contact.id}/informational?is_informational=${!contact.is_informational}`, {
                method: 'POST',
            });
            const refreshed = await fetch(`${API_BASE_URL}/contacts/${contact.id}`);
            if (refreshed.ok) {
                onUpdate(await refreshed.json());
            }
        } catch (err) {
            console.error('Failed to toggle informational:', err);
        }
    };

    if (!contact) return null;

    // Render a clean dropdown select
    const renderSelect = (id, label, options, currentValue, onSelect, allowCustom = true) => {
        const isOpen = openDropdown === id;
        const displayValue = currentValue ? currentValue.replace(/_/g, ' ') : 'Select...';

        return (
            <View style={styles.selectGroup}>
                <Text style={styles.selectLabel}>{label}</Text>
                <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setOpenDropdown(isOpen ? null : id)}
                >
                    <Text style={[
                        styles.selectText,
                        !currentValue && styles.selectPlaceholder
                    ]}>
                        {displayValue}
                    </Text>
                    <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={COLORS.textDim}
                    />
                </TouchableOpacity>
                {isOpen && (
                    <View style={styles.selectDropdown}>
                        <ScrollView style={styles.selectScroll} nestedScrollEnabled>
                            {options.map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        styles.selectOption,
                                        currentValue === opt && styles.selectOptionActive
                                    ]}
                                    onPress={() => {
                                        onSelect(opt);
                                        setOpenDropdown(null);
                                    }}
                                >
                                    <Text style={[
                                        styles.selectOptionText,
                                        currentValue === opt && styles.selectOptionTextActive
                                    ]}>
                                        {opt.replace(/_/g, ' ')}
                                    </Text>
                                    {currentValue === opt && (
                                        <Ionicons name="checkmark" size={16} color={COLORS.accent} />
                                    )}
                                </TouchableOpacity>
                            ))}
                            {allowCustom && (
                                <View style={styles.customOptionRow}>
                                    <TextInput
                                        style={styles.customOptionInput}
                                        placeholder="Custom..."
                                        placeholderTextColor={COLORS.textDim}
                                        onSubmitEditing={(e) => {
                                            if (e.nativeEvent.text.trim()) {
                                                onSelect(e.nativeEvent.text.trim().toLowerCase());
                                                setOpenDropdown(null);
                                            }
                                        }}
                                    />
                                </View>
                            )}
                        </ScrollView>
                    </View>
                )}
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Contact</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {/* Row 1: Name */}
                        <View style={styles.formRow}>
                            <Text style={styles.formLabel}>Name</Text>
                            <TextInput
                                style={styles.formInput}
                                value={formData.name}
                                onChangeText={(v) => updateField('name', v)}
                                placeholder="Contact name"
                                placeholderTextColor={COLORS.textDim}
                            />
                        </View>

                        {/* Row 2: Type */}
                        <View style={styles.formRow}>
                            <Text style={styles.formLabel}>Type</Text>
                            <TouchableOpacity
                                style={styles.formSelect}
                                onPress={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                            >
                                <Text style={styles.formSelectText}>{formData.contact_type}</Text>
                                <Ionicons name="chevron-down" size={14} color={COLORS.textDim} />
                            </TouchableOpacity>
                        </View>
                        {openDropdown === 'type' && (
                            <View style={styles.inlineDropdown}>
                                {TYPE_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.inlineOption, formData.contact_type === opt && styles.inlineOptionActive]}
                                        onPress={() => { updateField('contact_type', opt); setOpenDropdown(null); }}
                                    >
                                        <Text style={[styles.inlineOptionText, formData.contact_type === opt && styles.inlineOptionTextActive]}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Relationship (Category) - Only for Person type */}
                        {formData.contact_type === 'person' && (
                            <>
                                <View style={styles.formRow}>
                                    <Text style={styles.formLabel}>Relationship</Text>
                                    <TouchableOpacity
                                        style={styles.formSelect}
                                        onPress={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                                    >
                                        <Text style={[styles.formSelectText, !formData.category && styles.formSelectPlaceholder]}>
                                            {formData.category ? formData.category.replace(/_/g, ' ') : 'Select...'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={14} color={COLORS.textDim} />
                                    </TouchableOpacity>
                                </View>
                                {openDropdown === 'category' && (
                                    <View style={styles.inlineDropdown}>
                                        {['colleague', 'manager', 'report', 'friend', 'close_friend', 'family', 'acquaintance', 'business', 'other'].map(opt => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[styles.inlineOption, formData.category === opt && styles.inlineOptionActive]}
                                                onPress={() => { updateField('category', opt); setOpenDropdown(null); }}
                                            >
                                                <Text style={[styles.inlineOptionText, formData.category === opt && styles.inlineOptionTextActive]}>{opt.replace(/_/g, ' ')}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}

                        {/* Aliases - Inline */}
                        <View style={styles.formRow}>
                            <Text style={styles.formLabel}>Aliases</Text>
                            <View style={styles.aliasInline}>
                                {contact.aliases?.length > 0 ? (
                                    contact.aliases.map(alias => (
                                        <View key={alias.id} style={styles.aliasChip}>
                                            <Text style={styles.aliasChipText}>{alias.alias}</Text>
                                            <TouchableOpacity onPress={() => handleRemoveAlias(alias.id)}>
                                                <Ionicons name="close" size={12} color={COLORS.textDim} />
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.formValueDim}>None</Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.formRow}>
                            <Text style={styles.formLabel}></Text>
                            <View style={styles.addAliasInline}>
                                <TextInput
                                    style={styles.aliasInputSmall}
                                    value={newAlias}
                                    onChangeText={setNewAlias}
                                    placeholder="Add alias..."
                                    placeholderTextColor={COLORS.textDim}
                                    onSubmitEditing={handleAddAlias}
                                />
                                <TouchableOpacity onPress={handleAddAlias} style={styles.addAliasBtn}>
                                    <Ionicons name="add" size={16} color={COLORS.accent} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Channels */}
                        <Text style={styles.sectionTitle}>Channels</Text>
                        {(!contact.channels || Object.keys(contact.channels).filter(k => contact.channels[k]).length === 0) ? (
                            <Text style={styles.formValueDim}>No channels linked</Text>
                        ) : (
                            Object.entries(contact.channels).map(([key, value]) => {
                                if (!value || key === 'webex_id') return null;
                                const channelConfig = {
                                    personal_email: { color: COLORS.gmail, label: 'Gmail' },
                                    work_email: { color: COLORS.outlook, label: 'Outlook' },
                                    outlook: { color: COLORS.outlook, label: 'Outlook' },
                                    webex_email: { color: COLORS.webex, label: 'Webex' },
                                    phone: { color: '#22c55e', label: 'Phone' },
                                };
                                const config = channelConfig[key] || { color: COLORS.accent, label: key };
                                return (
                                    <View key={key} style={styles.channelCompact}>
                                        <View style={[styles.channelDotSmall, { backgroundColor: config.color }]} />
                                        <Text style={styles.channelKeyShort}>{config.label}</Text>
                                        <Text style={styles.channelValueText} numberOfLines={1}>{value}</Text>
                                    </View>
                                );
                            })
                        )}

                        {/* Professional Info */}
                        {(contact.designation || contact.department) && (
                            <>
                                <View style={styles.divider} />
                                <Text style={styles.sectionTitle}>Professional</Text>
                                {contact.designation && (
                                    <View style={styles.formRow}>
                                        <Text style={styles.formLabel}>Title</Text>
                                        <Text style={styles.formValueDim}>{contact.designation}</Text>
                                    </View>
                                )}
                                {contact.department && (
                                    <View style={styles.formRow}>
                                        <Text style={styles.formLabel}>Dept</Text>
                                        <Text style={styles.formValueDim}>{contact.department}</Text>
                                    </View>
                                )}
                            </>
                        )}

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Status Toggles - Only Favorite and Spam */}
                        <View style={styles.statusRowCompact}>
                            <TouchableOpacity
                                style={[styles.statusChip, contact.is_favorite && styles.statusChipActive]}
                                onPress={toggleFavorite}
                            >
                                <Ionicons name={contact.is_favorite ? 'star' : 'star-outline'} size={14} color={contact.is_favorite ? COLORS.warning : COLORS.textDim} />
                                <Text style={styles.statusChipText}>Favorite</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.statusChip, contact.is_spam && styles.statusChipDanger]}
                                onPress={toggleSpam}
                            >
                                <Ionicons name={contact.is_spam ? 'ban' : 'ban-outline'} size={14} color={contact.is_spam ? COLORS.danger : COLORS.textDim} />
                                <Text style={styles.statusChipText}>Spam</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Close</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving || !hasChanges}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    {hasChanges ? 'Save Changes' : 'No Changes'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export const ContactsTab = ({ visible }) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scraping, setScraping] = useState(false);
    const [scrapeResult, setScrapeResult] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // all, favorites, spam
    const [selectedContact, setSelectedContact] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

    // Track window width for responsive layout
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setWindowWidth(window.width);
        });
        return () => subscription?.remove();
    }, []);

    // Determine number of columns based on width
    const numColumns = windowWidth < 768 ? 1 : windowWidth < 1024 ? 2 : 3;

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        try {
            let url = `${API_BASE_URL}/contacts?`;
            if (filter === 'favorites') url += 'only_favorites=true&';
            if (filter === 'spam') url += 'include_spam=true&';
            if (searchQuery) {
                url = `${API_BASE_URL}/contacts/search?q=${encodeURIComponent(searchQuery)}`;
            }

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setContacts(data);
            }
        } catch (err) {
            console.error('Failed to fetch contacts:', err);
        }
        setLoading(false);
    }, [filter, searchQuery]);

    useEffect(() => {
        if (visible) {
            fetchContacts();
        }
    }, [visible, fetchContacts]);

    const handleScrapeAll = async () => {
        setScraping(true);
        setScrapeResult(null);
        try {
            const response = await fetch(`${API_BASE_URL}/contacts/scrape/all?max_emails=50&days=30`, {
                method: 'POST',
            });
            if (response.ok) {
                const results = await response.json();
                const totalCreated = results.reduce((sum, r) => sum + r.contacts_created, 0);
                setScrapeResult({
                    success: true,
                    message: `Scraped ${totalCreated} contacts from ${results.length} sources`,
                    details: results,
                });
                // Refresh contact list
                fetchContacts();
            } else {
                setScrapeResult({
                    success: false,
                    message: 'Failed to scrape contacts',
                });
            }
        } catch (err) {
            console.error('Failed to scrape contacts:', err);
            setScrapeResult({
                success: false,
                message: err.message || 'Scrape failed',
            });
        }
        setScraping(false);
    };

    const handleFavoriteToggle = async (contact) => {
        try {
            await fetch(`${API_BASE_URL}/contacts/${contact.id}/favorite?is_favorite=${!contact.is_favorite}`, {
                method: 'POST',
            });
            fetchContacts();
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        }
    };

    const handleContactPress = (contact) => {
        setSelectedContact(contact);
        setDetailVisible(true);
    };

    const handleContactUpdate = (updated) => {
        setSelectedContact(updated);
        fetchContacts();
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={COLORS.textDim} />
                <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search contacts..."
                    placeholderTextColor={COLORS.textDim}
                    onSubmitEditing={fetchContacts}
                    returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={COLORS.textDim} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {['all', 'favorites', 'spam'].map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, filter === f && styles.filterTabActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[
                            styles.filterTabText,
                            filter === f && styles.filterTabTextActive
                        ]}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}

                {/* Scrape Button */}
                <TouchableOpacity
                    style={styles.scrapeButton}
                    onPress={handleScrapeAll}
                    disabled={scraping}
                >
                    {scraping ? (
                        <ActivityIndicator size="small" color={COLORS.accent} />
                    ) : (
                        <>
                            <Ionicons name="download-outline" size={14} color={COLORS.accent} />
                            <Text style={styles.scrapeButtonText}>Scrape</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Scrape Result Banner */}
            {scrapeResult && (
                <View style={[
                    styles.scrapeBanner,
                    scrapeResult.success ? styles.scrapeBannerSuccess : styles.scrapeBannerError
                ]}>
                    <Ionicons
                        name={scrapeResult.success ? 'checkmark-circle' : 'alert-circle'}
                        size={16}
                        color={scrapeResult.success ? COLORS.success : COLORS.danger}
                    />
                    <Text style={styles.scrapeBannerText}>{scrapeResult.message}</Text>
                    <TouchableOpacity onPress={() => setScrapeResult(null)}>
                        <Ionicons name="close" size={16} color={COLORS.textDim} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Contact List - Grid on desktop, single column on mobile */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={contacts}
                    keyExtractor={item => item.id}
                    numColumns={numColumns}
                    key={`grid-${numColumns}`}
                    columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
                    renderItem={({ item }) => (
                        <ContactItem
                            contact={item}
                            onPress={handleContactPress}
                            onFavoriteToggle={handleFavoriteToggle}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={48} color={COLORS.textDim} />
                            <Text style={styles.emptyText}>No contacts found</Text>
                            <Text style={styles.emptySubtext}>
                                Click Scrape to import contacts from your email
                            </Text>
                        </View>
                    }
                    contentContainerStyle={[
                        styles.gridContainer,
                        contacts.length === 0 && styles.emptyList
                    ]}
                />
            )}

            {/* Contact Detail Modal */}
            <ContactDetail
                contact={selectedContact}
                visible={detailVisible}
                onClose={() => setDetailVisible(false)}
                onUpdate={handleContactUpdate}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.panel,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        margin: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 14,
        marginLeft: 8,
    },

    // Filters
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    filterTab: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginRight: 8,
        backgroundColor: COLORS.panel,
    },
    filterTabActive: {
        backgroundColor: COLORS.accentBg,
    },
    filterTabText: {
        color: COLORS.textDim,
        fontSize: 13,
    },
    filterTabTextActive: {
        color: COLORS.accent,
        fontWeight: '600',
    },

    // Scrape Button
    scrapeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginLeft: 'auto',
        backgroundColor: COLORS.accentBg,
        gap: 4,
    },
    scrapeButtonText: {
        color: COLORS.accent,
        fontSize: 12,
        fontWeight: '500',
    },

    // Scrape Banner
    scrapeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 8,
        gap: 8,
    },
    scrapeBannerSuccess: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
    },
    scrapeBannerError: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    scrapeBannerText: {
        flex: 1,
        color: COLORS.text,
        fontSize: 13,
    },

    // Grid Layout
    gridContainer: {
        paddingHorizontal: 8,
        paddingTop: 4,
    },
    gridRow: {
        justifyContent: 'flex-start',
        gap: 6,
    },

    // Contact Item - Grid Card
    contactItem: {
        flex: 1,
        minWidth: 180,
        maxWidth: '32%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: COLORS.panel,
        borderRadius: 6,
        marginBottom: 6,
        marginHorizontal: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    favoriteIndicator: {
        marginRight: 4,
    },
    contactIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.accentBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    contactIconFavorite: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
    },
    contactName: {
        flex: 1,
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '500',
    },
    contactNameSpam: {
        color: COLORS.textDim,
        textDecorationLine: 'line-through',
    },
    contactItemSpam: {
        opacity: 0.6,
    },
    sourceIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginRight: 8,
    },
    contactIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 8,
    },
    contactIcon: {
        marginRight: 0,
    },
    iconButton: {
        padding: 2,
    },

    // Empty State
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyList: {
        flex: 1,
    },
    emptyText: {
        color: COLORS.text,
        fontSize: 16,
        marginTop: 16,
    },
    emptySubtext: {
        color: COLORS.textDim,
        fontSize: 13,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 32,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
        backgroundColor: COLORS.panel,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '600',
    },
    modalBody: {
        padding: 16,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 12,
    },

    // Fields
    fieldGroup: {
        marginBottom: 16,
    },
    fieldLabel: {
        color: COLORS.textDim,
        fontSize: 12,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    fieldValue: {
        color: COLORS.text,
        fontSize: 15,
    },
    fieldInput: {
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 12,
        color: COLORS.text,
        fontSize: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    // Type Badge
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.accentBg,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    typeText: {
        color: COLORS.accent,
        fontSize: 13,
        marginLeft: 6,
        textTransform: 'capitalize',
    },

    // Channel Rows (Modal)
    channelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    channelIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    channelIndicatorText: {
        fontSize: 11,
        fontWeight: '700',
    },
    channelEmail: {
        color: COLORS.text,
        fontSize: 13,
        flex: 1,
    },
    channelLabel: {
        color: COLORS.textDim,
        fontSize: 12,
        marginRight: 8,
        minWidth: 80,
    },
    noChannels: {
        color: COLORS.textDim,
        fontSize: 13,
        fontStyle: 'italic',
    },

    // Aliases
    aliasesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    aliasBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    aliasText: {
        color: COLORS.text,
        fontSize: 13,
    },
    aliasRemove: {
        marginLeft: 6,
    },
    noAliases: {
        color: COLORS.textDim,
        fontSize: 13,
        fontStyle: 'italic',
    },
    addAliasRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    aliasInput: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 10,
        color: COLORS.text,
        fontSize: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    addAliasButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: COLORS.accentBg,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Status Row
    statusRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    statusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: COLORS.card,
        gap: 6,
    },
    statusActive: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
    },
    statusText: {
        color: COLORS.textDim,
        fontSize: 13,
    },

    // Picker Pills (Category/Relationship)
    pickerRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pickerPill: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    pickerPillActive: {
        backgroundColor: COLORS.accentBg,
        borderColor: COLORS.accent,
    },
    pickerPillText: {
        color: COLORS.textDim,
        fontSize: 12,
        textTransform: 'capitalize',
    },
    pickerPillTextActive: {
        color: COLORS.accent,
        fontWeight: '600',
    },

    // Buttons
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: COLORS.accentBg,
        gap: 6,
    },
    editButtonText: {
        color: COLORS.accent,
        fontSize: 14,
        fontWeight: '500',
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: COLORS.card,
    },
    cancelButtonText: {
        color: COLORS.textDim,
        fontSize: 14,
    },
    saveButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: COLORS.accent,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    saveButtonDisabled: {
        backgroundColor: COLORS.card,
        opacity: 0.6,
    },

    // Name input
    nameInput: {
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 12,
        color: COLORS.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },

    // Professional Info (read-only)
    readOnlyInfo: {
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    infoText: {
        color: COLORS.textDim,
        fontSize: 13,
    },

    // Custom input for category/relationship
    customInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    customInput: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 10,
        color: COLORS.text,
        fontSize: 13,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    customApplyButton: {
        backgroundColor: COLORS.accent,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    customApplyText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    currentCustomValue: {
        color: COLORS.accent,
        fontSize: 11,
        marginTop: 6,
        fontStyle: 'italic',
    },

    // Dropdown Select styles
    selectGroup: {
        marginBottom: 16,
        zIndex: 1,
    },
    selectLabel: {
        color: COLORS.textDim,
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    selectButton: {
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    selectText: {
        color: COLORS.text,
        fontSize: 14,
        textTransform: 'capitalize',
    },
    selectPlaceholder: {
        color: COLORS.textDim,
    },
    selectDropdown: {
        backgroundColor: COLORS.panel,
        borderRadius: 8,
        marginTop: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    selectScroll: {
        maxHeight: 180,
    },
    selectOption: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    selectOptionActive: {
        backgroundColor: COLORS.accentBg,
    },
    selectOptionText: {
        color: COLORS.text,
        fontSize: 14,
        textTransform: 'capitalize',
    },
    selectOptionTextActive: {
        color: COLORS.accent,
        fontWeight: '600',
    },
    customOptionRow: {
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    customOptionInput: {
        backgroundColor: COLORS.card,
        borderRadius: 6,
        padding: 10,
        color: COLORS.text,
        fontSize: 13,
    },

    // Compact Form Styles
    formRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        minHeight: 36,
    },
    formLabel: {
        width: 80,
        color: COLORS.textDim,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    formInput: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 10,
        color: COLORS.text,
        fontSize: 13,
    },
    formSelect: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    formSelectText: {
        color: COLORS.text,
        fontSize: 13,
        textTransform: 'capitalize',
    },
    formSelectPlaceholder: {
        color: COLORS.textDim,
    },
    formValueDim: {
        flex: 1,
        color: COLORS.textDim,
        fontSize: 12,
        fontStyle: 'italic',
    },

    // Inline Dropdown
    inlineDropdown: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginLeft: 80,
        marginBottom: 12,
    },
    inlineOption: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: COLORS.card,
        borderRadius: 4,
    },
    inlineOptionActive: {
        backgroundColor: COLORS.accentBg,
    },
    inlineOptionText: {
        color: COLORS.textDim,
        fontSize: 11,
        textTransform: 'capitalize',
    },
    inlineOptionTextActive: {
        color: COLORS.accent,
        fontWeight: '600',
    },

    // Alias Compact
    aliasInline: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    aliasChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 4,
        gap: 4,
    },
    aliasChipText: {
        color: COLORS.text,
        fontSize: 11,
    },
    addAliasInline: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    aliasInputSmall: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 4,
        paddingVertical: 6,
        paddingHorizontal: 8,
        color: COLORS.text,
        fontSize: 11,
    },
    addAliasBtn: {
        padding: 4,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginVertical: 12,
    },

    // Section Title
    sectionTitle: {
        color: COLORS.textDim,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },

    // Channel Compact
    channelCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6,
    },
    channelDotSmall: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    channelKeyShort: {
        color: COLORS.textDim,
        fontSize: 10,
        width: 45,
    },
    channelValueText: {
        flex: 1,
        color: COLORS.text,
        fontSize: 11,
    },

    // Status Compact
    statusRowCompact: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: COLORS.card,
        borderRadius: 4,
        gap: 5,
    },
    statusChipActive: {
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
    },
    statusChipDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    statusChipText: {
        color: COLORS.textDim,
        fontSize: 11,
    },
});

export default ContactsTab;
