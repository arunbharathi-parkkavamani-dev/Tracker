import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Card, Title, Paragraph, ActivityIndicator } from "react-native-paper";
import { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import * as MD from "@expo/vector-icons/MaterialIcons";

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingLeaves: number;
  activeTasks: number;
  completedTasks: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [employeesRes, leavesRes, tasksRes] = await Promise.all([
        axiosInstance.get('/populate/read/employees?fields=basicInfo.firstName'),
        axiosInstance.get('/populate/read/leaves?filter={"status":"Pending"}'),
        axiosInstance.get('/populate/read/tasks?filter={"status":"Active"}')
      ]);

      const totalEmployees = employeesRes.data?.data?.length || 0;
      const pendingLeaves = leavesRes.data?.data?.length || 0;
      const activeTasks = tasksRes.data?.data?.length || 0;

      setStats({
        totalEmployees,
        presentToday: Math.floor(totalEmployees * 0.85), // Mock data
        onLeave: Math.floor(totalEmployees * 0.1),
        pendingLeaves,
        activeTasks,
        completedTasks: Math.floor(activeTasks * 1.5) // Mock data
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  const getIconText = (iconName: string) => {
    switch (iconName) {
      case 'People': return '👥';
      case 'CheckCircle': return '✅';
      case 'EventBusy': return '📅';
      case 'Pending': return '⏳';
      case 'Assignment': return '📋';
      case 'TaskAlt': return '✔️';
      default: return 'ℹ️';
    }
  };

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => (
    <Card style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={{ fontSize: 24 }}>{getIconText(icon)}</Text>
          <Title style={[styles.statValue, { color }]}>{value}</Title>
        </View>
        <Paragraph style={styles.statTitle}>{title}</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Title style={styles.welcomeTitle}>Welcome to HR Tracker</Title>
        <Paragraph style={styles.subtitle}>Dashboard Overview</Paragraph>
      </View>

      <View style={styles.statsGrid}>
        <StatCard 
          title="Total Employees" 
          value={stats?.totalEmployees || 0} 
          icon="People" 
          color="#2196F3" 
        />
        <StatCard 
          title="Present Today" 
          value={stats?.presentToday || 0} 
          icon="CheckCircle" 
          color="#4CAF50" 
        />
        <StatCard 
          title="On Leave" 
          value={stats?.onLeave || 0} 
          icon="EventBusy" 
          color="#FF9800" 
        />
        <StatCard 
          title="Pending Leaves" 
          value={stats?.pendingLeaves || 0} 
          icon="Pending" 
          color="#F44336" 
        />
        <StatCard 
          title="Active Tasks" 
          value={stats?.activeTasks || 0} 
          icon="Assignment" 
          color="#9C27B0" 
        />
        <StatCard 
          title="Completed Tasks" 
          value={stats?.completedTasks || 0} 
          icon="TaskAlt" 
          color="#00BCD4" 
        />
      </View>

      <Card style={styles.quickActionsCard}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <View style={styles.quickActions}>
            <Text style={styles.quickActionText}>• Check Attendance</Text>
            <Text style={styles.quickActionText}>• Submit Leave Request</Text>
            <Text style={styles.quickActionText}>• View Tasks</Text>
            <Text style={styles.quickActionText}>• Update Daily Activity</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsGrid: {
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 15,
    elevation: 3,
  },
  cardContent: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  quickActionsCard: {
    margin: 10,
    marginTop: 0,
  },
  quickActions: {
    marginTop: 10,
  },
  quickActionText: {
    fontSize: 16,
    marginVertical: 5,
    color: '#333',
  },
});
