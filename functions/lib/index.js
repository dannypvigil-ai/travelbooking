"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const liteApi = require("liteapi-node-sdk");
dotenv.config();
admin.initializeApp();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
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
const proxyGet = async (path, params) => {
    const apiKey = process.env.SAND_API_KEY;
    const axios = require('axios');
    const response = await axios.get(`https://api.liteapi.travel/v3.0${path}`, {
        headers: { 'X-API-Key': apiKey, 'Accept': 'application/json' },
        params
    });
    return response.data;
};
// Helper for generic POST
const proxyPost = async (path, body) => {
    const apiKey = process.env.SAND_API_KEY;
    console.log(`[ProxyPost] Key present? ${!!apiKey}, Path: ${path}`);
    console.log(`[ProxyPost] Body:`, JSON.stringify(body));
    const axios = require('axios');
    try {
        const response = await axios.post(`https://api.liteapi.travel/v3.0${path}`, body, {
            headers: { 'X-API-Key': apiKey, 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });
        return response.data;
    }
    catch (e) {
        console.error(`[ProxyPost Error] ${path}:`, e.message);
        if (e.response) {
            console.error(`[ProxyPost Error Data]:`, JSON.stringify(e.response.data));
            throw e; // Re-throw to be caught by route handler
        }
        throw e;
    }
};
const router = express_1.default.Router();
// --- ROUTES ---
// Search Places (Autocomplete)
router.get("/liteapi/data/places", async (req, res) => {
    try {
        const data = await proxyGet('/data/places', req.query);
        res.json(data);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Hotel Details
router.get("/liteapi/data/hotel", async (req, res) => {
    try {
        const data = await proxyGet('/data/hotel', req.query);
        res.json(data);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Hotel Rates (Search)
router.post("/liteapi/hotels/rates", async (req, res) => {
    var _a;
    try {
        const data = await proxyPost('/hotels/rates', req.body);
        res.json(data);
    }
    catch (e) {
        res.status(500).json({ error: e.message, details: (_a = e.response) === null || _a === void 0 ? void 0 : _a.data });
    }
});
// Prebook - Use SDK to ensure correct Payment SDK handling?
// The example server.js adds `usePaymentSdk: true`.
// My frontend sends `usePaymentSdk: false` usually.
// If I use SDK here, I can force it.
router.post("/book/rates/prebook", async (req, res) => {
    var _a, _b;
    try {
        const sdk = getSdk();
        // SDK method: sdk.preBook(body)
        // Request body from frontend: { offerId, usePaymentSdk: false }
        // I will override usePaymentSdk to true to match the working example?
        // Or trust the frontend?
        // User said: "Client-side booking ... fails ... example uses usePaymentSdk: true".
        // So I should force it to true?
        const body = Object.assign(Object.assign({}, req.body), { usePaymentSdk: true });
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
    }
    catch (e) {
        console.error("Prebook error", ((_a = e.response) === null || _a === void 0 ? void 0 : _a.data) || e.message);
        res.status(500).json({ error: e.message, details: (_b = e.response) === null || _b === void 0 ? void 0 : _b.data });
    }
});
// Booking - This is where the magic happens
router.post("/book/rates/book", async (req, res) => {
    var _a, _b;
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
    }
    catch (e) {
        console.error("Booking error", ((_a = e.response) === null || _a === void 0 ? void 0 : _a.data) || e.message);
        res.status(500).json({ error: e.message, details: (_b = e.response) === null || _b === void 0 ? void 0 : _b.data });
    }
});
app.use("/api", router);
app.use("/", router);
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map