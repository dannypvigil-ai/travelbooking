import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    Paper
} from '@mui/material';
import { api } from '../services/api';

// Helper to group rates
const groupRates = (roomTypes: any[]) => {
    // Map of mapppedRoomId -> { roomInfo, rates: [] }
    const groups: any = {};

    roomTypes.forEach(rt => {
        rt.rates.forEach((rate: any) => {
            const roomId = rate.mappedRoomId || 'unmapped';
            if (!groups[roomId]) {
                groups[roomId] = {
                    name: rate.name,
                    rates: []
                };
            }
            groups[roomId].rates.push({ ...rate, offerId: rt.offerId });
        });
    });

    return Object.values(groups);
};

const HotelDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [hotel, setHotel] = useState<any>(null);
    const [rates, setRates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get search params from state, fallback to hardcoded (with occupancies fixed)
    const passedParams = location.state?.searchParams;
    const searchParams = passedParams ? {
        ...passedParams,
        hotelIds: [id || '']
    } : {
        checkin: '2026-07-01',
        checkout: '2026-07-02',
        adults: 2,
        occupancies: [{ adults: 2, children: [] }],
        hotelIds: [id || '']
    };

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                // Parallel fetch: Details + Rates
                const [details, rateData] = await Promise.all([
                    api.getHotelDetails(id),
                    api.searchHotels(searchParams)
                ]);

                setHotel(details.data);

                // Extract rates for this hotel
                const hotelRates = rateData.data?.find((h: any) => h.hotelId === id);
                if (hotelRates) {
                    setRates(groupRates(hotelRates.roomTypes));
                }
            } catch (err: any) {
                setError(err.message || "Failed to load hotel details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
    if (!hotel) return <Container sx={{ mt: 4 }}><Alert severity="warning">Hotel not found</Alert></Container>;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" gutterBottom>{hotel.name}</Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {hotel.address}
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    {hotel.hotelImages?.slice(0, 3).map((img: any, i: number) => (
                        <Grid size={{ xs: 12, md: 4 }} key={i}>
                            <Box
                                component="img"
                                src={img.url}
                                alt={img.caption || hotel.name}
                                sx={{ width: '100%', height: 250, objectFit: 'cover', borderRadius: 2 }}
                            />
                        </Grid>
                    ))}
                </Grid>
                <Typography variant="body1" paragraph dangerouslySetInnerHTML={{ __html: hotel.hotelDescription || '' }} />

                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>Amenities</Typography>
                    {hotel.hotelFacilities?.slice(0, 10).map((f: string) => (
                        <Chip key={f} label={f} sx={{ mr: 1, mb: 1 }} />
                    ))}
                </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h4" gutterBottom>Available Rooms</Typography>

            {rates.length === 0 ? (
                <Alert severity="info">No rates available for these dates.</Alert>
            ) : (
                <Grid container spacing={3}>
                    {rates.map((group: any, i: number) => (
                        <Grid size={{ xs: 12 }} key={i}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h5" gutterBottom>{group.name}</Typography>
                                    <Grid container spacing={2}>
                                        {group.rates.map((rate: any, j: number) => (
                                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={j}>
                                                <Paper variant="outlined" sx={{ p: 2 }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        {rate.boardName}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                                        <Box>
                                                            {rate.retailRate.suggestedSellingPrice && (
                                                                <Typography variant="caption" sx={{ textDecoration: 'line-through', display: 'block' }}>
                                                                    {rate.retailRate.suggestedSellingPrice[0].currency} {rate.retailRate.suggestedSellingPrice[0].amount}
                                                                </Typography>
                                                            )}
                                                            <Typography variant="h6" color="primary">
                                                                {rate.retailRate.total[0].currency} {rate.retailRate.total[0].amount}
                                                            </Typography>
                                                            <Typography variant="caption" color={rate.cancellationPolicies.refundableTag === 'RFN' ? 'success.main' : 'error.main'}>
                                                                {rate.cancellationPolicies.refundableTag === 'RFN' ? 'Refundable' : 'Non-Refundable'}
                                                            </Typography>
                                                        </Box>
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => navigate('/checkout', { state: { offerId: rate.offerId, rate, hotel } })}
                                                        >
                                                            Book
                                                        </Button>
                                                    </Box>
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
};

export default HotelDetails;
