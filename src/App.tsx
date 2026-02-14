import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box, CircularProgress, Alert, FormControl, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LanguageIcon from '@mui/icons-material/Language';
import SearchForm from './components/SearchForm';
import HotelList from './components/HotelList';
import HotelDetails from './components/HotelDetails';
import Checkout from './components/Checkout';
import BookingConfirmation from './components/BookingConfirmation';
import { api } from './services/api';
import travelBackground from './assets/travel-background.jpg';
import nomadistLogo from './assets/Nomadist-logo.svg';

// SearchPage component now accepts props for lifted state
interface SearchPageProps {
  isLoading: boolean;
  hotels: any[];
  error: string | null;
  currentParams: any;
  onSearch: (params: any) => Promise<void>;
  sortOption: string;
  onSortChange: (event: SelectChangeEvent) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({
  isLoading,
  hotels,
  error,
  currentParams,
  onSearch,
  sortOption,
  onSortChange
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Hero Section */}
      <Box
        sx={{
          width: '100%',
          height: {
            xs: 'auto',
            md: currentParams ? '300px' : '800px'
          },
          backgroundImage: { xs: 'none', md: `url(${travelBackground})` },
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'flex-start', // Top justify
          justifyContent: 'center',
          mb: currentParams ? 0 : 4,
          pt: { xs: '120px', md: currentParams ? 5 : 3 }, // 40px when shrunk, 24px when full
          transition: 'height 0.8s ease-in-out',
          overflow: 'hidden'
        }}
      >
        <Container sx={{ maxWidth: '1150px !important', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!currentParams && (
            <Typography
              variant="h4"
              sx={{
                color: '#8e799f',
                fontWeight: 500,
                mb: 3, // 24px (3*8) gap to search form
                textAlign: 'center'
              }}
            >
              Explore a wonderful world for curious travelers
            </Typography>
          )}
          <SearchForm onSearch={onSearch} isLoading={isLoading} />
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
          <>
            {hotels.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 4 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={sortOption || 'topPicks'}
                    onChange={onSortChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Sort by' }}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <MenuItem value="topPicks">Our top picks</MenuItem>
                    <MenuItem value="priceLowHigh">Price (low to high)</MenuItem>
                    <MenuItem value="priceHighLow">Price (high to low)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
            <HotelList
              hotels={hotels}
              searchParams={currentParams}
              hasSearched={currentParams !== null}
            />
          </>
        )}
      </Container>
    </Box>
  );
};

function App() {
  return (
    <Router>
      <MainView />
    </Router>
  );
}

function MainView() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);
  const [originalHotels, setOriginalHotels] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState<any>(null);
  const [resetKey, setResetKey] = useState(0);
  const [sortOption, setSortOption] = useState('topPicks');

  const handleSearch = async (params: any) => {
    setIsLoading(true);
    setError(null);
    setCurrentParams(params);
    setSortOption('topPicks'); // Reset sort on new search
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

      // Sort by rating (high to low) for "Top Picks"
      merged.sort((a: any, b: any) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });

      setHotels(merged);
      setOriginalHotels(merged);
    } catch (err: any) {
      setError(err.message || "Failed to search hotels");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSortOption(value);

    let sortedHotels = [...originalHotels];

    if (value === 'priceLowHigh') {
      sortedHotels.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
    } else if (value === 'priceHighLow') {
      sortedHotels.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
    } else {
      // 'topPicks' - logic assumes original order is top picks
      sortedHotels = [...originalHotels];
    }

    setHotels(sortedHotels);
  };

  const handleLogoClick = () => {
    setHotels([]);
    setOriginalHotels([]);
    setCurrentParams(null);
    setError(null);
    setSortOption('topPicks');
    setResetKey(prev => prev + 1);
    navigate('/');
  };

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between', position: 'relative' }}>
          {/* Far Left: Logo */}
          <Box
            component="img"
            src={nomadistLogo}
            sx={{ height: 40, width: 'auto', cursor: 'pointer' }}
            alt="Nomadist Logo"
            onClick={handleLogoClick}
          />

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
          <Route path="/" element={
            <SearchPage
              key={resetKey}
              isLoading={isLoading}
              hotels={hotels}
              error={error}
              currentParams={currentParams}
              onSearch={handleSearch}
              sortOption={sortOption}
              onSortChange={handleSortChange}
            />
          } />
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
    </>
  );
}

export default App;
