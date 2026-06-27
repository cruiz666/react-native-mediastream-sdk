import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MediastreamPlayer} from '../components/MediastreamPlayer';
import type {MediastreamPlayerCommands} from '../native/types';

const BASE_URL         = 'https://0de2-201-214-210-57.ngrok-free.app';
const PLAYLIST_URL     = `${BASE_URL}/custom-list`;
const ALL_EPISODES_URL = `${BASE_URL}/custom-list/all`;
const UNLOCK_URL       = `${BASE_URL}/custom-list/unlock`;
const PLAYER_ID        = '6a3c2697b277d80ecc839bef';
const MEDIA_ID         = '6a3c23b5f9d0d9b174c18ae5';

const NGROK_HEADERS    = {'ngrok-skip-browser-warning': 'true'};
const TAB_SIZE         = 50;
const COLS             = 6;
const CELL_GAP         = 6;
const PANEL_H_PAD      = 16;

const ACCENT    = '#E53935';
const CELL_BG   = '#1A1A1A';
const PANEL_BG  = '#0D0D0D';

interface Episode {
  _id: string;
  order: number;
  title: string;
  contentDetail: string;
  description: string | null;
  isLocked: boolean;
}

interface Props {
  onBack: () => void;
}

export function MicroDramasScreen({onBack}: Props) {
  const playerRef = useRef<MediastreamPlayerCommands>(null);
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [playerKey, setPlayerKey]                 = useState(0);
  const [startFromId, setStartFromId]             = useState<string | undefined>(undefined);
  const [gridVisible, setGridVisible]             = useState(false);
  const [currentOrder, setCurrentOrder]           = useState<number>(1);
  const [episodes, setEpisodes]                   = useState<Episode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [activeTab, setActiveTab]                 = useState(0);
  const [lockedEpisodeId, setLockedEpisodeId]     = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking]             = useState(false);

  // Cell size — fits COLS columns with GAP between each
  const cellSize = useMemo(() => {
    const panelWidth = width;
    return Math.floor(
      (panelWidth - PANEL_H_PAD * 2 - CELL_GAP * (COLS - 1)) / COLS,
    );
  }, [width]);

  // Tab definitions: "0 - 49", "50 - 99", …
  const tabs = useMemo(() => {
    const total = episodes.length;
    if (total === 0) return [];
    const t: {label: string; start: number; end: number}[] = [];
    for (let s = 0; s < total; s += TAB_SIZE) {
      const e = Math.min(s + TAB_SIZE - 1, total - 1);
      t.push({label: `${s} - ${e}`, start: s, end: e});
    }
    return t;
  }, [episodes]);

  const tabEpisodes = useMemo(() => {
    if (!tabs[activeTab]) return episodes;
    const {start, end} = tabs[activeTab];
    return episodes.slice(start, end + 1);
  }, [episodes, tabs, activeTab]);

  // Fetch full list when panel opens (cached)
  useEffect(() => {
    if (!gridVisible || episodes.length > 0) return;
    setIsLoadingEpisodes(true);
    fetch(ALL_EPISODES_URL, {headers: NGROK_HEADERS})
      .then(r => r.json())
      .then(data => {
        setEpisodes(data.medias ?? []);
        // Set initial tab to the one containing the current episode
        const idx = (data.medias ?? []).findIndex(
          (ep: Episode) => ep.order === currentOrder,
        );
        if (idx >= 0) setActiveTab(Math.floor(idx / TAB_SIZE));
      })
      .catch(err => console.warn('[MD] episodes fetch error:', err))
      .finally(() => setIsLoadingEpisodes(false));
  }, [gridVisible, episodes.length, currentOrder]);

  // ── Event handlers ──────────────────────────────────────────────────────────

  const handleEpisodeInfoClick = useCallback(
    (e: {nativeEvent: {order: number; id?: string; [key: string]: unknown}}) => {
      console.log('[MD] onEpisodeInfoClick', e.nativeEvent);
      setCurrentOrder(e.nativeEvent.order);
      setGridVisible(true);
    },
    [],
  );

  const handleLockedEpisode = useCallback(
    (e: {nativeEvent: {episodeId: string}}) => {
      console.log('[MD] onLockedEpisode', e.nativeEvent.episodeId);
      setLockedEpisodeId(e.nativeEvent.episodeId);
    },
    [],
  );

  const handleSwipeToItem = useCallback(
    (e: {nativeEvent: {itemId: string}}) => {
      console.log('[MD] onSwipeToItem', e.nativeEvent.itemId);
    },
    [],
  );

  const handleDismissButton = useCallback(() => {
    console.log('[MD] onDismissButton');
    onBack();
  }, [onBack]);

  // ── Unlock ──────────────────────────────────────────────────────────────────

  const handleUnlock = useCallback(async () => {
    if (!lockedEpisodeId || isUnlocking) return;
    setIsUnlocking(true);
    try {
      const res = await fetch(UNLOCK_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', ...NGROK_HEADERS},
        body: JSON.stringify({mediaId: lockedEpisodeId}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEpisodes(prev =>
        prev.map(ep =>
          ep._id === lockedEpisodeId ? {...ep, isLocked: false} : ep,
        ),
      );
      playerRef.current?.refreshFrom(lockedEpisodeId);
      setLockedEpisodeId(null);
    } catch (err) {
      console.warn('[MD] unlock error:', err);
    } finally {
      setIsUnlocking(false);
    }
  }, [lockedEpisodeId, isUnlocking]);

  const handleCancelUnlock = useCallback(() => {
    if (!isUnlocking) setLockedEpisodeId(null);
  }, [isUnlocking]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <MediastreamPlayer
        key={playerKey}
        ref={playerRef}
        style={{width, height: height - insets.bottom}}
        id={MEDIA_ID}
        playerId={PLAYER_ID}
        type="VERTICAL"
        autoplay={true}
        isDebug={true}
        trackEnable={false}
        customUI={false}
        customPlaylistOrigin={{
          baseUrl: PLAYLIST_URL,
          headers: NGROK_HEADERS,
          startFromMediaId: startFromId,
        }}
        onPlayerReady={() => console.log('[MD] Player ready')}
        onPlay={() => console.log('[MD] Playing')}
        onPause={() => console.log('[MD] Paused')}
        onEnd={() => console.log('[MD] Ended')}
        onEndReached={() => console.log('[MD] End of playlist')}
        onError={e => console.warn('[MD] Error:', e.nativeEvent.error)}
        onAdEvent={e => console.log('[MD] Ad:', e.nativeEvent.type)}
        onEpisodeInfoClick={handleEpisodeInfoClick}
        onLockedEpisode={handleLockedEpisode}
        onSwipeToItem={handleSwipeToItem}
        onDismissButton={handleDismissButton}
      />

      {/* ── Episode grid panel ─────────────────────────────────────────────── */}
      <Modal
        visible={gridVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGridVisible(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setGridVisible(false)}>
          <Pressable style={styles.panel} onPress={() => {}}>
            {/* Handle */}
            <View style={styles.panelHandle} />

            {/* Tab row */}
            {tabs.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabBar}
                contentContainerStyle={styles.tabBarContent}>
                {tabs.map((tab, i) => (
                  <TouchableOpacity
                    key={tab.label}
                    style={styles.tab}
                    onPress={() => setActiveTab(i)}>
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === i && styles.tabTextActive,
                      ]}>
                      {tab.label}
                    </Text>
                    {activeTab === i && <View style={styles.tabUnderline} />}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.tab}>
                  <Text style={styles.tabAllText}>All Episodes {'>'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            <View style={styles.divider} />

            {/* Grid */}
            {isLoadingEpisodes ? (
              <ActivityIndicator
                color={ACCENT}
                size="large"
                style={styles.loadingIndicator}
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.gridScroll}
                contentContainerStyle={[
                  styles.gridContent,
                  {paddingHorizontal: PANEL_H_PAD},
                ]}>
                <View style={styles.grid}>
                  {tabEpisodes.map(ep => {
                    const isActive = ep.order === currentOrder;
                    return (
                      <TouchableOpacity
                        key={ep._id}
                        activeOpacity={0.7}
                        onPress={() => {
                          console.log('[MD] cell tap → order:', ep.order, '_id:', ep._id);
                          setGridVisible(false);
                          setStartFromId(ep._id);
                          setPlayerKey(k => k + 1);
                        }}
                        style={[
                          styles.cell,
                          {width: cellSize, height: cellSize},
                          isActive && styles.cellActive,
                        ]}>
                        <Text
                          style={[
                            styles.cellNum,
                            isActive && styles.cellNumActive,
                          ]}>
                          {ep.order}
                        </Text>

                        {/* Playing bars indicator */}
                        {isActive && (
                          <View style={styles.playingDots}>
                            {[0, 1, 2].map(b => (
                              <View
                                key={b}
                                style={[
                                  styles.playingBar,
                                  {height: 4 + b * 3},
                                ]}
                              />
                            ))}
                          </View>
                        )}

                        {/* Lock badge */}
                        {ep.isLocked && (
                          <View style={styles.lockBadge}>
                            <Text style={styles.lockBadgeText}>🔒</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Lock overlay ──────────────────────────────────────────────────── */}
      <Modal
        visible={lockedEpisodeId !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelUnlock}>
        <View style={styles.lockOverlay}>
          <View style={styles.lockCard}>
            <View style={styles.lockIconCircle}>
              <Text style={styles.lockEmoji}>🔒</Text>
            </View>
            <Text style={styles.lockTitle}>Episodio bloqueado</Text>
            <Text style={styles.lockSubtitle}>
              Desbloquea este episodio para continuar viendo
            </Text>

            <TouchableOpacity
              style={[
                styles.unlockBtn,
                isUnlocking && styles.unlockBtnLoading,
              ]}
              onPress={handleUnlock}
              activeOpacity={0.8}>
              {isUnlocking ? (
                <View style={styles.unlockBtnInner}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.unlockBtnText, {marginLeft: 8}]}>
                    Procesando...
                  </Text>
                </View>
              ) : (
                <Text style={styles.unlockBtnText}>Desbloquear</Text>
              )}
            </TouchableOpacity>

            {!isUnlocking && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancelUnlock}
                hitSlop={12}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ── Panel ──
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: PANEL_BG,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '70%',
  },
  panelHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    alignSelf: 'center',
    marginBottom: 14,
  },

  // ── Tabs ──
  tabBar: {
    flexGrow: 0,
  },
  tabBarContent: {
    paddingHorizontal: PANEL_H_PAD,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginRight: 16,
    alignItems: 'center',
  },
  tabText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabAllText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '400',
  },
  tabUnderline: {
    height: 2,
    width: '100%',
    backgroundColor: ACCENT,
    borderRadius: 1,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginTop: 4,
    marginBottom: 12,
  },

  // ── Grid ──
  loadingIndicator: {
    marginVertical: 40,
  },
  gridScroll: {
    maxHeight: 400,
  },
  gridContent: {
    paddingBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
  },
  cell: {
    backgroundColor: CELL_BG,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    backgroundColor: '#2A1F1F',
    borderWidth: 1,
    borderColor: ACCENT + '55',
  },
  cellNum: {
    color: '#ccc',
    fontSize: 18,
    fontWeight: '500',
  },
  cellNumActive: {
    color: '#fff',
    fontWeight: '700',
  },
  playingDots: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  playingBar: {
    width: 3,
    backgroundColor: ACCENT,
    borderRadius: 2,
  },
  lockBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadgeText: {
    fontSize: 9,
  },

  // ── Lock overlay ──
  lockOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  lockCard: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  lockIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ACCENT + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  lockEmoji: {
    fontSize: 32,
  },
  lockTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  lockSubtitle: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  unlockBtn: {
    width: '100%',
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtnLoading: {
    opacity: 0.7,
  },
  unlockBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#555',
    fontSize: 14,
  },
});
