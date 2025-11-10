// Map functionality for listing show page
function initMap() {
  const listing = window.listingData;

  if (!listing) {
    console.error('Listing data not found');
    return;
  }

  const mapElement = document.getElementById("showMap");

  if (!mapElement) {
    console.error('Map element not found');
    return;
  }

  // Check if coordinates are available
  if (listing.coordinates && listing.coordinates.lat && listing.coordinates.lng) {
    const position = { lat: listing.coordinates.lat, lng: listing.coordinates.lng };

    // Initialize the map and set the view to the listing coordinates
    var map = L.map('showMap').setView([position.lat, position.lng], 15);

    // Add a tile layer (the actual map image)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add a marker
    const marker = L.marker([position.lat, position.lng]).addTo(map);

    // Create popup content
    const popupContent = `
      <div style="max-width: 200px;">
        <h6>${listing.title}</h6>
        <p>${listing.description.substring(0, 100)}${listing.description.length > 100 ? '...' : ''}</p>
        <p><strong>$${listing.price}/night</strong></p>
      </div>
    `;

    marker.bindPopup(popupContent).openPopup();

    // Keep map centered on resize
    window.addEventListener('resize', () => {
      map.setView([position.lat, position.lng], 15);
    });
  } else {
    // Fallback to geocoding if no coordinates (though we prefer coordinates)
    // For now, just show a message
    mapElement.innerHTML = '<p class="text-danger">Map location not available for this listing.</p>';
  }
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  if (typeof L !== 'undefined') {
    initMap();
  } else {
    console.error('Leaflet library not loaded');
  }
});
