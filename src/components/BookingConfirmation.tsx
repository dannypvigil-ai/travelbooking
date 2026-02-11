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
            // Retrieve persisted guest info
            const storedData = localStorage.getItem('pendingBooking');
            let storedPrebookId = null;
            let storedTransactionId = null;
            let guest = null;

            if (storedData) {
                const parsed = JSON.parse(storedData);
                guest = parsed.guest;
                storedPrebookId = parsed.prebookId;
                storedTransactionId = parsed.transactionId;
            }

            // Try to find transactionId from various sources: URL -> localStorage -> payment_intent (Stripe)
            const finalTransactionId = transactionId || storedTransactionId || searchParams.get('payment_intent') || searchParams.get('paymentId');
            const finalPrebookId = prebookIdFromUrl || storedPrebookId;

            if (!storedData || !finalTransactionId || !finalPrebookId) {
                const missing = [];
                if (!storedData) missing.push('local storage data');
                if (!finalTransactionId) missing.push('transactionId');
                if (!finalPrebookId) missing.push('prebookId');

                setStatus('error');
                setError(`Missing booking information: ${missing.join(', ')}. Please try again.`);
                return;
            }

            try {
                const response = await api.book({
                    prebookId: finalPrebookId,
                    holder: {
                        firstName: guest.firstName,
                        lastName: guest.lastName,
                        email: guest.email,
                        phone: guest.phone || '0000000000'
                    },
                    payment: {
                        method: "TRANSACTION_ID",
                        transactionId: finalTransactionId
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
        const paramsObj = Object.fromEntries(searchParams.entries());
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="subtitle2">Debug Info (Current URL Params):</Typography>
                    <pre>{JSON.stringify(paramsObj, null, 2)}</pre>
                </Paper>
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
