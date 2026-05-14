import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';
import { getFinancePalette } from '@/constants/finance-theme';
import { financeFonts } from '@/lib/finance-ui';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={20} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = getFinancePalette(colorScheme);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.mutedText,
        headerShown: false,
        headerStyle: {
          backgroundColor: palette.background,
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          color: palette.text,
          fontSize: 18,
          fontWeight: '700',
        },
        sceneStyle: {
          backgroundColor: palette.background,
        },
        tabBarStyle: {
          backgroundColor: palette.tabBar,
          borderTopColor: 'transparent',
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          height: 74,
          paddingTop: 10,
          paddingBottom: 10,
          borderRadius: 28,
          shadowColor: palette.shadow,
          shadowOffset: {
            width: 0,
            height: 12,
          },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: financeFonts.semibold,
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color }) => <TabBarIcon name="list-ul" color={color} />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Ngân sách',
          tabBarIcon: ({ color }) => <TabBarIcon name="pie-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color }) => <TabBarIcon name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}
