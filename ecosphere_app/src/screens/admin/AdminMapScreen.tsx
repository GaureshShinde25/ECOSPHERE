import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Map, Layers, Navigation, Zap, Activity } from 'lucide-react-native';
import { GlassCard } from '../../components/cards/GlassCard';
import { mockMapZones } from '../../data/mockData';
import { EcosystemMapZone } from '../../types';
import { Theme } from '../../theme';

export const AdminMapScreen: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<EcosystemMapZone>(mockMapZones[0]);
  const [filterType, setFilterType] = useState<string>('All');

  const filteredZones = filterType === 'All'
    ? mockMapZones
    : mockMapZones.filter((z) => z.type === filterType);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topHeader}>
            <Text style={styles.pageTitle}>Regional Geographic Topology</Text>
            <Text style={styles.pageSub}>Regional economic density grid and GIS sector boundaries</Text>
          </View>

          {/* Interactive Map Visual Simulator */}
          <GlassCard style={styles.mapCanvasCard}>
            <View style={styles.canvasHeader}>
              <View style={styles.liveTag}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveText}>PUNE REGIONAL HUB (FIXED TOPOLOGY)</Text>
              </View>
              <Text style={styles.zoomText}>GPS 18.5912° N, 73.7389° E</Text>
            </View>

            {/* Map Grid Surface */}
            <View style={styles.mapGridSurface}>
              {/* Simulated Heatmap Node Dots */}
              {mockMapZones.map((zone) => (
                <TouchableOpacity
                  key={zone.id}
                  style={[
                    styles.nodeDot,
                    {
                      left: `${zone.coordinates.x}%`,
                      top: `${zone.coordinates.y}%`,
                      backgroundColor: selectedZone.id === zone.id ? Theme.colors.primary : Theme.colors.success,
                    },
                  ]}
                  onPress={() => setSelectedZone(zone)}
                  activeOpacity={0.8}
                >
                  <View style={styles.innerDot} />
                </TouchableOpacity>
              ))}

              <View style={styles.mapGridOverlayText}>
                <Map size={36} color="rgba(47, 214, 255, 0.15)" />
                <Text style={styles.gridOverlayLabel}>INTERACTIVE ECOSYSTEM HEATMAP</Text>
              </View>
            </View>
          </GlassCard>

          {/* Selected Zone Inspector */}
          {selectedZone && (
            <GlassCard style={styles.zoneInspectorCard}>
              <View style={styles.zoneHeader}>
                <Text style={styles.zoneName}>{selectedZone.name}</Text>
                <View style={styles.intensityTag}>
                  <Activity size={12} color={Theme.colors.primary} />
                  <Text style={styles.intensityText}>{selectedZone.intensity}% Intensity</Text>
                </View>
              </View>

              <Text style={styles.zoneType}>Zone Classification: {selectedZone.type}</Text>
              <Text style={styles.activeNodesCount}>
                Active Economic Nodes: <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{selectedZone.activeNodes}</Text>
              </Text>
            </GlassCard>
          )}

          {/* All Zones List */}
          <Text style={styles.sectionTitle}>Ecosystem Heatmap Zones</Text>
          <View style={styles.zonesList}>
            {mockMapZones.map((z) => (
              <GlassCard key={z.id} style={styles.zoneCard}>
                <TouchableOpacity
                  style={styles.zoneRow}
                  activeOpacity={0.8}
                  onPress={() => setSelectedZone(z)}
                >
                  <View style={styles.zoneIconCircle}>
                    <Zap size={16} color={Theme.colors.success} />
                  </View>
                  <View style={styles.zoneInfo}>
                    <Text style={styles.zoneRowName}>{z.name}</Text>
                    <Text style={styles.zoneRowSub}>{z.type} • {z.activeNodes} Active Nodes</Text>
                  </View>
                  <Text style={styles.zoneScore}>{z.intensity}%</Text>
                </TouchableOpacity>
              </GlassCard>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topHeader: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  pageSub: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  mapCanvasCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.25)',
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(7, 17, 31, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.success,
    letterSpacing: 0.5,
    fontFamily: Theme.typography.fontFamily,
  },
  zoomText: {
    fontSize: 10,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  mapGridSurface: {
    height: 220,
    backgroundColor: '#050D18',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapGridOverlayText: {
    alignItems: 'center',
    gap: 8,
  },
  gridOverlayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.2)',
    letterSpacing: 1,
    fontFamily: Theme.typography.fontFamily,
  },
  nodeDot: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#07111F',
  },
  zoneInspectorCard: {
    padding: 16,
    marginBottom: 20,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  intensityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(47, 214, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  intensityText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  zoneType: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginBottom: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  activeNodesCount: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 12,
  },
  zonesList: {
    gap: 10,
  },
  zoneCard: {
    padding: 12,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zoneIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneInfo: {
    flex: 1,
  },
  zoneRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  zoneRowSub: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  zoneScore: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
});
