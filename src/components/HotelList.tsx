import React from 'react';
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Grid,
    Button,
    Chip,
    Rating
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface HotelListProps {
    hotels: any[]; // Combined hotel + rate data
    searchParams?: any;
    hasSearched: boolean;
}

const HotelList: React.FC<HotelListProps> = ({ hotels, searchParams, hasSearched }) => {
    const navigate = useNavigate();

    if (!hotels || hotels.length === 0) {
        return (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                    {hasSearched ? "No hotels found. Try adjusting your search." : "Ideas for your next trip"}
                </Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={3} sx={{ mt: 2 }}>
            {hotels.map((hotel) => (
                <Grid size={{ xs: 12 }} key={hotel.hotelId}>
                    <Card sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                        <CardMedia
                            component="img"
                            sx={{ width: { xs: '100%', md: 300 }, height: 200, objectFit: 'cover' }}
                            image={hotel.main_photo || 'https://via.placeholder.com/300x200?text=No+Image'}
                            alt={hotel.name}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                            <CardContent sx={{ flex: '1 0 auto' }}>
                                <Typography component="div" variant="h5">
                                    {hotel.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Rating value={hotel.rating || 0} readOnly size="small" precision={0.5} />
                                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        ({hotel.rating} / 10)
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {hotel.address}
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                    {hotel.tags?.slice(0, 3).map((tag: string) => (
                                        <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                    ))}
                                </Box>
                            </CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'flex-end', bgcolor: 'background.default' }}>
                                <Box sx={{ mr: 2, textAlign: 'right' }}>
                                    <Typography variant="caption" display="block" color="text.secondary">
                                        Starting from
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                        {hotel.currency} {hotel.minPrice?.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate(`/hotel/${hotel.hotelId}`, { state: { searchParams } })}
                                >
                                    View Rates
                                </Button>
                            </Box>
                        </Box>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default HotelList;
