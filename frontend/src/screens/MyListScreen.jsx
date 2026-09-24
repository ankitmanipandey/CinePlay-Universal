import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Image, ActivityIndicator, useWindowDimensions, ScrollView, Animated, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMyListLogic } from '../hooks/useMyListLogic';

// Subcomponent for the Desktop Hoverable Card
const DesktopMovieCard = ({ item, watchlist, watched, router, handleAuthAction, handleStatusChange }) => {
    const inWatchlist = !!watchlist[item.id];
    const inWatched = !!watched[item.id];

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [isHovered, setIsHovered] = useState(false);

    const handleHoverIn = () => {
        setIsHovered(true);
        Animated.spring(scaleAnim, { toValue: 1.05, friction: 8, tension: 40, useNativeDriver: true }).start();
    };

    const handleHoverOut = () => {
        setIsHovered(false);
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
    };

    const navigateToPlayer = () => {
        router.push({ pathname: '/player', params: { id: item.id, type: item.media_type } });
    };

    return (
        <Pressable
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            onPress={navigateToPlayer}
            style={styles.pressableCardDesktop}
        >
            <Animated.View style={[
                styles.desktopCard,
                { transform: [{ scale: scaleAnim }] },
                isHovered && styles.desktopCardHovered
            ]}>
                <View style={styles.desktopPosterContainer}>
                    <Image source={{ uri: item.poster }} style={styles.desktopPoster} />
                    <View style={styles.desktopRatingBadge}>
                        <Ionicons name="star" size={12} color="#F5C518" />
                        <Text style={styles.desktopRatingText}>{item.rating}</Text>
                    </View>

                    <View style={[styles.desktopPlayOverlay, isHovered && styles.desktopPlayOverlayHovered]}>
                        <LinearGradient colors={['#00E5FF', '#9B51E0', '#FF007A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.playGradientDesktop}>
                            <Ionicons name="play" size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
                        </LinearGradient>
                    </View>
                </View>

                <View style={styles.desktopDetails}>
                    <Text style={styles.desktopTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.desktopMeta}>{item.year} • {item.duration}</Text>
                    <View style={styles.desktopActions}>
                        <TouchableOpacity
                            style={styles.smallIconBtnDesktop}
                            onPress={(e) => {
                                e.stopPropagation && e.stopPropagation();
                                handleAuthAction(() => handleStatusChange(item.id, item.media_type, 'watchlist'));
                            }}
                        >
                            <Ionicons name={inWatchlist ? "bookmark" : "bookmark-outline"} size={16} color={inWatchlist ? "#FF007A" : "#FFFFFF"} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.smallIconBtnDesktop}
                            onPress={(e) => {
                                e.stopPropagation && e.stopPropagation();
                                handleAuthAction(() => handleStatusChange(item.id, item.media_type, 'watched'));
                            }}
                        >
                            <Ionicons name="checkmark-done" size={16} color={inWatched ? "#00E5FF" : "#FFFFFF"} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
};

export default function MyListScreenWeb() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const {
        router, insets, activeTab, setActiveTab, isLoading,
        watchlist, watched, handleAuthAction, handleStatusChange, activeData,
        moviesData
    } = useMyListLogic();

    // --------------------------------------------------------
    // DESKTOP LAYOUT (Grid Widescreen)
    // --------------------------------------------------------
    if (isDesktop) {
        return (
            <View style={styles.desktopContainer}>
                <View style={styles.desktopHeader}>
                    <View style={styles.headerLeftDesktop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnDesktop}>
                            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitleDesktop}>My Activity</Text>
                    </View>

                    <View style={styles.desktopTabs}>
                        <TouchableOpacity style={styles.desktopTab} onPress={() => setActiveTab('watchlist')} activeOpacity={0.8}>
                            <Text style={[styles.desktopTabText, activeTab === 'watchlist' && styles.activeTabText]}>Watchlist</Text>
                            {activeTab === 'watchlist' && <LinearGradient colors={['#00E5FF', '#9B51E0', '#FF007A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.desktopTabIndicator} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.desktopTab} onPress={() => setActiveTab('watched')} activeOpacity={0.8}>
                            <Text style={[styles.desktopTabText, activeTab === 'watched' && styles.activeTabText]}>Watched</Text>
                            {activeTab === 'watched' && <LinearGradient colors={['#00E5FF', '#9B51E0', '#FF007A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.desktopTabIndicator} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#00E5FF" style={{ marginTop: 100 }} />
                ) : activeData.length === 0 ? (
                    <View style={styles.emptyContainerDesktop}>
                        <Ionicons name="film-outline" size={64} color="rgba(255,255,255,0.2)" />
                        <Text style={styles.emptyTextDesktop}>No movies in this list yet.</Text>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.desktopGrid}
                    >
                        {activeData.map((item) => (
                            <DesktopMovieCard
                                key={item.id}
                                item={item}
                                watchlist={watchlist}
                                watched={watched}
                                router={router}
                                handleAuthAction={handleAuthAction}
                                handleStatusChange={handleStatusChange}
                            />
                        ))}
                    </ScrollView>
                )}
            </View>
        );
    }

    // --------------------------------------------------------
    // MOBILE & TABLET LAYOUT (Exact Native Clone)
    // --------------------------------------------------------
    const renderMovieItem = ({ item }) => {
        const inWatchlist = !!watchlist[item.id];
        const inWatched = !!watched[item.id];

        return (
            <TouchableOpacity
                style={styles.movieCardMobile}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/player', params: { id: item.id, type: item.media_type } })}
            >
                <View style={styles.posterContainerMobile}>
                    <Image source={{ uri: item.poster }} style={styles.posterMobile} resizeMode="cover" />
                    <View style={styles.translucentRatingBadgeMobile}>
                        <Ionicons name="star" size={10} color="#F5C518" />
                        <Text style={styles.ratingTextMobile}>{item.rating}</Text>
                    </View>
                </View>

                <View style={styles.detailsContainerMobile}>
                    <Text style={styles.titleMobile} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.metadataMobile}>{item.year}  •  {item.duration}</Text>
                    <Text style={styles.genreMobile} numberOfLines={1}>{item.genre}</Text>

                    <View style={styles.actionButtonsRowMobile}>
                        <TouchableOpacity
                            style={styles.smallIconBtnMobile}
                            activeOpacity={0.8}
                            onPress={(e) => {
                                e.stopPropagation && e.stopPropagation();
                                handleAuthAction(() => handleStatusChange(item.id, item.media_type, 'watchlist'));
                            }}
                        >
                            <Ionicons name={inWatchlist ? "bookmark" : "bookmark-outline"} size={16} color={inWatchlist ? "#FF007A" : "#FFFFFF"} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.smallIconBtnMobile}
                            activeOpacity={0.8}
                            onPress={(e) => {
                                e.stopPropagation && e.stopPropagation();
                                handleAuthAction(() => handleStatusChange(item.id, item.media_type, 'watched'));
                            }}
                        >
                            <Ionicons name="checkmark-done" size={14} color={inWatched ? "#00E5FF" : "#FFFFFF"} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.playIconBtnMobile}>
                    <LinearGradient colors={['#00E5FF', '#9B51E0', '#FF007A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.playGradientMobile}>
                        <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
                    </LinearGradient>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <LinearGradient colors={['#170D22', '#0A0A0C']} style={styles.backgroundMobile}>
            <View style={[styles.containerMobile, { paddingTop: insets.top }]}>
                <View style={styles.headerMobile}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButtonMobile}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitleMobile}>My Activity</Text>
                    <View style={styles.headerPlaceholderMobile} />
                </View>

                <View style={styles.tabContainerMobile}>
                    <TouchableOpacity style={styles.tabMobile} onPress={() => setActiveTab('watchlist')} activeOpacity={0.8}>
                        <Text style={[styles.tabTextMobile, activeTab === 'watchlist' && styles.activeTabText]}>Watchlist</Text>
                        {activeTab === 'watchlist' && <LinearGradient colors={['#00E5FF', '#9B51E0', '#FF007A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.activeTabIndicatorMobile} />}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.tabMobile} onPress={() => setActiveTab('watched')} activeOpacity={0.8}>
                        <Text style={[styles.tabTextMobile, activeTab === 'watched' && styles.activeTabText]}>Watched</Text>
                        {activeTab === 'watched' && <LinearGradient colors={['#00E5FF', '#9B51E0', '#FF007A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.activeTabIndicatorMobile} />}
                    </TouchableOpacity>
                </View>

                {isLoading && moviesData.length === 0 ? (
                    <View style={styles.loaderContainerMobile}>
                        <ActivityIndicator size="large" color="#00E5FF" />
                    </View>
                ) : (
                    <FlatList
                        data={activeData}
                        extraData={{ watchlist, watched }}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMovieItem}
                        contentContainerStyle={styles.listContentMobile}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainerMobile}>
                                <Ionicons name="film-outline" size={48} color="rgba(255,255,255,0.2)" style={styles.emptyIconMobile} />
                                <Text style={styles.emptyTextMobile}>No movies in this list yet.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    // --- DESKTOP STYLES (>= 1024px) ---
    desktopContainer: { flex: 1, backgroundColor: '#0A0A0C', padding: 32 },
    desktopHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
    headerLeftDesktop: { flexDirection: 'row', alignItems: 'center' },
    backBtnDesktop: { marginRight: 24, cursor: 'pointer' },
    headerTitleDesktop: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },

    desktopTabs: { flexDirection: 'row', backgroundColor: '#1C1C22', borderRadius: 24, padding: 6, gap: 8 },
    desktopTab: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, position: 'relative', cursor: 'pointer' },
    desktopTabText: { color: '#8F98A0', fontSize: 15, fontWeight: '600' },
    activeTabText: { color: '#FFFFFF', fontWeight: 'bold' },
    desktopTabIndicator: { position: 'absolute', bottom: 0, left: 24, right: 24, height: 3, borderRadius: 2 },

    desktopGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
        paddingBottom: 60,
        paddingTop: 10,
        paddingHorizontal: 12 // Gives the scaled cards room on the left and right edges
    },

    pressableCardDesktop: { cursor: 'pointer', zIndex: 1 },
    desktopCard: { width: 220, backgroundColor: '#17171C', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    desktopCardHovered: {
        borderColor: 'rgba(0, 229, 255, 0.5)',
        shadowColor: '#00E5FF',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15
    },

    desktopPosterContainer: { width: '100%', height: 330, position: 'relative' },
    desktopPoster: { width: '100%', height: '100%' },
    desktopRatingBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    desktopRatingText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

    desktopPlayOverlay: { position: 'absolute', bottom: -24, right: 16, width: 48, height: 48, borderRadius: 24, overflow: 'hidden', shadowColor: '#9B51E0', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
    desktopPlayOverlayHovered: { shadowColor: '#00E5FF', shadowOpacity: 0.8, shadowRadius: 15, elevation: 10, transform: [{ scale: 1.1 }] },
    playGradientDesktop: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    desktopDetails: { padding: 16, paddingTop: 32 },
    desktopTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    desktopMeta: { color: '#8F98A0', fontSize: 13, marginBottom: 12 },
    desktopActions: { flexDirection: 'row', gap: 12 },
    smallIconBtnDesktop: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },

    emptyContainerDesktop: { alignItems: 'center', marginTop: 100 },
    emptyTextDesktop: { color: '#8F98A0', fontSize: 18, marginTop: 16 },

    // --- MOBILE & TABLET STYLES (< 1024px) ---
    backgroundMobile: { flex: 1 },
    containerMobile: { flex: 1 },
    headerMobile: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backButtonMobile: { padding: 4, cursor: 'pointer' },
    headerTitleMobile: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
    headerPlaceholderMobile: { width: 32 },

    tabContainerMobile: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 8 },
    tabMobile: { flex: 1, paddingVertical: 16, alignItems: 'center', position: 'relative', cursor: 'pointer' },
    tabTextMobile: { color: '#8F98A0', fontSize: 15, fontWeight: '600' },
    activeTabIndicatorMobile: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 },

    loaderContainerMobile: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContentMobile: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

    movieCardMobile: { flexDirection: 'row', backgroundColor: '#1E1428', borderRadius: 12, marginBottom: 16, overflow: 'hidden', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    posterContainerMobile: { position: 'relative' },
    posterMobile: { width: 105, height: 155 },
    translucentRatingBadgeMobile: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.65)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
    ratingTextMobile: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', marginLeft: 3, marginTop: 1 },

    detailsContainerMobile: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' },
    titleMobile: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4, letterSpacing: 0.3 },
    metadataMobile: { color: '#8F98A0', fontSize: 12, marginBottom: 4, fontWeight: '500' },
    genreMobile: { color: '#A0A0A5', fontSize: 11, fontStyle: 'italic' },

    actionButtonsRowMobile: { flexDirection: 'row', gap: 12, marginTop: 12 },
    smallIconBtnMobile: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },

    playIconBtnMobile: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', marginRight: 14 },
    playGradientMobile: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    emptyContainerMobile: { alignItems: 'center', marginTop: '40%' },
    emptyIconMobile: { marginBottom: 16 },
    emptyTextMobile: { color: '#8F98A0', fontSize: 15, fontWeight: '500' }
});