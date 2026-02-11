import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box, CircularProgress, Alert } from '@mui/material';
import SearchForm from './components/SearchForm';
import HotelList from './components/HotelList';
import HotelDetails from './components/HotelDetails';
import Checkout from './components/Checkout';
import BookingConfirmation from './components/BookingConfirmation';
import { api } from './services/api';

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
      // The API returns { data: [...rates], hotels: [...details] }
      const rates = data.data || [];
      const hotelDetails = data.hotels || [];

      const merged = rates.map((rateGroup: any) => {
        const details = hotelDetails.find((h: any) => h.id === rateGroup.hotelId) || {};

        // Find min price for display
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <SearchForm onSearch={handleSearch} isLoading={isLoading} />

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <HotelList hotels={hotels} searchParams={currentParams} />
      )}
    </Container>
  );
};

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Travel Booker
          </Typography>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/hotel/:id" element={<HotelDetails />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirmation" element={<BookingConfirmation />} />
      </Routes>
    </Router>
  );
}

export default App;
