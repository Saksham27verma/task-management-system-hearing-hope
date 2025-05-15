import { createTheme, ThemeOptions, PaletteMode } from '@mui/material/styles';

// Brand colors from documentation
const ORANGE = '#F26722';
const LIGHT_ORANGE = '#FFF1E8';
const TEAL = '#19ac8b';
const LIGHT_TEAL = '#e6f7f4';

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
      containedSecondary: {
        '&:hover': {
          backgroundColor: '#17977a', // Slightly darker teal for hover
        },
      },
      outlinedSecondary: {
        borderColor: TEAL,
        color: TEAL,
        '&:hover': {
          backgroundColor: LIGHT_TEAL,
          borderColor: TEAL,
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
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: ORANGE,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: ORANGE,
        },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        '&.Mui-focused': {
          color: ORANGE,
        },
      },
    },
  },
  MuiCheckbox: {
    styleOverrides: {
      root: {
        '&.Mui-checked': {
          color: TEAL,
        },
      },
    },
  },
  MuiRadio: {
    styleOverrides: {
      root: {
        '&.Mui-checked': {
          color: TEAL,
        },
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      switchBase: {
        '&.Mui-checked': {
          color: TEAL,
          '& + .MuiSwitch-track': {
            backgroundColor: TEAL,
          },
        },
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        '&.Mui-selected': {
          color: ORANGE,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      colorPrimary: {
        backgroundColor: ORANGE,
      },
      colorSecondary: {
        backgroundColor: TEAL,
      },
      outlinedSecondary: {
        borderColor: TEAL,
        color: TEAL,
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        color: '#444',
        fontWeight: 600,
      },
    },
  },
  MuiCircularProgress: {
    styleOverrides: {
      colorSecondary: {
        color: TEAL,
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      colorSecondary: {
        backgroundColor: LIGHT_TEAL,
        '& .MuiLinearProgress-bar': {
          backgroundColor: TEAL,
        },
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
    light: '#ff8a50',
    dark: '#c53301',
    contrastText: '#fff',
  },
  secondary: {
    main: TEAL,
    light: '#4adcbe',
    dark: '#107c5f',
    contrastText: '#fff',
  },
  success: {
    main: TEAL,
    light: '#4adcbe',
    dark: '#107c5f',
  },
  background: {
    default: '#f9f9f9',
    paper: '#ffffff',
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
  },
  action: {
    hover: 'rgba(242, 103, 34, 0.08)',
    selected: 'rgba(242, 103, 34, 0.12)',
    activeOpacity: 0.12,
    hoverOpacity: 0.04,
  },
  divider: 'rgba(0, 0, 0, 0.08)',
});

// Dark theme palette
const getDarkPalette = () => ({
  mode: 'dark' as PaletteMode,
  primary: {
    main: ORANGE,
    light: '#ff8a50',
    dark: '#c53301',
    contrastText: '#fff',
  },
  secondary: {
    main: TEAL,
    light: '#4adcbe',
    dark: '#107c5f',
    contrastText: '#fff',
  },
  success: {
    main: TEAL,
    light: '#4adcbe',
    dark: '#107c5f',
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e',
  },
  text: {
    primary: '#f5f5f5',
    secondary: '#b0b0b0',
  },
  action: {
    hover: 'rgba(242, 103, 34, 0.16)',
    selected: 'rgba(242, 103, 34, 0.24)',
    activeOpacity: 0.24,
    hoverOpacity: 0.12,
  },
  divider: 'rgba(255, 255, 255, 0.08)',
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