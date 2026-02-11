
// Define types matches the backend proxy responses
export interface Place {
    placeId: string;
    displayName: string;
    formattedAddress: string;
}

export interface HotelSearchParams {
    checkin: string;
    checkout: string;
    adults: number;
    // One of the following is required
    placeId?: string;
    hotelIds?: string[];
    aiSearch?: string;
    // Optional
    children?: number[];
    currency?: string;
    guestNationality?: string;
}

export interface PrebookParams {
    offerId: string;
    usePaymentSdk: boolean;
}

export interface BookingParams {
    prebookId: string;
    holder: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    payment: {
        method: string;
        transactionId?: string;
    };
    guests: {
        occupancyNumber: number;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        remarks?: string;
    }[];
    clientReference?: string;
}

// Helper to call Firebase Functions
// Note ensure your function names match what is exported in functions/src/index.ts
// The backend exports 'api', which is an Express app.
// So we need to call the HTTP endpoints of that Express app, NOT callable functions.
// Wait, the existing backend uses `functions.https.onRequest(app)`.
// This means they are HTTP endpoints, not Callable functions.
// We should use standard fetch or axios to call them.
// The URL will be: https://us-central1-<project-id>.cloudfunctions.net/api/liteapi/...

// Let's dynamically determine the base URL based on environment or window.location
// For local dev with emulators, it might be different. 
// Ideally, we use the relative path if hosted on Firebase Hosting rewritten to functions.

const BASE_URL = '/api'; // Assuming a rewrite rule in firebase.json mapping /api to the function

export const api = {
    searchPlaces: async (query: string): Promise<Place[]> => {
        try {
            const response = await fetch(`${BASE_URL}/liteapi/data/places?textQuery=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error("Error searching places:", error);
            throw error;
        }
    },

    searchHotels: async (params: HotelSearchParams) => {
        try {
            const response = await fetch(`${BASE_URL}/liteapi/hotels/rates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...params,
                    currency: params.currency || 'USD',
                    guestNationality: params.guestNationality || 'US',
                    roomMapping: true, // Use simpler structure?
                    includeHotelData: true // Important for UI
                })
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error("Error searching hotels:", error);
            throw error;
        }
    },

    getHotelDetails: async (hotelId: string) => {
        try {
            const response = await fetch(`${BASE_URL}/liteapi/data/hotel?hotelId=${hotelId}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error("Error getting hotel details:", error);
            throw error;
        }
    },

    preBook: async (params: PrebookParams) => {
        try {
            const response = await fetch(`${BASE_URL}/book/rates/prebook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Prebook failed');
            }
            return await response.json();
        } catch (error) {
            console.error("Prebook error:", error);
            throw error;
        }
    },

    book: async (params: BookingParams) => {
        try {
            const response = await fetch(`${BASE_URL}/book/rates/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Booking failed');
            }
            return await response.json();
        } catch (error) {
            console.error("Booking error:", error);
            throw error;
        }
    }
};
