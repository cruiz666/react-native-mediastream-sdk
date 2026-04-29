import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

const EPISODES = [
  {id: '1', number: 'E1', title: 'Prólogo: El inicio', duration: '45 min', progress: 100, image: 'https://picsum.photos/seed/ep1/320/180'},
  {id: '2', number: 'E2', title: 'El gran viaje', duration: '52 min', progress: 60, image: 'https://picsum.photos/seed/ep2/320/180'},
  {id: '3', number: 'E3', title: 'Profundidades', duration: '48 min', progress: 0, image: 'https://picsum.photos/seed/ep3/320/180'},
  {id: '4', number: 'E4', title: 'La corriente', duration: '50 min', progress: 0, image: 'https://picsum.photos/seed/ep4/320/180'},
  {id: '5', number: 'E5', title: 'Criaturas del abismo', duration: '55 min', progress: 0, image: 'https://picsum.photos/seed/ep5/320/180'},
];

const RECOMMENDED = [
  {id: 'r1', title: 'Naturaleza Salvaje', duration: '1h 20m', genre: 'Documental', image: 'https://picsum.photos/seed/rec1/280/176'},
  {id: 'r2', title: 'Cielos del Sur', duration: '58 min', genre: 'Naturaleza', image: 'https://picsum.photos/seed/rec2/280/176'},
  {id: 'r3', title: 'El Bosque Eterno', duration: '1h 05m', genre: 'Documental', image: 'https://picsum.photos/seed/rec3/280/176'},
  {id: 'r4', title: 'Ríos de Luz', duration: '45 min', genre: 'Naturaleza', image: 'https://picsum.photos/seed/rec4/280/176'},
  {id: 'r5', title: 'Desiertos Vivos', duration: '1h 10m', genre: 'Documental', image: 'https://picsum.photos/seed/rec5/280/176'},
];

const CAST = [
  {id: 'c1', name: 'Ana Rodríguez', role: 'Directora', image: 'https://picsum.photos/seed/cast1/96/96'},
  {id: 'c2', name: 'Marco Silva', role: 'Narrador', image: 'https://picsum.photos/seed/cast2/96/96'},
  {id: 'c3', name: 'Lena Müller', role: 'Bióloga', image: 'https://picsum.photos/seed/cast3/96/96'},
  {id: 'c4', name: 'James Park', role: 'Fotógrafo', image: 'https://picsum.photos/seed/cast4/96/96'},
  {id: 'c5', name: 'Sofia Reyes', role: 'Guionista', image: 'https://picsum.photos/seed/cast5/96/96'},
];

const SEASONS = ['Temporada 1', 'Temporada 2', 'Temporada 3'];

const NEXT_EPISODE = EPISODES[1];

const DESCRIPTION =
  'En las profundidades de los océanos, mundos ocultos aguardan ser descubiertos. ' +
  'Esta serie documental lleva a los espectadores en un viaje sin precedentes a través ' +
  'de los ecosistemas más remotos del planeta, revelando secretos que la ciencia apenas ' +
  'comienza a comprender.\n\n' +
  'Con tecnología de filmación de última generación y el trabajo de un equipo de ' +
  'biólogos marinos de talla mundial, cada episodio descubre una nueva capa de la ' +
  'complejidad oceánica.';

function NextEpisodeBanner() {
  return (
    <TouchableOpacity style={styles.nextBanner} activeOpacity={0.85}>
      <Image source={{uri: NEXT_EPISODE.image}} style={styles.nextBannerImage} />
      <View style={styles.nextBannerOverlay} />
      <View style={styles.nextBannerContent}>
        <Text style={styles.nextBannerLabel}>SIGUIENTE EPISODIO</Text>
        <Text style={styles.nextBannerTitle}>{NEXT_EPISODE.title}</Text>
        <Text style={styles.nextBannerMeta}>{NEXT_EPISODE.number}  ·  {NEXT_EPISODE.duration}</Text>
      </View>
      <View style={styles.nextBannerPlay}>
        <Text style={styles.nextBannerPlayIcon}>▶</Text>
      </View>
      <View style={styles.nextProgressBar}>
        <View style={[styles.nextProgressFill, {width: `${NEXT_EPISODE.progress}%` as any}]} />
      </View>
    </TouchableOpacity>
  );
}

