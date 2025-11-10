document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded, initializing hotel search...");

  const form = document.getElementById("hotelForm");
  const queryInput = document.getElementById("query");
  const hotelsContainer = document.getElementById("hotelsContainer");
  const mapContainer = document.getElementById("map");
  const loadingDiv = document.getElementById("loading");
  const errorDiv = document.getElementById("error");
  let map;

  // ✅ Check map container
  if (!mapContainer) {
    console.error("❌ Map container not found. Please refresh the page.");
    alert("Map container not found. Please refresh the page.");
    return;
  }

  // ✅ Initialize Leaflet map
  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // ✅ Handle search form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = queryInput.value.trim();
    if (!query) return;

    loadingDiv.style.display = "block";
    errorDiv.style.display = "none";
    hotelsContainer.innerHTML = "";

    try {
      const res = await fetch(`/api/search-hotels?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok || !data.hotels) {
        throw new Error(data.message || "Server error");
      }

      if (data.hotels.length === 0) {
        hotelsContainer.innerHTML = `<p>No hotels found.</p>`;
        return;
      }

      // ✅ Clear map markers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      const bounds = [];

      // ✅ Add hotels to map and cards
      data.hotels.forEach((hotel) => {
        const { name, lat, lon, address, stars } = hotel;

        if (lat && lon) {
          const marker = L.marker([lat, lon]).addTo(map);
          marker.bindPopup(`<b>${name}</b><br>${address || ""}<br>⭐ ${stars || "N/A"}`);
          bounds.push([lat, lon]);
        }

        hotelsContainer.innerHTML += `
          <div class="col-md-4">
            <div class="card p-3 shadow-sm">
              <h5>${name}</h5>
              <p>${address || "No address available"}</p>
              <small>Lat: ${lat?.toFixed(4) || "N/A"}, Lon: ${lon?.toFixed(4) || "N/A"}</small>
              <p>⭐ ${stars || "N/A"}</p>
            </div>
          </div>
        `;
      });

      if (bounds.length) map.fitBounds(bounds);
    } catch (err) {
      console.error("API Error:", err);
      errorDiv.textContent = "An error occurred while searching: " + err.message;
      errorDiv.style.display = "block";
    } finally {
      loadingDiv.style.display = "none";
    }
  });
});
