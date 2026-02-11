import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, CircularProgress, Alert, Paper, Button } from '@mui/material';
import { api } from '../services/api';

const BookingConfirmation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [bookingData, setBookingData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const finalizeBooking = async () => {
            const prebookIdFromUrl = searchParams.get('prebookId');
            const transactionId = searchParams.get('transactionId');

            // Retrieve persisted guest info
            const storedData = localStorage.getItem('pendingBooking');

            if (!storedData || !prebookIdFromUrl || !transactionId) {
                const missing = [];
                if (!storedData) missing.push('local storage data');
                if (!prebookIdFromUrl) missing.push('prebookId from URL');
                if (!transactionId) missing.push('transactionId from URL');

                setStatus('error');
                setError(`Missing booking information: ${missing.join(', ')}. Please try again.`);
                return;
            }

            const { guest, prebookId } = JSON.parse(storedData);

            // Verify prebookId matches (optional security check)
            if (prebookId !== prebookIdFromUrl) {
                console.warn("Prebook ID mismatch");
            }

            try {
                const response = await api.book({
                    prebookId: prebookIdFromUrl,
                    holder: {
                        firstName: guest.firstName,
                        lastName: guest.lastName,
                        email: guest.email,
                        phone: guest.phone || '0000000000'
                    },
                    payment: {
                        method: "TRANSACTION_ID",
                        transactionId: transactionId
                    },
                    guests: [{
                        occupancyNumber: 1,
                        firstName: guest.firstName,
                        lastName: guest.lastName,
                        email: guest.email,
                        phone: guest.phone,
                        remarks: ""
                    }]
                });

                if (response.data) {
                    setBookingData(response.data);
                    setStatus('success');
                    localStorage.removeItem('pendingBooking'); // Cleanup
                } else {
                    throw new Error("Invalid booking response");
                }
            } catch (err: any) {
                setStatus('error');
                setError(err.message || "Booking finalization failed");
            }
        };

        finalizeBooking();
    }, [searchParams]);

    if (status === 'loading') {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Finalizing your booking...</Typography>
            </Box>
        );
    }

    if (status === 'error') {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="contained" onClick={() => navigate('/')}>
                    Return to Home
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" gutterBottom>
                    Booking Confirmed!
                </Typography>
                <Typography variant="body1" paragraph>
                    Thank you, {bookingData?.holder?.firstName}. Your booking has been confirmed.
                </Typography>

                <Box sx={{ my: 4, textAlign: 'left', bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>Booking ID: {bookingData?.bookingId}</Typography>
                    <Typography variant="subtitle2" gutterBottom>Hotel: {bookingData?.hotel?.name}</Typography>
                    <Typography variant="subtitle2" gutterBottom>Check-in: {bookingData?.checkin}</Typography>
                    <Typography variant="subtitle2" gutterBottom>Check-out: {bookingData?.checkout}</Typography>
                    <Typography variant="subtitle2" gutterBottom>Confirmation Code: {bookingData?.hotelConfirmationCode}</Typography>
                </Box>

                <Button variant="contained" onClick={() => navigate('/')}>
                    Book Another Trip
                </Button>
            </Paper>
        </Container>
    );
};

export default BookingConfirmation;