function EpisodeCard({item}: {item: (typeof EPISODES)[0]}) {
  return (
    <TouchableOpacity style={styles.episodeCard} activeOpacity={0.7}>
      <View style={styles.episodeThumbnailContainer}>
        <Image source={{uri: item.image}} style={styles.episodeThumbnailImage} />
        {item.progress === 100 && (
          <View style={styles.watchedBadge}>
            <Text style={styles.watchedText}>✓</Text>
          </View>
        )}
        {item.progress > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {width: `${item.progress}%` as any}]} />
          </View>
        )}
      </View>
      <View style={styles.episodeInfo}>
        <Text style={styles.episodeNumber}>{item.number}</Text>
        <Text style={styles.episodeTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.episodeDuration}>{item.duration}</Text>
      </View>
    </TouchableOpacity>
  );
}

function RecommendedCard({item}: {item: (typeof RECOMMENDED)[0]}) {
  return (
    <TouchableOpacity style={styles.recommendedCard} activeOpacity={0.7}>
      <View style={styles.recommendedImageContainer}>
        <Image source={{uri: item.image}} style={styles.recommendedImage} />
        <View style={styles.recommendedOverlay} />
        <View style={styles.recommendedGenreBadge}>
          <Text style={styles.recommendedGenreText}>{item.genre}</Text>
        </View>
      </View>
      <Text style={styles.recommendedTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.recommendedDuration}>{item.duration}</Text>
    </TouchableOpacity>
  );
}

function CastCard({item}: {item: (typeof CAST)[0]}) {
  return (
    <View style={styles.castCard}>
      <Image source={{uri: item.image}} style={styles.castAvatar} />
      <Text style={styles.castName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.castRole} numberOfLines={1}>{item.role}</Text>
    </View>
  );
}

