// test-overpass.js
const fetch = require('node-fetch');

(async () => {
  try {
    const query = `[out:json][timeout:25];
      (
        node["tourism"="hotel"](41.3170353,2.0524977,41.4679135,2.2283555);
        way["tourism"="hotel"](41.3170353,2.0524977,41.4679135,2.2283555);
        relation["tourism"="hotel"](41.3170353,2.0524977,41.4679135,2.2283555);
      );
      out center;`;

    console.log("Sending Overpass query...");

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain" },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ Hotels found:", data.elements?.length || 0);

    if (data.elements && data.elements.length > 0) {
      console.log("Example:", data.elements[0]);
    }
  } catch (err) {
    console.error("❌ Overpass error:", err.message);
  }
})();
