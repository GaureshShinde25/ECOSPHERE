import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Users, Search, ShieldCheck, UserCheck, ShieldAlert, Check, X, Store, RefreshCw, Trash2, AlertTriangle } from 'lucide-react-native';
import { User, UserRole } from '../../types';
import { GlassCard } from '../../components/cards/GlassCard';
import { adminService } from '../../services/adminService';
import { Theme } from '../../theme';

export const AdminUserManagementScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'seller_requests'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [sellerRequests, setSellerRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data || []);
    } catch (err: any) {
      if (__DEV__) console.warn('[AdminUserManagement] Error loading users:', err);
    }
  };

  const fetchSellerRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await adminService.getSellerAccessRequests();
      setSellerRequests(data || []);
    } catch (err: any) {
      if (__DEV__) console.warn('[AdminUserManagement] Error loading seller requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSellerRequests();
  }, []);

  const toggleUserStatus = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.status === 'deleted') {
      Alert.alert('Not Allowed', 'Cannot modify status of a deleted account.');
      return;
    }
    const newIsActive = target.status !== 'active';
    try {
      const success = await adminService.updateUserStatus(userId, newIsActive);
      if (success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newIsActive ? 'active' : 'suspended' } : u))
        );
        fetchUsers();
      } else {
        Alert.alert('Error', 'Unable to update user status.');
      }
    } catch (err: any) {
      Alert.alert('Status Update Error', err.message || 'Failed to update user status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await adminService.deleteUserAccount(userToDelete.id);
      const deletedId = userToDelete.id;
      setUserToDelete(null);
      // Update deleted user in state immediately as deleted
      setUsers((prev) => prev.map((u) => (u.id === deletedId ? { ...u, status: 'deleted' } : u)));
      // Re-fetch user list from backend
      fetchUsers();
      Alert.alert('Success', res.message || 'Account deleted successfully.');
    } catch (err: any) {
      const errorMsg = err.message || 'Unable to delete account. Please try again.';
      Alert.alert('Deletion Failed', errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await adminService.approveSellerRequest(requestId);
      Alert.alert('Approved', 'Seller capability has been granted to the user.');
      fetchSellerRequests();
      fetchUsers();
    } catch (err: any) {
      Alert.alert('Approval Error', err.message || 'Failed to approve request.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await adminService.rejectSellerRequest(requestId, 'Rejected by Administrator review');
      Alert.alert('Rejected', 'Seller request has been rejected.');
      fetchSellerRequests();
    } catch (err: any) {
      Alert.alert('Rejection Error', err.message || 'Failed to reject request.');
    }
  };

  const handleRevokeSellerAccess = async (userId: string) => {
    try {
      await adminService.revokeSellerAccess(userId);
      Alert.alert('Revoked', 'Seller capability has been revoked.');
      fetchSellerRequests();
      fetchUsers();
    } catch (err: any) {
      Alert.alert('Revocation Error', err.message || 'Failed to revoke seller access.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const filteredRequests = sellerRequests.filter((r) => {
    const nameMatch = (r.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || (r.mobileNumber || '').includes(searchQuery);
    const statusMatch = requestStatusFilter === 'all' || r.status === requestStatusFilter;
    return nameMatch && statusMatch;
  });

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topHeader}>
            <Text style={styles.pageTitle}>User & Seller Management</Text>
            <Text style={styles.pageSub}>Monitor platform users, roles, and review seller access requests</Text>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'users' && styles.tabItemActive]}
              onPress={() => setActiveTab('users')}
              activeOpacity={0.8}
            >
              <Users size={16} color={activeTab === 'users' ? '#07111F' : '#94A3B8'} style={{ marginRight: 6 }} />
              <Text style={[styles.tabItemText, activeTab === 'users' && styles.tabItemTextActive]}>
                Users ({users.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'seller_requests' && styles.tabItemActive]}
              onPress={() => {
                setActiveTab('seller_requests');
                fetchSellerRequests();
              }}
              activeOpacity={0.8}
            >
              <Store size={16} color={activeTab === 'seller_requests' ? '#07111F' : '#94A3B8'} style={{ marginRight: 6 }} />
              <Text style={[styles.tabItemText, activeTab === 'seller_requests' && styles.tabItemTextActive]}>
                Seller Access Requests ({sellerRequests.filter((r) => r.status === 'PENDING').length} Pending)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Search size={18} color={Theme.colors.secondaryText} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'users' ? 'Search user by name or email...' : 'Search applicant name or mobile...'}
              placeholderTextColor={Theme.colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {activeTab === 'users' ? (
            <>
              {/* Role Filter Chips */}
              <View style={styles.filterRow}>
                {(['all', 'customer', 'seller', 'administrator'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
                    onPress={() => setRoleFilter(r)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterText, roleFilter === r && styles.filterTextActive]}>
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Users List */}
              <View style={styles.usersList}>
                {filteredUsers.map((u) => (
                  <GlassCard key={u.id} style={styles.userCard}>
                    <View style={styles.userRow}>
                      <View style={styles.userAvatarCircle}>
                        <Text style={styles.avatarInitial}>{u.name.charAt(0)}</Text>
                      </View>

                      <View style={styles.userInfo}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.userName}>{u.name}</Text>
                          {u.verified && <ShieldCheck size={14} color={Theme.colors.success} />}
                        </View>
                        <Text style={styles.userEmail}>{u.email}</Text>
                        <Text style={styles.userPhone}>
                          Phone: {u.phone ? (u.phone.startsWith('+91') ? u.phone : `+91 ${u.phone}`) : 'Not registered'}
                        </Text>
                        <Text style={styles.userRoleTag}>ID: #{u.id} • Role: {u.role} • Joined {u.createdAt}</Text>
                      </View>

                      <View style={styles.statusCol}>
                        <View
                          style={[
                            styles.statusPill,
                            {
                              backgroundColor:
                                u.status === 'active'
                                  ? 'rgba(37, 230, 138, 0.12)'
                                  : u.status === 'deleted'
                                  ? 'rgba(239, 68, 68, 0.18)'
                                  : 'rgba(245, 158, 11, 0.15)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color:
                                  u.status === 'active'
                                    ? Theme.colors.success
                                    : u.status === 'deleted'
                                    ? '#EF4444'
                                    : '#F59E0B',
                              },
                            ]}
                          >
                            {u.status.toUpperCase()}
                          </Text>
                        </View>

                        {u.status !== 'deleted' && (
                          <>
                            <TouchableOpacity
                              onPress={() => toggleUserStatus(u.id)}
                              style={styles.actionBtn}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.actionBtnText}>
                                {u.status === 'active' ? 'Suspend' : 'Activate'}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => setUserToDelete(u)}
                              style={styles.deleteBtn}
                              activeOpacity={0.7}
                            >
                              <Trash2 size={11} color="#EF4444" style={{ marginRight: 3 }} />
                              <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  </GlassCard>
                ))}
              </View>
            </>
          ) : (
            <>
              {/* Status Filter Chips for Seller Requests */}
              <View style={styles.filterRow}>
                {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.filterChip, requestStatusFilter === s && styles.filterChipActive]}
                    onPress={() => setRequestStatusFilter(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterText, requestStatusFilter === s && styles.filterTextActive]}>
                      {s.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {loadingRequests ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={Theme.colors.primary} />
                </View>
              ) : filteredRequests.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#94A3B8', fontSize: 14 }}>No seller access requests found.</Text>
                </View>
              ) : (
                <View style={styles.usersList}>
                  {filteredRequests.map((r) => (
                    <GlassCard key={r.requestId} style={styles.userCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.userName}>{r.userName || `User #${r.userId}`}</Text>
                            <View
                              style={[
                                styles.statusPill,
                                {
                                  backgroundColor:
                                    r.status === 'APPROVED'
                                      ? 'rgba(37, 230, 138, 0.15)'
                                      : r.status === 'PENDING'
                                      ? 'rgba(245, 158, 11, 0.15)'
                                      : 'rgba(239, 68, 68, 0.15)',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  {
                                    color:
                                      r.status === 'APPROVED'
                                        ? Theme.colors.success
                                        : r.status === 'PENDING'
                                        ? '#F59E0B'
                                        : Theme.colors.danger,
                                  },
                                ]}
                              >
                                {r.status}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.userEmail}>
                            {r.mobileNumber ? `Phone: ${r.mobileNumber}` : ''} {r.email ? `• ${r.email}` : ''}
                          </Text>
                          {r.notes ? (
                            <Text style={{ color: '#CBD5E1', fontSize: 13, marginTop: 6, fontStyle: 'italic' }}>
                              "{r.notes}"
                            </Text>
                          ) : null}
                          <Text style={{ color: '#64748B', fontSize: 11, marginTop: 4 }}>
                            Submitted: {new Date(r.submittedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      {/* Action buttons */}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                        {r.status === 'PENDING' ? (
                          <>
                            <TouchableOpacity
                              style={[styles.reqBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}
                              onPress={() => handleRejectRequest(r.requestId)}
                              activeOpacity={0.75}
                            >
                              <X size={14} color="#EF4444" style={{ marginRight: 4 }} />
                              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Reject</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.reqBtn, { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary }]}
                              onPress={() => handleApproveRequest(r.requestId)}
                              activeOpacity={0.75}
                            >
                              <Check size={14} color="#07111F" style={{ marginRight: 4 }} />
                              <Text style={{ color: '#07111F', fontSize: 12, fontWeight: '800' }}>Approve</Text>
                            </TouchableOpacity>
                          </>
                        ) : r.status === 'APPROVED' ? (
                          <TouchableOpacity
                            style={[styles.reqBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                            onPress={() => handleRevokeSellerAccess(r.userId)}
                            activeOpacity={0.75}
                          >
                            <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '600' }}>Revoke Seller Access</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </GlassCard>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Delete User Confirmation Modal */}
      <Modal
        visible={Boolean(userToDelete)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isDeleting) setUserToDelete(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <AlertTriangle size={22} color="#EF4444" />
              </View>
              <Text style={styles.modalTitle}>DELETE ACCOUNT?</Text>
            </View>

            <Text style={styles.modalPrompt}>
              Are you sure you want to permanently delete:
            </Text>

            {userToDelete && (
              <View style={styles.modalUserBox}>
                <Text style={styles.modalUserName}>{userToDelete.name}</Text>
                <Text style={styles.modalUserEmail}>{userToDelete.email}</Text>
                <Text style={styles.modalUserPhone}>
                  {userToDelete.phone
                    ? (userToDelete.phone.startsWith('+91') ? userToDelete.phone : `+91 ${userToDelete.phone}`)
                    : 'No registered phone'}
                </Text>
                <Text style={styles.modalUserRole}>
                  Role: {userToDelete.role}
                </Text>
              </View>
            )}

            <View style={styles.modalWarningBox}>
              <Text style={styles.modalWarningText}>
                This action cannot be undone.
              </Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setUserToDelete(null)}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalDeleteBtn, isDeleting && { opacity: 0.7 }]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Trash2 size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.modalDeleteText}>Delete Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 24, 40, 0.8)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: Theme.colors.primary,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  tabItemTextActive: {
    color: '#07111F',
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(13, 24, 40, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Theme.typography.fontFamily,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
  },
  filterText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  filterTextActive: {
    color: '#07111F',
    fontWeight: '800',
  },
  usersList: {
    gap: 10,
  },
  userCard: {
    padding: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(47, 214, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  userEmail: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  userRoleTag: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  statusCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  userPhone: {
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 2,
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: Theme.typography.fontFamily,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0D1828',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: Theme.typography.fontFamily,
  },
  modalPrompt: {
    fontSize: 13,
    color: '#CBD5E1',
    marginBottom: 12,
    fontFamily: Theme.typography.fontFamily,
  },
  modalUserBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 3,
  },
  modalUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  modalUserEmail: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  modalUserPhone: {
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  modalUserRole: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
    textTransform: 'capitalize',
    fontFamily: Theme.typography.fontFamily,
  },
  modalWarningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  modalWarningText: {
    fontSize: 12,
    color: '#F87171',
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalCancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
    fontFamily: Theme.typography.fontFamily,
  },
  modalDeleteBtn: {
    backgroundColor: '#EF4444',
  },
  modalDeleteText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
});
