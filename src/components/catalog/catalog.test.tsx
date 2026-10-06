import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { themeLabels, themeNames } from '@/theme/tokens';

import CatalogScreen from './catalog-screen';

describe('CatalogScreen', () => {
  it('renders the catalog in the three themes at once', () => {
    render(<CatalogScreen />);

    for (const themeName of themeNames) {
      const panel = screen.getByTestId(`catalog-panel-${themeName}`);
      expect(panel).toBeTruthy();
      expect(
        screen.getAllByText(themeLabels[themeName]).length,
      ).toBeGreaterThan(0);
    }
  });

  it('shows every component in each theme', () => {
    render(<CatalogScreen />);
    const themeCount = themeNames.length;

    expect(screen.getAllByText('Guardar')).toHaveLength(themeCount * 3);
    expect(screen.getAllByText('Comprar proteína')).toHaveLength(themeCount);
    expect(screen.getAllByText('Deshacer')).toHaveLength(themeCount * 2);
    expect(screen.getAllByLabelText('Nombre')).toHaveLength(themeCount);
    expect(screen.getAllByLabelText('Tema de la aplicación')).toHaveLength(
      themeCount,
    );
  });
});
