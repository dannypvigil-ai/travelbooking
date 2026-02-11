import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    TextField,
    Button,
    Grid,
    Paper,
    CircularProgress,
    Alert
} from '@mui/material';
import { api } from '../services/api';

declare global {
    interface Window {
        LiteAPIPayment: any;
    }
}

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { offerId, rate, hotel } = location.state || {};

    const [step, setStep] = useState(1); // 1: Guest Details, 2: Payment
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [guest, setGuest] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (!offerId) {
            navigate('/');
        }
    }, [offerId, navigate]);

    const handlePrebook = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Call Prebook API
            const response = await api.preBook({
                offerId,
                usePaymentSdk: true
            });

            const data = response.data;
            // setPrebookData set removed as unused

            // 2. Persist guest details for retrieval after redirect
            localStorage.setItem('pendingBooking', JSON.stringify({
                guest,
                hotel,
                rate,
                prebookId: data.prebookId,
                transactionId: data.transactionId // Save transactionId if available
            }));

            // 3. Move to payment step
            setStep(2);

            // 4. Initialize Payment SDK (defer slightly to ensure DOM render)
            setTimeout(() => {
                if (window.LiteAPIPayment) {
                    const config = {
                        publicKey: 'sandbox', // Use 'live' for production
                        secretKey: data.secretKey,
                        // Append prebookId AND transactionId to returnUrl
                        returnUrl: `${window.location.origin}/confirmation?prebookId=${data.prebookId}&transactionId=${data.transactionId || ''}`,
                        targetElement: '#payment-element',
                        appearance: { theme: 'flat' },
                        options: {
                            business: { name: 'Travel Booker' }
                        }
                    };
                    const payment = new window.LiteAPIPayment(config);
                    payment.handlePayment();
                } else {
                    setError("Payment SDK not loaded");
                }
            }, 100);

        } catch (err: any) {
            setError(err.message || "Prebooking failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (!offerId) return null;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>Checkout</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>{hotel.name}</Typography>
                        <Box component="img" src={hotel.main_photo} sx={{ width: '100%', borderRadius: 1, mb: 1 }} />
                        <Typography variant="body2" gutterBottom>{rate.name}</Typography>
                        <Typography variant="h6" color="primary">
                            {rate.retailRate.total[0].currency} {rate.retailRate.total[0].amount}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3 }}>
                        {step === 1 ? (
                            <form onSubmit={handlePrebook}>
                                <Typography variant="h6" gutterBottom>Guest Details</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth label="First Name" required
                                            value={guest.firstName}
                                            onChange={(e) => setGuest({ ...guest, firstName: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth label="Last Name" required
                                            value={guest.lastName}
                                            onChange={(e) => setGuest({ ...guest, lastName: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth label="Email" type="email" required
                                            value={guest.email}
                                            onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth label="Phone"
                                            value={guest.phone}
                                            onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    sx={{ mt: 3 }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <CircularProgress size={24} /> : 'Proceed to Payment'}
                                </Button>
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    Sandbox Mode: Use card 4242 4242 4242 4242 (Any future date, any CVV)
                                </Alert>
                            </form>
                        ) : (
                            <Box>
                                <Typography variant="h6" gutterBottom>Payment</Typography>
                                <div id="payment-element" style={{ minHeight: 400 }}></div>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Checkout;
