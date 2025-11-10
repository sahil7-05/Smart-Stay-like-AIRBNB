// public/js/show.js

document.addEventListener("DOMContentLoaded", function () {
  // Initialize Google Map when page loads
  if (typeof initMap === "function") {
    initMap();
  }

  // ⭐ Handle review star ratings (for inline review form)
  const stars = document.querySelectorAll(".star-rating");
  const ratingInput = document.getElementById("rating");

  if (stars && ratingInput) {
    stars.forEach((star) => {
      star.addEventListener("click", function () {
        const rating = parseInt(this.dataset.rating);
        ratingInput.value = rating;

        // Update star colors visually
        stars.forEach((s) => {
          const starRating = parseInt(s.dataset.rating);
          s.classList.toggle("text-warning", starRating <= rating);
          s.classList.toggle("text-muted", starRating > rating);
        });
      });

      // Hover effect for better UX
      star.addEventListener("mouseover", function () {
        const hoverValue = parseInt(this.dataset.rating);
        stars.forEach((s) => {
          const starRating = parseInt(s.dataset.rating);
          s.classList.toggle("text-warning", starRating <= hoverValue);
        });
      });

      star.addEventListener("mouseout", function () {
        const currentRating = parseInt(ratingInput.value) || 0;
        stars.forEach((s) => {
          const starRating = parseInt(s.dataset.rating);
          s.classList.toggle("text-warning", starRating <= currentRating);
          s.classList.toggle("text-muted", starRating > currentRating);
        });
      });
    });
  }

  // 📝 Validate review form
  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", function (e) {
      if (!ratingInput.value) {
        e.preventDefault();
        alert("Please select a star rating before submitting your review!");
      }
    });
  }
});

// 🗺️ Google Maps Initialization
function initMap() {
  const listing = window.listingData;
  const mapElement = document.getElementById("showMap");

  if (!mapElement) return;

  // Check if Google Maps API loaded
  if (typeof google === "undefined") {
    mapElement.innerHTML = `<p class="text-danger">Map service unavailable. Please check your internet connection.</p>`;
    return;
  }

  // Helper to create map and marker
  function renderMap(position) {
    const map = new google.maps.Map(mapElement, {
      zoom: 15,
      center: position,
      mapTypeId: "roadmap",
    });

    const marker = new google.maps.Marker({
      map,
      position,
      title: listing.title,
      animation: google.maps.Animation.DROP,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="max-width: 200px;">
          <h6>${listing.title}</h6>
          <p>${listing.description?.substring(0, 100) || ""}...</p>
          <p><strong>$${listing.price}/night</strong></p>
        </div>
      `,
    });

    marker.addListener("click", () => infoWindow.open(map, marker));

    // Keep map centered on resize
    google.maps.event.addDomListener(window, "resize", () => {
      map.setCenter(position);
    });
  }

  // Case 1: Coordinates already stored
  if (listing.coordinates && listing.coordinates.lat && listing.coordinates.lng) {
    renderMap({ lat: listing.coordinates.lat, lng: listing.coordinates.lng });
  } 
  // Case 2: Geocode using address
  else {
    const geocoder = new google.maps.Geocoder();
    const locationString = `${listing.location}, ${listing.country}`;

    geocoder.geocode({ address: locationString }, (results, status) => {
      if (status === "OK" && results[0]) {
        const position = results[0].geometry.location;
        renderMap(position);
      } else {
        mapElement.innerHTML = `<p class="text-danger">Unable to load map for ${locationString}. (${status})</p>`;
      }
    });
  }
}
