import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { Wallet, ArrowDownRight, ArrowUpRight, DollarSign, CreditCard } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/cards/GlassCard';
import { Modal } from '../../components/common/Modal';
import { paymentService } from '../../services/paymentService';
import { Payment } from '../../types';
import { Theme } from '../../theme';

export const SellerEarningsScreen: React.FC = () => {
  const [balance, setBalance] = useState(142800);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [livePayments, setLivePayments] = useState<Payment[]>([]);

  React.useEffect(() => {
    paymentService.getSellerPayments().then((data) => {
      if (data && data.length > 0) {
        setLivePayments(data);
      }
    });
  }, []);

  const transactions = [
    { id: 'tx_01', type: 'Payout', title: 'Order #ORD_301 Settlement', amount: '+₹12,450', date: 'Today, 2:40 PM', isIncome: true },
    { id: 'tx_02', type: 'Payout', title: 'Service #BK_201 Settlement', amount: '+₹1,499', date: 'Yesterday', isIncome: true },
    { id: 'tx_03', type: 'Withdrawal', title: 'Bank Transfer to HDFC ****4129', amount: '-₹25,000', date: '22 Aug 2026', isIncome: false },
  ];

  const handleWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (amt > 0 && amt <= balance) {
      setBalance(balance - amt);
      setWithdrawSuccess(true);
      setTimeout(() => {
        setWithdrawSuccess(false);
        setWithdrawModal(false);
        setWithdrawAmount('');
      }, 1200);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topHeader}>
            <Text style={styles.pageTitle}>Seller Financial Command</Text>
            <Text style={styles.pageSub}>Balance, revenue settlements, and payouts</Text>
          </View>

          {/* Balance Hero Card */}
          <GlassCard style={styles.balanceCard}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.15)', 'rgba(20, 184, 166, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.balanceTop}>
              <View style={styles.walletIconCircle}>
                <Wallet size={24} color={Theme.colors.primary} />
              </View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
            </View>

            <Text style={styles.balanceValue}>₹{balance.toLocaleString()}</Text>

            <View style={styles.balanceActions}>
              <TouchableOpacity
                style={styles.withdrawBtn}
                activeOpacity={0.85}
                onPress={() => setWithdrawModal(true)}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.withdrawGradient}
                >
                  <ArrowDownRight size={16} color="#FFFFFF" />
                  <Text style={styles.withdrawText}>Withdraw Funds</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Breakdown stats */}
          <View style={styles.statsRow}>
            <GlassCard style={styles.statBox}>
              <Text style={styles.statVal}>₹28,450</Text>
              <Text style={styles.statLbl}>Today's Earnings</Text>
            </GlassCard>

            <GlassCard style={styles.statBox}>
              <Text style={styles.statVal}>₹3,84,000</Text>
              <Text style={styles.statLbl}>Monthly Revenue</Text>
            </GlassCard>

            <GlassCard style={styles.statBox}>
              <Text style={styles.statVal}>₹4,250</Text>
              <Text style={styles.statLbl}>Pending Clearances</Text>
            </GlassCard>
          </View>

          {/* Transactions Log */}
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.txList}>
            {transactions.map((tx) => (
              <GlassCard key={tx.id} style={styles.txCard}>
                <View style={styles.txRow}>
                  <View
                    style={[
                      styles.txIconCircle,
                      { backgroundColor: tx.isIncome ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' },
                    ]}
                  >
                    {tx.isIncome ? (
                      <ArrowDownRight size={18} color={Theme.colors.primary} />
                    ) : (
                      <ArrowUpRight size={18} color={Theme.colors.danger} />
                    )}
                  </View>

                  <View style={styles.txDetails}>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>

                  <Text style={[styles.txAmount, { color: tx.isIncome ? Theme.colors.primary : '#FFFFFF' }]}>
                    {tx.amount}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        </ScrollView>

        {/* Modal */}
        <Modal
          visible={withdrawModal}
          title="Withdraw Funds to Bank"
          onClose={() => setWithdrawModal(false)}
        >
          {withdrawSuccess ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Withdrawal Initiated!</Text>
              <Text style={styles.successSub}>Funds will arrive in your bank account within 24 hours.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Available: ₹{balance.toLocaleString()}</Text>
              <Text style={styles.label}>Enter Withdrawal Amount (₹)</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="e.g. 10000"
                placeholderTextColor={Theme.colors.secondaryText}
              />

              <TouchableOpacity onPress={handleWithdraw} style={styles.confirmBtn} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmGradient}
                >
                  <Text style={styles.confirmText}>Confirm Withdrawal</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </Modal>
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
    paddingBottom: 110,
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
  balanceCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 20,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  walletIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 16,
  },
  balanceActions: {
    flexDirection: 'row',
  },
  withdrawBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
  },
  withdrawGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  withdrawText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  statLbl: {
    fontSize: 10,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 12,
  },
  txList: {
    gap: 10,
  },
  txCard: {
    padding: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  txDate: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 16,
  },
  confirmBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
  },
  confirmGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    color: '#07111F',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.success,
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  successSub: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily,
  },
});