export function DummyContent() {
  const [expanded, setExpanded] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(0);

  return (
    <View style={styles.container}>
      {/* Title & Metadata */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Grandes Documentales: Océanos</Text>
        <View style={styles.metaRow}>
          <Text style={styles.rating}>★★★★☆</Text>
          <Text style={styles.metaDivider}>·</Text>
          <Text style={styles.meta}>2024</Text>
          <Text style={styles.metaDivider}>·</Text>
          <Text style={styles.meta}>HD</Text>
          <Text style={styles.metaDivider}>·</Text>
          <Text style={styles.meta}>3 temporadas</Text>
        </View>
        <View style={styles.tagsRow}>
          {['Documental', 'Naturaleza', 'Ciencia'].map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.descriptionSection}>
        <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>
          {DESCRIPTION}
        </Text>
        <TouchableOpacity onPress={() => setExpanded(v => !v)}>
          <Text style={styles.expandButton}>{expanded ? 'Ver menos ▲' : 'Ver más ▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>▶  Continuar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>+ Mi lista</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.iconActions}>
        {['Compartir', 'Descargar', 'Me gusta'].map(action => (
          <TouchableOpacity key={action} style={styles.iconAction} activeOpacity={0.7}>
            <View style={styles.iconCircle} />
            <Text style={styles.iconLabel}>{action}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Episode Banner */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SIGUIENTE EPISODIO</Text>
      </View>
      <View style={styles.bannerWrapper}>
        <NextEpisodeBanner />
      </View>

      {/* Episodes */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>EPISODIOS</Text>
        <View style={styles.seasonSelector}>
          {SEASONS.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedSeason(idx)}
              style={[styles.seasonTab, selectedSeason === idx && styles.seasonTabActive]}>
              <Text style={[styles.seasonTabText, selectedSeason === idx && styles.seasonTabTextActive]}>
                T{idx + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={EPISODES}
        keyExtractor={item => item.id}
        renderItem={({item}) => <EpisodeCard item={item} />}
        scrollEnabled={false}
      />

      {/* Cast */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>REPARTO Y EQUIPO</Text>
      </View>
      <FlatList
        data={CAST}
        keyExtractor={item => item.id}
        renderItem={({item}) => <CastCard item={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.castList}
      />

      {/* Recommended */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TAMBIÉN TE PUEDE GUSTAR</Text>
      </View>
      <FlatList
        data={RECOMMENDED}
        keyExtractor={item => item.id}
        renderItem={({item}) => <RecommendedCard item={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recommendedList}
      />

      <View style={styles.bottomPadding} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F0F1A',
  },

  // Title
  titleSection: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 4,
  },
  rating: {color: '#F5A623', fontSize: 14},
  metaDivider: {color: '#555', marginHorizontal: 6, fontSize: 14},
  meta: {color: '#AAAAAA', fontSize: 14},
  tagsRow: {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},
  tag: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {color: '#AAAAAA', fontSize: 12},

  // Description
  descriptionSection: {paddingHorizontal: 16, paddingBottom: 16},
  description: {color: '#CCCCCC', fontSize: 14, lineHeight: 22},
  expandButton: {color: '#007AFF', fontSize: 14, marginTop: 6, fontWeight: '500'},

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  iconActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  iconAction: {alignItems: 'center', gap: 6},
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E2E',
    borderWidth: 1,
    borderColor: '#333',
  },
  iconLabel: {color: '#888', fontSize: 12},

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Next episode banner
  bannerWrapper: {paddingHorizontal: 16, paddingBottom: 4},
  nextBanner: {
    borderRadius: 10,
    overflow: 'hidden',
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  nextBannerImage: {position: 'absolute', width: '100%', height: '100%'},
  nextBannerOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  nextBannerContent: {flex: 1, paddingLeft: 14, paddingRight: 8},
  nextBannerLabel: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  nextBannerTitle: {color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 3},
  nextBannerMeta: {color: '#AAAAAA', fontSize: 12},
  nextBannerPlay: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,122,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  nextBannerPlayIcon: {color: '#FFF', fontSize: 16, marginLeft: 3},
  nextProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  nextProgressFill: {height: 3, backgroundColor: '#007AFF'},

  // Season selector
  seasonSelector: {flexDirection: 'row', gap: 4},
  seasonTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  seasonTabActive: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  seasonTabText: {color: '#888', fontSize: 13, fontWeight: '600'},
  seasonTabTextActive: {color: '#FFFFFF'},

  // Episode cards
  episodeCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    overflow: 'hidden',
  },
  episodeThumbnailContainer: {
    width: 128,
    height: 76,
  },
  episodeThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  watchedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchedText: {color: '#FFF', fontSize: 11, fontWeight: '700'},
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#333',
  },
  progressFill: {height: 3, backgroundColor: '#007AFF'},
  episodeInfo: {flex: 1, padding: 10, justifyContent: 'center'},
  episodeNumber: {color: '#007AFF', fontSize: 11, fontWeight: '700', marginBottom: 2},
  episodeTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 18,
  },
  episodeDuration: {color: '#888', fontSize: 12},

  // Cast
  castList: {paddingHorizontal: 16, paddingBottom: 8, gap: 16},
  castCard: {alignItems: 'center', width: 72},
  castAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A2E',
    marginBottom: 6,
  },
  castName: {color: '#DDDDDD', fontSize: 11, fontWeight: '600', textAlign: 'center'},
  castRole: {color: '#777', fontSize: 10, textAlign: 'center', marginTop: 1},

  // Recommended
  recommendedList: {paddingHorizontal: 16, paddingBottom: 8, gap: 12},
  recommendedCard: {width: 140},
  recommendedImageContainer: {
    width: 140,
    height: 88,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  recommendedImage: {width: '100%', height: '100%'},
  recommendedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  recommendedGenreBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
  },
  recommendedGenreText: {
    color: '#AAAAAA',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendedTitle: {
    color: '#DDDDDD',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 2,
  },
  recommendedDuration: {color: '#777', fontSize: 12},

  bottomPadding: {height: 32},
});
