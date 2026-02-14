import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box, CircularProgress, Alert } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LanguageIcon from '@mui/icons-material/Language';
import SearchForm from './components/SearchForm';
import HotelList from './components/HotelList';
import HotelDetails from './components/HotelDetails';
import Checkout from './components/Checkout';
import BookingConfirmation from './components/BookingConfirmation';
import { api } from './services/api';
import travelBackground from './assets/travel-background.png';
import nomadistLogo from './assets/Nomadist-logo.svg';

// Wrapper component to use useNavigate
const SearchPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState<any>(null);

  const handleSearch = async (params: any) => {
    setIsLoading(true);
    setError(null);
    setCurrentParams(params);
    try {
      const data = await api.searchHotels(params);

      // Merge rates with hotel data if available
      const rates = data.data || [];
      const hotelDetails = data.hotels || [];

      const merged = rates.map((rateGroup: any) => {
        const details = hotelDetails.find((h: any) => h.id === rateGroup.hotelId) || {};

        let minPrice = Infinity;
        rateGroup.roomTypes.forEach((rt: any) => {
          rt.rates.forEach((r: any) => {
            if (r.retailRate.total[0].amount < minPrice) {
              minPrice = r.retailRate.total[0].amount;
            }
          });
        });

        return {
          ...rateGroup,
          ...details,
          minPrice: minPrice === Infinity ? null : minPrice,
          currency: rateGroup.roomTypes[0]?.rates[0]?.retailRate.total[0].currency
        };
      });

      setHotels(merged);
    } catch (err: any) {
      setError(err.message || "Failed to search hotels");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Hero Section */}
      <Box
        sx={{
          width: '100%',
          height: { xs: 'auto', md: '400px' },
          backgroundImage: { xs: 'none', md: `url(${travelBackground})` },
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
          pt: { xs: '120px', md: 0 }
        }}
      >
        <Container sx={{ maxWidth: '1150px !important' }}>
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        </Container>
      </Box>

      {/* Results Section */}
      <Container maxWidth="lg">
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <HotelList
            hotels={hotels}
            searchParams={currentParams}
            hasSearched={currentParams !== null}
          />
        )}
      </Container>
    </Box>
  );
};

function App() {
  return (
    <Router>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between', position: 'relative' }}>
          {/* Far Left: Logo */}
          <Box component="img" src={nomadistLogo} sx={{ height: 40, width: 'auto' }} alt="Nomadist Logo" />

          {/* Center: Brand Name */}
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontFamily: "'Sanchez', serif",
              fontSize: '32px',
              color: 'white',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none'
            }}
          >
            Nomadist
          </Typography>

          {/* Far Right: Icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <LanguageIcon sx={{ color: 'white' }} />
            <AccountCircleIcon sx={{ color: 'white' }} />
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ py: 0 }}>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route
            path="/hotel/:id"
            element={<Container maxWidth="lg" sx={{ py: 4 }}><HotelDetails /></Container>}
          />
          <Route
            path="/checkout"
            element={<Container maxWidth="lg" sx={{ py: 4 }}><Checkout /></Container>}
          />
          <Route
            path="/confirmation"
            element={<Container maxWidth="lg" sx={{ py: 4 }}><BookingConfirmation /></Container>}
          />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;
