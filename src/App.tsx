import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { Box, Typography, Container } from '@mui/material';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h1" component="h1" gutterBottom>
            Travel Booking App
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Milestone 1: Environment Setup Complete
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
