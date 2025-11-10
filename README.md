# Smart Stay - An Airbnb-like Platform 🏠

Welcome to Smart Stay! This is an full-featured accomodation booking platform that lets users find, book, and list there properties. Its inspired by Airbnb and built with modern web technologies.

## Features 🌟

- User authentification and authorization
- Property listing creation and management
- Advanced property search with filters
- Real-time availibility checking
- Interactive maps integration
- Secure payment processing
- Review and rating system
- Image upload and management
- Responsive design for all devices

## Tech Stack 💻

- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **View Engine:** EJS
- **Authentication:** Passport.js
- **Image Storage:** Cloudinary
- **Maps:** Leaflet
- **Styling:** CSS, Bootstrap
- **Other:** Multer, Bcrypt, Connect-flash

## Getting Started 🚀

### Prerequisites

- Node.js (v14 or higher)
- MongoDB installed locally
- Git

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/sahil7-05/Smart-Stay-like-AIRBNB.git
```

2. Navigate to project directory:
```bash
cd Smart-Stay-like-AIRBNB
```

3. Install dependancies:
```bash
npm install
```

4. Create a `.env` file in root directory with these variables:
```
MONGO_URL=mongodb://127.0.0.1:27017/wanderlust
SESSION_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

5. Start the application:
```bash
npm start
```

Visit `http://localhost:8080` in your browser to see the application running!

## Project Structure 📁

```
├── config/          # Configuration files
├── models/          # Database models
├── public/          # Static files (CSS, JS)
├── routes/          # Route handlers
├── views/           # EJS templates
└── app.js          # Main application file
```

## Key Features in Detail 🔍

### Property Listings
- Create, edit, and delete property listings
- Upload multiple images
- Set pricing and availability
- Add detailed descriptions and amenities

### Search & Filters
- Search by location
- Filter by price range
- Filter by property type
- Sort by ratings and reviews

### User Features
- Secure registration and login
- Profile management
- Booking history
- Property management dashboard

### Maps Integration
- View properties on interactive maps
- Get directions
- Explore nearby attractions

## Contributing 🤝

We welcomes contributions! Feel free to:

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License 📝

This project is licensed under MIT License - see the LICENSE file for details.

## Acknowledgments 🙏

- Inspired by Airbnb's user interface
- Built as part of a web development project
- Thanks to all contributors and supporters

## Contact 📧

- Created by Sahil Saini
- GitHub: [@sahil7-05](https://github.com/sahil7-05)

---

Remember to ⭐️ this repository if you find it helpful!