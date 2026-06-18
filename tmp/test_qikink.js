const axios = require("axios");
require("dotenv").config({ path: "/Users/cheeranjeevan.k/Documents/ILYRA/backend/.env" });

const testAuth = async () => {
    const clientId = process.env.QIKINK_CLIENT_ID;
    const clientSecret = process.env.QIKINK_CLIENT_SECRET;

    console.log("Testing with Client ID:", clientId);

    const configs = [
        {
            name: "Test 1: PascalCase ClientId + Form Encoded (/api/token)",
            url: "https://api.qikink.com/api/token",
            data: new URLSearchParams({ ClientId: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        },
        {
            name: "Test 2: lowercase client_id + Form Encoded (/api/token)",
            url: "https://api.qikink.com/api/token",
            data: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        },
        {
            name: "Test 3: lowercase + grant_type + JSON (/oauth/token)",
            url: "https://api.qikink.com/oauth/token",
            data: { client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" },
            headers: { "Content-Type": "application/json" }
        }
    ];

    for (const config of configs) {
        console.log(`\n--- Running ${config.name} ---`);
        try {
            const res = await axios.post(config.url, config.data, { headers: config.headers });
            console.log("SUCCESS ✅:", res.data);
            return;
        } catch (err) {
            console.log("FAILED ❌:", err.response?.data || err.message);
        }
    }
};

testAuth();
