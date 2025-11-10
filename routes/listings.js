// Show single listing with Leaflet Map
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  const reviews = await Review.find({ listing: id }).populate("user");
  res.render("listings/show", {
    listing,
    reviews
  });
});
