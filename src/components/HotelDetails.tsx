import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
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
    Paper,
    IconButton,
    Dialog,
    DialogContent
} from '@mui/material';
import { api } from '../services/api';
import ArrowCircleLeftOutlined from '@mui/icons-material/ArrowCircleLeftOutlined';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

// Helper to group rates
const groupRates = (roomTypes: any[]) => {
    // Map of mappedRoomId -> { roomInfo, rates: [] }
    const groups: any = {};

    roomTypes.forEach(rt => {
        rt.rates.forEach((rate: any) => {
            const roomId = rate.mappedRoomId || 'unmapped';
            if (!groups[roomId]) {
                groups[roomId] = {
                    name: rate.name,
                    description: rt.description,
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

    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);

    const handleOpenLightbox = (index: number) => {
        setPhotoIndex(index);
        setLightboxOpen(true);
    };

    const handleCloseLightbox = () => {
        setLightboxOpen(false);
    };

    const handleNextPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hotel?.hotelImages) {
            setPhotoIndex((prev) => (prev + 1) % hotel.hotelImages.length);
        }
    };

    const handlePrevPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hotel?.hotelImages) {
            setPhotoIndex((prev) => (prev - 1 + hotel.hotelImages.length) % hotel.hotelImages.length);
        }
    };

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

                console.log('Hotel Details API Response:', details);
                console.log('Rate API Response:', rateData);

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
    if (error) return <Box sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Box>;
    if (!hotel) return <Box sx={{ mt: 4 }}><Alert severity="warning">Hotel not found</Alert></Box>;

    return (
        <Box sx={{ py: 0 }}>
            <Button
                startIcon={<ArrowCircleLeftOutlined />}
                onClick={() => navigate(-1)}
                sx={{
                    color: 'primary.main',
                    textTransform: 'none',
                    p: 0,
                    mb: 3,
                    '&:hover': {
                        backgroundColor: 'transparent',
                        textDecoration: 'underline'
                    },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '1rem'
                }}
            >
                See all properties
            </Button>

            {/* DEBUG INFO REMOVED */}
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

                {/* Show all photos button */}
                {hotel.hotelImages && hotel.hotelImages.length > 3 && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<CameraAltIcon />}
                            onClick={() => handleOpenLightbox(0)}
                        >
                            Show all photos ({hotel.hotelImages.length})
                        </Button>
                    </Box>
                )}

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
                <Grid container spacing={4}>
                    {rates.map((group: any, i: number) => {
                        return (
                            <Grid size={{ xs: 12 }} key={i}>
                                <Card variant="outlined" sx={{ overflow: 'visible' }}>
                                    <CardContent>
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="h5" gutterBottom>{group.name}</Typography>
                                            {group.description && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {group.description}
                                                </Typography>
                                            )}
                                        </Box>

                                        <Grid container spacing={2}>
                                            {group.rates.map((rate: any, j: number) => (
                                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={j}>
                                                    <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                        <Box>
                                                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                                                {rate.boardName}
                                                            </Typography>
                                                            {rate.description && (
                                                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
                                                                    {rate.description}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Box sx={{ mt: 2 }}>
                                                            <Box sx={{ mb: 1 }}>
                                                                <Typography variant="caption" color={rate.cancellationPolicies.refundableTag === 'RFN' ? 'success.main' : 'error.main'} sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                                                                    {rate.cancellationPolicies.refundableTag === 'RFN' ? 'Refundable' : 'Non-Refundable'}
                                                                </Typography>
                                                                <Typography variant="h6" color="primary">
                                                                    {rate.retailRate.total[0].currency} {rate.retailRate.total[0].amount}
                                                                </Typography>
                                                            </Box>
                                                            <Button
                                                                variant="contained"
                                                                fullWidth
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
                        );
                    })}
                </Grid>
            )}

            {/* Global Hotel Image Lightbox */}
            <Dialog
                open={lightboxOpen}
                onClose={handleCloseLightbox}
                maxWidth={false}
                PaperProps={{
                    sx: {
                        maxWidth: '95vw',
                        maxHeight: '95vh',
                        bgcolor: 'black',
                        overflow: 'hidden',
                        borderRadius: 2
                    }
                }}
            >
                <DialogContent sx={{ p: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: { xs: 300, md: 800 }, minHeight: { xs: 300, md: 600 } }}>
                    <IconButton
                        onClick={handleCloseLightbox}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.4)',
                            zIndex: 10,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    {hotel?.hotelImages && hotel.hotelImages.length > 0 && (
                        <>
                            <Box
                                component="img"
                                src={hotel.hotelImages[photoIndex].url}
                                alt={hotel.hotelImages[photoIndex].caption || hotel.name}
                                sx={{
                                    maxWidth: '100%',
                                    maxHeight: '90vh',
                                    objectFit: 'contain'
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 12,
                                    right: 12,
                                    bgcolor: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 4,
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                }}
                            >
                                <CameraAltIcon sx={{ fontSize: 14 }} />
                                {photoIndex + 1} / {hotel.hotelImages.length}
                            </Box>
                        </>
                    )}

                    {hotel?.hotelImages && hotel.hotelImages.length > 1 && (
                        <>
                            <IconButton
                                onClick={handlePrevPhoto}
                                sx={{
                                    position: 'absolute',
                                    left: 16,
                                    color: 'white',
                                    bgcolor: 'rgba(0,0,0,0.4)',
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                                    p: 2
                                }}
                            >
                                <NavigateBeforeIcon fontSize="large" />
                            </IconButton>
                            <IconButton
                                onClick={handleNextPhoto}
                                sx={{
                                    position: 'absolute',
                                    right: 16,
                                    color: 'white',
                                    bgcolor: 'rgba(0,0,0,0.4)',
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                                    p: 2
                                }}
                            >
                                <NavigateNextIcon fontSize="large" />
                            </IconButton>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default HotelDetails;
