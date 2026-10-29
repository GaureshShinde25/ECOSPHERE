import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Navigation, Check, Search, Globe, ShieldCheck } from 'lucide-react-native';
import { OnboardingContainer } from '../../components/onboarding/OnboardingContainer';
import { Theme } from '../../theme';

interface LocationSetupScreenProps {
  initialCity?: string;
  onBack: () => void;
  onNext: (city: string) => void;
}

export const SUPPORTED_CITIES = [
  { id: 'Kolkata', name: 'Kolkata', state: 'West Bengal', isHub: true, badge: 'ECOSPHERE HUB' },
  { id: 'Mumbai', name: 'Mumbai', state: 'Maharashtra', isHub: false },
  { id: 'Delhi NCR', name: 'Delhi NCR', state: 'National Capital Region', isHub: false },
  { id: 'Bengaluru', name: 'Bengaluru', state: 'Karnataka', isHub: false },
  { id: 'Hyderabad', name: 'Hyderabad', state: 'Telangana', isHub: false },
  { id: 'Pune', name: 'Pune', state: 'Maharashtra', isHub: false },
  { id: 'Chennai', name: 'Chennai', state: 'Tamil Nadu', isHub: false },
  { id: 'Ahmedabad', name: 'Ahmedabad', state: 'Gujarat', isHub: false },
];

export const LocationSetupScreen: React.FC<LocationSetupScreenProps> = ({
  initialCity = 'Kolkata',
  onBack,
  onNext,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>(initialCity || 'Kolkata');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detecting, setDetecting] = useState<boolean>(false);
  const [detectedMessage, setDetectedMessage] = useState<string>('');

  const filteredCities = SUPPORTED_CITIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDetectLocation = () => {
    setDetecting(true);
    setDetectedMessage('');

    // Graceful detection simulation / geolocation check
    setTimeout(() => {
      setDetecting(false);
      // Select primary ecosystem hub
      setSelectedCity('Kolkata');
      setDetectedMessage('Location detected: Kolkata, West Bengal (Primary Hub)');
    }, 800);
  };

  const handleContinue = () => {
    onNext(selectedCity);
  };

  return (
    <OnboardingContainer
      step={2}
      totalSteps={5}
      title="Where are you based?"
      subtitle="Your location helps us discover opportunities, businesses, services and work around you."
      onBack={onBack}
      onPrimaryAction={handleContinue}
      primaryActionLabel="CONTINUE"
      primaryActionDisabled={!selectedCity}
    >
      {/* Radar Map Pin Atmosphere Badge */}
      <View style={styles.radarCard}>
        <View style={styles.radarPulseOuter}>
          <View style={styles.radarPulseInner}>
            <MapPin size={28} color="#25E68A" />
          </View>
        </View>
        <View style={styles.radarTextGroup}>
          <Text style={styles.radarTitle}>Hyper-Local Economic Radius</Text>
          <Text style={styles.radarSubtitle}>
            Active cluster: <Text style={styles.radarHighlight}>{selectedCity}</Text> (5km – 25km radius)
          </Text>
        </View>
      </View>

      {/* Quick Detect Button */}
      <TouchableOpacity
        onPress={handleDetectLocation}
        activeOpacity={0.8}
        style={styles.detectButton}
        accessibilityRole="button"
        accessibilityLabel="Detect current location"
      >
        {detecting ? (
          <ActivityIndicator size="small" color="#2FD6FF" />
        ) : (
          <>
            <Navigation size={18} color="#2FD6FF" />
            <Text style={styles.detectButtonText}>Use Detected Location</Text>
          </>
        )}
      </TouchableOpacity>

      {detectedMessage ? (
        <View style={styles.detectedBanner}>
          <ShieldCheck size={14} color="#25E68A" />
          <Text style={styles.detectedText}>{detectedMessage}</Text>
        </View>
      ) : null}

      {/* Manual Search Bar */}
      <View style={styles.searchSection}>
        <Text style={styles.sectionHeader}>OR CHOOSE YOUR CITY MANUALLY</Text>
        <View style={styles.searchBar}>
          <Search size={18} color="#8FA0B5" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city or state..."
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Cities Grid / List */}
      <View style={styles.cityList}>
        {filteredCities.map((city) => {
          const isSelected = selectedCity.toLowerCase() === city.id.toLowerCase();

          return (
            <TouchableOpacity
              key={city.id}
              activeOpacity={0.85}
              onPress={() => setSelectedCity(city.id)}
              style={[
                styles.cityCard,
                isSelected && styles.cityCardSelected,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.cityInfo}>
                <View style={styles.cityNameRow}>
                  <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                    {city.name}
                  </Text>
                  {city.badge ? (
                    <View style={styles.hubBadge}>
                      <Text style={styles.hubBadgeText}>{city.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cityState}>{city.state}</Text>
              </View>

              <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                {isSelected && <Check size={14} color="#040814" strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredCities.length === 0 && (
          <View style={styles.emptySearch}>
            <Globe size={28} color="#8FA0B5" />
            <Text style={styles.emptyTitle}>City not listed yet?</Text>
            <Text style={styles.emptySubtitle}>
              ECOSPHERE is currently active in select Indian metros. Select the nearest city or Kolkata to explore opportunities.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedCity('Kolkata');
                setSearchQuery('');
              }}
              style={styles.selectHubButton}
            >
              <Text style={styles.selectHubText}>Select Kolkata (Hub)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </OnboardingContainer>
  );
};

const styles = StyleSheet.create({
  radarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 32, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  radarPulseOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(37, 230, 138, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarPulseInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(37, 230, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarTextGroup: {
    flex: 1,
  },
  radarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 2,
  },
  radarSubtitle: {
    fontSize: 12,
    color: '#8FA0B5',
    fontFamily: Theme.typography.fontFamily,
  },
  radarHighlight: {
    color: '#25E68A',
    fontWeight: '700',
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: 'rgba(47, 214, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.3)',
    borderRadius: 14,
    gap: 8,
    marginBottom: 14,
  },
  detectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2FD6FF',
    fontFamily: Theme.typography.fontFamily,
  },
  detectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 230, 138, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 16,
  },
  detectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#25E68A',
    fontFamily: Theme.typography.fontFamily,
  },
  searchSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA0B5',
    letterSpacing: 0.8,
    marginBottom: 8,
    fontFamily: Theme.typography.fontFamily,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 32, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Theme.typography.fontFamily,
    paddingVertical: 0,
  },
  cityList: {
    gap: 10,
    paddingBottom: 20,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(11, 19, 32, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cityCardSelected: {
    borderColor: '#25E68A',
    backgroundColor: 'rgba(37, 230, 138, 0.08)',
    shadowColor: '#25E68A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  cityInfo: {
    flex: 1,
  },
  cityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  cityNameSelected: {
    color: '#25E68A',
  },
  hubBadge: {
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.3)',
  },
  hubBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#25E68A',
    letterSpacing: 0.5,
  },
  cityState: {
    fontSize: 12,
    color: '#8FA0B5',
    fontFamily: Theme.typography.fontFamily,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    backgroundColor: '#25E68A',
    borderColor: '#25E68A',
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#8FA0B5',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    fontFamily: Theme.typography.fontFamily,
  },
  selectHubButton: {
    marginTop: 8,
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
    borderWidth: 1,
    borderColor: '#25E68A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  selectHubText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#25E68A',
    fontFamily: Theme.typography.fontFamily,
  },
});
