import { usePathname } from 'expo-router';
import Head from 'expo-router/head';
import { Platform } from 'react-native';

const pageTitles: Record<string, string> = {
  '/hoy': 'Hoy',
  '/bandeja': 'Bandeja',
  '/categorias': 'Categorías',
  '/pendientes': 'Pendientes',
  '/historial': 'Historial',
  '/ajustes': 'Ajustes',
  '/tareas/nueva': 'Nueva tarea',
  '/habitos/nuevo': 'Nuevo hábito',
  '/login': 'Entrar',
  '/catalog': 'Catálogo',
};

export function getPageTitle(pathname: string): string {
  const pageTitle = pageTitles[pathname];
  if (pageTitle !== undefined) {
    return `${pageTitle} · Desarrollo personal`;
  }
  if (pathname.startsWith('/tareas/')) {
    return 'Tarea · Desarrollo personal';
  }
  if (pathname.startsWith('/habitos/')) {
    return 'Hábito · Desarrollo personal';
  }
  if (pathname.startsWith('/categorias/')) {
    return 'Categoría · Desarrollo personal';
  }
  return 'Desarrollo personal';
}

export function PageMetadata() {
  const pathname = usePathname();
  if (Platform.OS !== 'web') {
    return null;
  }
  return (
    <Head>
      <title>{getPageTitle(pathname)}</title>
    </Head>
  );
}
