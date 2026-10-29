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
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react-native';
import { AdminReport } from '../../types';
import { GlassCard } from '../../components/cards/GlassCard';
import { mockAdminReports } from '../../data/mockData';
import { adminService } from '../../services/adminService';
import { Theme } from '../../theme';

export const AdminModerationScreen: React.FC = () => {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  React.useEffect(() => {
    // Fetch live audit records or set empty state
    adminService.getAuditLogs(10).then((logs: any[]) => {
      setLoading(false);
      if (logs && logs.length > 0) {
        setReports(
          logs.map((l: any) => ({
            id: l.id,
            targetId: l.entityId || l.id,
            targetType: 'Business' as const,
            targetTitle: `${l.moduleName} (${l.actionType})`,
            reason: `Action ${l.actionType} logged by Admin #${l.adminUserId}`,
            reportedBy: `System Audit`,
            status: 'Resolved' as const,
            date: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          }))
        );
      } else {
        setReports([]);
      }
    }).catch(() => {
      setLoading(false);
      setReports([]);
    });
  }, []);

  const handleResolve = async (id: string) => {
    await adminService.resolveReport(id);
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Resolved' } : r))
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topHeader}>
            <Text style={styles.pageTitle}>Platform Moderation Center</Text>
            <Text style={styles.pageSub}>Audit complaints, flagged posts, and job listings</Text>
          </View>

          <View style={styles.listContainer}>
            {reports.length === 0 ? (
              <GlassCard style={{ padding: 32, alignItems: 'center' }}>
                <CheckCircle2 size={40} color={Theme.colors.success} />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 12 }}>All Systems Healthy</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                  There are currently no flagged complaints or active reports requiring administrative moderation.
                </Text>
              </GlassCard>
            ) : (
              reports.map((rep) => (
                <GlassCard key={rep.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.typeBadge}>
                      <AlertTriangle size={12} color={Theme.colors.warning} />
                      <Text style={styles.typeText}>{rep.targetType} Flagged</Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            rep.status === 'Resolved'
                              ? 'rgba(37, 230, 138, 0.12)'
                              : 'rgba(245, 158, 11, 0.12)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: rep.status === 'Resolved' ? Theme.colors.success : Theme.colors.warning },
                        ]}
                      >
                        {rep.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.targetTitle}>{rep.targetTitle || rep.targetType}</Text>
                  <Text style={styles.reasonText}>{rep.reason}</Text>
                  <Text style={styles.reportedBy}>Source: {rep.reportedBy} ({rep.date})</Text>

                  {rep.status !== 'Resolved' && (
                    <View style={styles.cardFooter}>
                      <TouchableOpacity
                        onPress={() => handleResolve(rep.id)}
                        style={styles.resolveBtn}
                        activeOpacity={0.8}
                      >
                        <CheckCircle2 size={14} color={Theme.colors.success} />
                        <Text style={styles.resolveText}>Mark Resolved & Take Action</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </GlassCard>
              ))
            )}
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
  listContainer: {
    gap: 12,
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.warning,
    fontFamily: Theme.typography.fontFamily,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
  targetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  reasonText: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginBottom: 6,
    fontStyle: 'italic',
    fontFamily: Theme.typography.fontFamily,
  },
  reportedBy: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  cardFooter: {
    paddingTop: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  resolveText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.success,
    fontFamily: Theme.typography.fontFamily,
  },
});
