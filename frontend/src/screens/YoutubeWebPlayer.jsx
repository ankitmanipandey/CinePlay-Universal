import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Loads the official YouTube IFrame Player API script exactly once, no matter
// how many players get mounted, and lets every mount await the same promise.
// ---------------------------------------------------------------------------
let youTubeApiPromise = null;
function loadYouTubeIframeAPI() {
    if (youTubeApiPromise) return youTubeApiPromise;

    youTubeApiPromise = new Promise((resolve) => {
        if (typeof window === 'undefined') {
            resolve(null);
            return;
        }
        if (window.YT && window.YT.Player) {
            resolve(window.YT);
            return;
        }

        const previousCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (typeof previousCallback === 'function') previousCallback();
            resolve(window.YT);
        };

        if (!document.getElementById('youtube-iframe-api-script')) {
            const tag = document.createElement('script');
            tag.id = 'youtube-iframe-api-script';
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        }
    });

    return youTubeApiPromise;
}

// Maps the official numeric YT.PlayerState codes to the same string states
// the rest of this codebase already expects.
const YT_STATE_MAP = {
    '-1': 'unstarted',
    0: 'ended',
    1: 'playing',
    2: 'paused',
    3: 'buffering',
    5: 'video cued',
};

const YouTubeWebPlayer = forwardRef((props, ref) => {
    const {
        videoId, width, height, play, mute, isHostBool,
        onChangeState, onReady,
    } = props;

    const containerRef = useRef(null);
    const playerInstanceRef = useRef(null);
    const [isApiReady, setIsApiReady] = useState(false);

    // Local mute state so joinees (and host) can toggle audio manually
    const [isLocallyMuted, setIsLocallyMuted] = useState(mute);

    // Refs so the one-time "create player" effect always reads the latest values
    const playRef = useRef(play);
    const muteRef = useRef(isLocallyMuted);

    useEffect(() => { playRef.current = play; }, [play]);
    useEffect(() => { muteRef.current = isLocallyMuted; }, [isLocallyMuted]);

    // Resync local mute if the parent forces a change (e.g. new video loaded)
    useEffect(() => {
        setIsLocallyMuted(mute);
    }, [mute]);

    // Load the IFrame API once.
    useEffect(() => {
        let cancelled = false;
        loadYouTubeIframeAPI().then(() => { if (!cancelled) setIsApiReady(true); });
        return () => { cancelled = true; };
    }, []);

    // Create the actual player instance.
    useEffect(() => {
        if (!isApiReady || !containerRef.current || !videoId || !window.YT) return;

        if (playerInstanceRef.current) {
            try { playerInstanceRef.current.destroy(); } catch (e) { }
            playerInstanceRef.current = null;
        }

        playerInstanceRef.current = new window.YT.Player(containerRef.current, {
            videoId,
            width: '100%',
            height: '100%',
            playerVars: {
                controls: isHostBool ? 1 : 0,
                modestbranding: 1,
                rel: 0,
                autoplay: 1,
                playsinline: 1,
                // Baking mute into playerVars is required for browser autoplay policies
                mute: muteRef.current ? 1 : 0,
            },
            events: {
                onReady: (event) => {
                    try {
                        if (muteRef.current) event.target.mute();
                        else event.target.unMute();
                        if (playRef.current) event.target.playVideo();
                        else event.target.pauseVideo();
                    } catch (e) { }
                    if (onReady) onReady(event);
                },
                onStateChange: (event) => {
                    const stateStr = YT_STATE_MAP[String(event.data)];
                    if (stateStr && onChangeState) onChangeState(stateStr);
                },
                onError: (event) => {
                    console.log('YouTube player error:', event && event.data);
                },
            },
        });

        return () => {
            if (playerInstanceRef.current) {
                try { playerInstanceRef.current.destroy(); } catch (e) { }
                playerInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isApiReady, videoId]);

    // Apply play/pause imperatively whenever the `play` prop changes.
    useEffect(() => {
        const player = playerInstanceRef.current;
        if (!player || typeof player.playVideo !== 'function') return;
        try {
            if (play) player.playVideo();
            else player.pauseVideo();
        } catch (e) { }
    }, [play]);

    // Apply mute state imperatively whenever `isLocallyMuted` changes.
    useEffect(() => {
        const player = playerInstanceRef.current;
        if (!player || typeof player.mute !== 'function') return;
        try {
            if (isLocallyMuted) player.mute();
            else player.unMute();
        } catch (e) { }
    }, [isLocallyMuted]);

    useImperativeHandle(ref, () => ({
        getCurrentTime: async () => {
            try {
                const player = playerInstanceRef.current;
                if (player && typeof player.getCurrentTime === 'function') {
                    return player.getCurrentTime() ?? 0;
                }
            } catch (e) { }
            return 0;
        },
        seekTo: (seconds, allowSeekAhead = true) => {
            try {
                const player = playerInstanceRef.current;
                if (player && typeof player.seekTo === 'function') {
                    player.seekTo(seconds, allowSeekAhead);
                }
            } catch (e) { }
        },
    }), []);

    const toggleLocalMute = () => {
        setIsLocallyMuted(prev => !prev);
    };

    return (
        // Root uses box-none to avoid swallowing touches universally
        <View style={{ width, height, backgroundColor: '#000', position: 'relative' }} pointerEvents="box-none">

            {/* The actual YouTube iframe */}
            <div ref={containerRef} style={{ width: '100%', height: '100%', pointerEvents: 'auto' }} />

            {/* INVISIBLE SHIELD: Blocks joinees from touching/scrubbing the YouTube player */}
            {!isHostBool && (
                <View
                    style={[StyleSheet.absoluteFill, { zIndex: 10 }]}
                    pointerEvents="auto"
                />
            )}

            {/* Mute/Unmute Button: Sits safely at Top-Left, above the invisible shield */}
            {isApiReady && (
                <TouchableOpacity
                    style={styles.muteOverlayBtn}
                    onPress={toggleLocalMute}
                    pointerEvents="auto"
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isLocallyMuted ? "volume-mute" : "volume-high"}
                        size={22}
                        color={isLocallyMuted ? "#FF007A" : "#FFF"}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    muteOverlayBtn: {
        position: 'absolute',
        // Top-Left avoids colliding with Host controls (bottom) or live viewer badges (top-right)
        top: 15,
        left: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        cursor: 'pointer',
    }
});

export default YouTubeWebPlayer;