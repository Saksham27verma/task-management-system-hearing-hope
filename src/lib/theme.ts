import { createTheme, ThemeOptions, PaletteMode } from '@mui/material/styles';

// Brand colors from documentation
const ORANGE = '#EE6417';
const GREEN = '#3aa986';

// Common component overrides for both themes
const getCommonComponents = () => ({
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 16px',
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
});

// Common typography for both themes
const getCommonTypography = () => ({
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontWeight: 500,
  },
  h2: {
    fontWeight: 500,
  },
  h3: {
    fontWeight: 500,
  },
  h4: {
    fontWeight: 500,
  },
  h5: {
    fontWeight: 500,
  },
  h6: {
    fontWeight: 500,
  },
  button: {
    textTransform: 'none' as 'none',
    fontWeight: 500,
  },
});

// Light theme palette
const getLightPalette = () => ({
  mode: 'light' as PaletteMode,
  primary: {
    main: ORANGE,
    contrastText: '#fff',
  },
  secondary: {
    main: GREEN,
    contrastText: '#fff',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
  },
});

// Dark theme palette
const getDarkPalette = () => ({
  mode: 'dark' as PaletteMode,
  primary: {
    main: ORANGE,
    contrastText: '#fff',
  },
  secondary: {
    main: GREEN,
    contrastText: '#fff',
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e',
  },
  text: {
    primary: '#f5f5f5',
    secondary: '#b0b0b0',
  },
});

// Create theme based on mode
export const getTheme = (mode: PaletteMode) => {
  const themeOptions: ThemeOptions = {
    palette: mode === 'light' ? getLightPalette() : getDarkPalette(),
    typography: getCommonTypography(),
    components: getCommonComponents(),
  };

  return createTheme(themeOptions);
};

// Default theme (light)
const theme = getTheme('light');

export default theme; 