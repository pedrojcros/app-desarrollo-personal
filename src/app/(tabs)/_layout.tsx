import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="hoy" screenOptions={{ tabBarIcon: () => null }}>
      <Tabs.Screen name="hoy" options={{ title: 'Hoy' }} />
      <Tabs.Screen name="bandeja" options={{ title: 'Bandeja' }} />
      <Tabs.Screen name="categorias" options={{ title: 'Categorías' }} />
      <Tabs.Screen name="pendientes" options={{ title: 'Pendientes' }} />
      <Tabs.Screen name="historial" options={{ title: 'Historial' }} />
    </Tabs>
  );
}
