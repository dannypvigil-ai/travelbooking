import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
const liteApi = require("liteapi-node-sdk");

dotenv.config();

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize SDK with key from env
const getSdk = () => {
    const apiKey = process.env.SAND_API_KEY;
    // In production, logic to switch to PROD_API_KEY based entirely on env
    if (!apiKey) {
        throw new Error("API Key not found in environment");
    }
    return liteApi(apiKey);
};


// Since I don't know the full SDK surface area, and I want to fix the booking *now*,
// I will implement the booking endpoints first using the SDK as seen in server.js.
// For the others, I'll allow them to pass through? No, key is hidden.
// I must proxy them.

// Helper for generic GET
const proxyGet = async (path: string, params: any) => {
    const apiKey = process.env.SAND_API_KEY;
    const axios = require('axios');
    const response = await axios.get(`https://api.liteapi.travel/v3.0${path}`, {
        headers: { 'X-API-Key': apiKey, 'Accept': 'application/json' },
        params
    });
    return response.data;
};

// Helper for generic POST
const proxyPost = async (path: string, body: any) => {
    const apiKey = process.env.SAND_API_KEY;
    console.log(`[ProxyPost] Key present? ${!!apiKey}, Path: ${path}`);
    console.log(`[ProxyPost] Body:`, JSON.stringify(body));

    const axios = require('axios');
    try {
        const response = await axios.post(`https://api.liteapi.travel/v3.0${path}`, body, {
            headers: { 'X-API-Key': apiKey, 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (e: any) {
        console.error(`[ProxyPost Error] ${path}:`, e.message);
        if (e.response) {
            console.error(`[ProxyPost Error Data]:`, JSON.stringify(e.response.data));
            throw e; // Re-throw to be caught by route handler
        }
        throw e;
    }
};

const router = express.Router();

// --- ROUTES ---

// Search Places (Autocomplete)
router.get("/liteapi/data/places", async (req, res) => {
    try {
        const data = await proxyGet('/data/places', req.query);
        res.json(data);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Hotel Details
router.get("/liteapi/data/hotel", async (req, res) => {
    try {
        const data = await proxyGet('/data/hotel', req.query);
        res.json(data);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Hotel Rates (Search)
router.post("/liteapi/hotels/rates", async (req, res) => {
    try {
        const data = await proxyPost('/hotels/rates', req.body);
        res.json(data);
    } catch (e: any) {
        res.status(500).json({ error: e.message, details: e.response?.data });
    }
});

// Prebook - Use SDK to ensure correct Payment SDK handling?
// The example server.js adds `usePaymentSdk: true`.
// My frontend sends `usePaymentSdk: false` usually.
// If I use SDK here, I can force it.
router.post("/book/rates/prebook", async (req, res) => {
    try {
        const sdk = getSdk();
        // SDK method: sdk.preBook(body)
        // Request body from frontend: { offerId, usePaymentSdk: false }
        // I will override usePaymentSdk to true to match the working example?
        // Or trust the frontend?
        // User said: "Client-side booking ... fails ... example uses usePaymentSdk: true".
        // So I should force it to true?

        const body = { ...req.body, usePaymentSdk: true };

        // Using SDK:
        const response = await sdk.preBook(body);
        // SDK returns data directly or response?
        // server.js: .then(response => res.json({ success: response }))
        // My frontend expects: { data: ... }
        // The SDK response structure might need mapping.
        // Let's assume SDK returns the `data` object directly?
        // Or I can just proxy it via axios if I want to match exactly?
        // But SDK handles the signature generation?
        // "LiteAPI SDK ... handles raw JSON".

        // Let's try proxying via axios first, but overwriting `usePaymentSdk` to true?
        // If I proxy, I get the raw API response which matches frontend expectation.
        // If I use SDK, I might get a different shape.
        // I'll stick to PROXY via axios for consistency, but enable `usePaymentSdk: true`.
        // AND handle the key.

        // Wait, if I use `usePaymentSdk: true`, I get a 'paymentTypes' response.
        // And for Booking, I need to send `payment: { method: 'TRANSACTION_ID', transactionId }`.

        const data = await proxyPost('/rates/prebook', body);
        res.json(data);
    } catch (e: any) {
        console.error("Prebook error", e.response?.data || e.message);
        res.status(500).json({ error: e.message, details: e.response?.data });
    }
});

// Booking - This is where the magic happens
router.post("/book/rates/book", async (req, res) => {
    try {
        const sdk = getSdk(); // Use SDK for booking if possible?
        // server.js: sdk.book(bodyData)

        // My frontend sends:
        // { prebookId, holder, payment, guests }

        // I need to ensure `guests` has `occupancyNumber`.
        // My frontend update ALREADY added `occupancyNumber` and `remarks`.
        // So the payload *should* be correct.

        // I'll try proxying with axios first.
        // If that fails, I'll switch to SDK.
        // Proxying is safer for preserving existing response shape.

        const data = await proxyPost('/rates/book', req.body);
        res.json(data);
    } catch (e: any) {
        console.error("Booking error", e.response?.data || e.message);
        res.status(500).json({ error: e.message, details: e.response?.data });
    }
});


app.use("/api", router);
app.use("/", router);

export const api = functions.https.onRequest(app);
