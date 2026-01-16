
# Mobile App Development Guide
## Android & iOS Apps with Existing Backend

## 🎯 Overview
Your FastAPI backend is already mobile-ready! This guide shows how to build Android and iOS apps that connect to your school ERP system.

## 📱 Technology Options

### Option 1: React Native (Recommended - Cross-Platform)
- **Pros**: One codebase for Android & iOS, JavaScript/TypeScript, faster development
- **Cons**: Performance slightly lower than native
- **Best for**: Rapid development, web developers

### Option 2: Flutter (Alternative Cross-Platform)
- **Pros**: Excellent performance, Dart language, beautiful UI
- **Cons**: Steeper learning curve
- **Best for**: High-performance apps

### Option 3: Native Development
- **Android**: Kotlin/Java + Retrofit/OkHttp
- **iOS**: Swift + URLSession/Alamofire
- **Pros**: Best performance, native feel
- **Cons**: Separate codebases, more expensive

## 🚀 Quick Start with React Native

### Prerequisites
```bash
# Install Node.js (14+)
# Install Android Studio (for Android emulator)
# Install Xcode (for iOS simulator - macOS only)

# Install React Native CLI
npm install -g @react-native-community/cli
```

### 1. Create React Native App
```bash
npx react-native@latest init SchoolApp
cd SchoolApp
```

### 2. Install Dependencies
```bash
npm install @react-navigation/native @react-navigation/stack
npm install @react-navigation/bottom-tabs @react-navigation/drawer
npm install axios react-native-vector-icons
npm install @react-native-async-storage/async-storage
npm install react-native-paper
npm install react-native-gesture-handler react-native-reanimated
```

### 3. Configure API Base URL
Create `src/config/api.js`:
```javascript
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:8000' // Android emulator
  : 'https://your-render-backend-url'; // Production

export default {
  BASE_URL: API_BASE_URL,
  endpoints: {
    login: '/auth/login',
    students: '/students',
    attendance: '/attendance',
    marks: '/marks',
    // Add all your API endpoints
  }
};
```

### 4. Authentication Service
Create `src/services/authService.js`:
```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiConfig from '../config/api';

const api = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: 10000,
});

export const authService = {
  async login(phone, password) {
    try {
      const response = await api.post(apiConfig.endpoints.login, {
        username: phone,
        password: password,
      });

      const { access_token, user } = response.data;

      // Store token
      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Set authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  },

  async logout() {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  },

  async getCurrentUser() {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  async getToken() {
    return await AsyncStorage.getItem('access_token');
  }
};

export default api;
```

### 5. Login Screen
Create `src/screens/LoginScreen.js`:
```javascript
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet
} from 'react-native';
import { authService } from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter both phone and password');
      return;
    }

    setLoading(true);
    const result = await authService.login(phone, password);
    setLoading(false);

    if (result.success) {
      // Navigate to main app
      navigation.replace('Main');
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>School ERP</Text>

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: 'white',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
```

### 6. Dashboard Screen
Create `src/screens/DashboardScreen.js`:
```javascript
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl
} from 'react-native';
import api, { authService } from '../services/authService';
import apiConfig from '../config/api';

const DashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);

    // Load dashboard data based on user role
    try {
      let endpoint = '';
      switch (currentUser.role) {
        case 'STUDENT':
          endpoint = '/students/me/dashboard';
          break;
        case 'TEACHER':
          endpoint = '/teachers/me/dashboard';
          break;
        case 'PARENT':
          endpoint = '/parents/me/dashboard';
          break;
        case 'ADMIN':
          endpoint = '/admin/dashboard';
          break;
      }

      if (endpoint) {
        const response = await api.get(endpoint);
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const menuItems = [
    { title: 'Attendance', screen: 'Attendance', icon: '📊' },
    { title: 'Marks', screen: 'Marks', icon: '📝' },
    { title: 'Timetable', screen: 'Timetable', icon: '📅' },
    { title: 'Fees', screen: 'Fees', icon: '💰' },
    { title: 'Notifications', screen: 'Notifications', icon: '🔔' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {user?.name}</Text>
        <Text style={styles.role}>{user?.role}</Text>
      </View>

      <View style={styles.statsContainer}>
        {/* Add stats cards based on user role */}
        {user?.role === 'STUDENT' && (
          <>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.attendance || 0}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.averageMarks || 0}</Text>
              <Text style={styles.statLabel}>Avg Marks</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await authService.logout();
          navigation.replace('Login');
        }}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    paddingTop: 40,
  },
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  role: {
    fontSize: 14,
    color: '#e3f2fd',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-around',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  menuContainer: {
    padding: 15,
  },
  menuItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
```

### 7. App Navigation
Create `App.js`:
```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
// Add other screens as needed

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007bff',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => '🏠',
        }}
      />
      {/* Add more tabs */}
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
```

### 8. Run the App
```bash
# For Android
npx react-native run-android

# For iOS (macOS only)
npx react-native run-ios
```

## 🔧 Backend Considerations for Mobile

### 1. CORS Configuration
Update `backend/app/main.py` for mobile apps:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Web
        "exp://*",               # Expo development
        "http://10.0.2.2:8000",  # Android emulator
        "http://192.168.1.*",    # Local network
        "https://yourdomain.com" # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Mobile-Specific Endpoints
Consider adding mobile-optimized endpoints:
- `/api/v1/mobile/dashboard` - Mobile dashboard data
- `/api/v1/mobile/offline/sync` - Data sync for offline use

### 3. Push Notifications
Add push notification support:
```python
# Install: pip install firebase-admin
from firebase_admin import messaging

def send_push_notification(token, title, body):
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        token=token,
    )
    messaging.send(message)
```

## 📱 Testing & Deployment

### Local Testing
```bash
# Start backend
cd backend
python start_server.py

# Start React Native app
cd mobile-app
npx react-native run-android
```

### Production Deployment
1. **Backend**: Already deployed on Render
2. **Mobile App**:
   - **Android**: Build APK and upload to Google Play
   - **iOS**: Build IPA and upload to App Store
   - **Expo**: Use EAS Build for easier deployment

### Build Commands
```bash
# Android APK
npx react-native build-android --mode=release

# iOS (macOS)
npx react-native build-ios --mode=release
```

## 🎯 Key Features to Implement

### Phase 1 (MVP)
- [ ] User authentication
- [ ] Dashboard with key metrics
- [ ] Profile viewing
- [ ] Basic notifications

### Phase 2
- [ ] Offline data sync
- [ ] Push notifications
- [ ] File uploads (assignments, photos)
- [ ] Real-time messaging

### Phase 3
- [ ] Advanced features (calendar, detailed reports)
- [ ] Biometric authentication
- [ ] QR code scanning (attendance)

## 💰 Development Cost Estimate

- **React Native Developer**: $20-50/hour
- **UI/UX Design**: $500-2000
- **App Store Fees**: $99/year (Apple), $25 one-time (Google)
- **Push Notifications**: Free tier available
- **Total MVP**: $2000-5000

## 📞 Next Steps

1. **Choose Framework**: React Native recommended
2. **Design Mockups**: Plan your mobile UI
3. **API Integration**: Connect to your existing backend
4. **Testing**: Test on real devices
5. **Deployment**: Submit to app stores

Would you like me to help you set up a specific mobile feature or create more detailed code for any particular screen?
