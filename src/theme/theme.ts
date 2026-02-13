import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8F3DD0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#E8DEF8',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f6f8',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
        containedPrimary: {
          backgroundColor: '#8F3DD0',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#7529B1',
          },
        },
        containedSecondary: {
          backgroundColor: '#E8DEF8',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#DCCCF5',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)', // Material 3 Elevation 1
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
  },
});

export default theme;
