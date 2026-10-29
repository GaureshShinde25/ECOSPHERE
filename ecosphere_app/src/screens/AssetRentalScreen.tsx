import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Theme } from '../constants/Theme';
import { GlassCard } from '../components/GlassCard';
import { ArrowLeft, Search, Shield, Info, ArrowUpRight } from 'lucide-react-native';

interface AssetRentalScreenProps {
  onBack: () => void;
}

export const AssetRentalScreen: React.FC<AssetRentalScreenProps> = ({ onBack }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header back button */}
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={20} color={Theme.colors.text} />
        <Text style={styles.backBtnText}>Home</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Rent Assets</Text>
      <Text style={styles.pageSubtitle}>Access high-grade machinery and equipment shared by your local node</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={20} color={Theme.colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          placeholder="Search excavators, tools, vehicles..."
          placeholderTextColor={Theme.colors.secondaryText}
          style={styles.searchInput}
        />
      </View>

      {/* Asset Nodes */}
      <Text style={styles.sectionTitle}>Available Equipment</Text>

      <GlassCard style={styles.assetCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.assetName}>JCB Excavator 3DX</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Available</Text>
          </View>
        </View>
        <Text style={styles.assetSpec}>Heavy Construction • Local Node Hinjewadi</Text>

        <View style={styles.specRow}>
          <View style={styles.specItem}>
            <Text style={styles.specVal}>76 HP</Text>
            <Text style={styles.specLbl}>Engine</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specVal}>1.1 cum</Text>
            <Text style={styles.specLbl}>Bucket</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specVal}>₹2,500/hr</Text>
            <Text style={styles.specLbl}>Rate</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.rentBtn}>
          <Text style={styles.rentBtnText}>Request Rental</Text>
          <ArrowUpRight size={16} color="#07111F" />
        </TouchableOpacity>
      </GlassCard>

      <GlassCard style={styles.assetCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.assetName}>Tata Ace Truck</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Available</Text>
          </View>
        </View>
        <Text style={styles.assetSpec}>Logistics & Transport • Local Node Wakad</Text>

        <View style={styles.specRow}>
          <View style={styles.specItem}>
            <Text style={styles.specVal}>850 kg</Text>
            <Text style={styles.specLbl}>Payload</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specVal}>Diesel</Text>
            <Text style={styles.specLbl}>Fuel</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specVal}>₹350/hr</Text>
            <Text style={styles.specLbl}>Rate</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.rentBtn}>
          <Text style={styles.rentBtnText}>Request Rental</Text>
          <ArrowUpRight size={16} color="#07111F" />
        </TouchableOpacity>
      </GlassCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.lg,
    paddingBottom: 100,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  backBtnText: {
    color: Theme.colors.text,
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Theme.colors.secondaryText,
    marginTop: 4,
    marginBottom: Theme.spacing.lg,
    fontFamily: Theme.typography.fontFamily,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: Theme.spacing.lg,
    height: 52,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 15,
    fontFamily: Theme.typography.fontFamily,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily,
  },
  assetCard: {
    padding: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  assetName: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
  },
  statusBadge: {
    backgroundColor: 'rgba(37, 230, 138, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    color: Theme.colors.primaryGreen,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
  assetSpec: {
    color: Theme.colors.secondaryText,
    fontSize: 12,
    marginBottom: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: Theme.spacing.md,
  },
  specItem: {
    alignItems: 'center',
    flex: 1,
  },
  specVal: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
  specLbl: {
    color: Theme.colors.secondaryText,
    fontSize: 11,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  rentBtn: {
    backgroundColor: Theme.colors.primaryBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
  },
  rentBtnText: {
    color: '#07111F',
    fontWeight: '750' as any,
    fontSize: 14,
    marginRight: 6,
    fontFamily: Theme.typography.fontFamily,
  },
});
