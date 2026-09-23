import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';

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
// the rest of this codebase already expects (matches what
// react-native-youtube-iframe's onChangeState emits: 'playing', 'paused',
// 'buffering', 'ended', 'unstarted', 'video cued').
const YT_STATE_MAP = {
    '-1': 'unstarted',
    0: 'ended',
    1: 'playing',
    2: 'paused',
    3: 'buffering',
    5: 'video cued',
};

/**
 * Web replacement for react-native-youtube-iframe's <YoutubePlayer>.
 * That library's play/mute/onReady props are non-functional on the web
 * target (see github.com/LonelyCpp/react-native-youtube-iframe/issues/340),
 * so this talks to the real YouTube IFrame API directly.
 *
 * Exposes the same imperative surface the rest of the app already relies on
 * via ref: getCurrentTime() -> Promise<number>, seekTo(seconds, allowSeekAhead).
 */
const YouTubeWebPlayer = forwardRef((props, ref) => {
    const {
        videoId, width, height, play, mute, isHostBool,
        onChangeState, onReady,
    } = props;

    const containerRef = useRef(null);
    const playerInstanceRef = useRef(null);
    const [isApiReady, setIsApiReady] = useState(false);

    // Refs so the one-time "create player" effect always reads the latest
    // play/mute values without needing to be re-run when they change.
    const playRef = useRef(play);
    const muteRef = useRef(mute);
    useEffect(() => { playRef.current = play; }, [play]);
    useEffect(() => { muteRef.current = mute; }, [mute]);

    // Load the IFrame API once.
    useEffect(() => {
        let cancelled = false;
        loadYouTubeIframeAPI().then(() => { if (!cancelled) setIsApiReady(true); });
        return () => { cancelled = true; };
    }, []);

    // Create (and recreate, on videoId change) the actual player instance.
    // Intentionally NOT depending on play/mute/isHostBool here — those are
    // applied imperatively below so changing them doesn't tear down and
    // rebuild the whole player (which would restart playback from 0).
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
                // Baking mute into playerVars is what lets the FIRST autoplay
                // attempt succeed under browser autoplay policy — browsers
                // allow muted autoplay without a user gesture, so joinees
                // (who never clicked anything to select this video) need
                // this to be true from the very first load.
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

    // Apply mute state imperatively whenever the `mute` prop changes.
    useEffect(() => {
        const player = playerInstanceRef.current;
        if (!player || typeof player.mute !== 'function') return;
        try {
            if (mute) player.mute();
            else player.unMute();
        } catch (e) { }
    }, [mute]);

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

    return (
        <View style={{ width, height, backgroundColor: '#000' }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </View>
    );
});

export default YouTubeWebPlayer;