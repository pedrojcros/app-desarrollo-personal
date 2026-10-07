import { ScrollView, View } from 'react-native';

import { ThemeScope } from '@/theme/theme-scope';
import { themeNames } from '@/theme/tokens';

import { ThemePanel } from './theme-panel';

// Todos los componentes en los tres temas a la vez: un panel por tema, uno
// debajo de otro en el móvil y en columnas en pantallas anchas.
export default function CatalogScreen() {
  return (
    <ScrollView className="flex-1 bg-neutral-200" testID="catalog">
      <View className="flex-row flex-wrap gap-4 p-4">
        {themeNames.map((themeName) => (
          <View key={themeName} className="min-w-[320px] flex-1">
            <ThemeScope
              themeName={themeName}
              className="overflow-hidden bg-background"
            >
              <ThemePanel />
            </ThemeScope>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
