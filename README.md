# skynet

## Team Members
- Shihab Muhtasim: shihabmuhtasim (Team Leader)
- Tawhidur Rahman Khan: trk345
- Raiyan Wasi Siddiky: RaiyanWasiSiddiky

## Mentor
- Hasibul Hasan: siam456

# Room Booking and Management System

Welcome to the **Room Booking and Management System** — a premium platform designed to seamlessly connect users with the perfect rooms to rent, whether it's a cozy apartment or a luxurious hotel suite. Featuring an intuitive search system, secure authentication, and powerful vendor management capabilities, this platform provides a complete end-to-end solution for room rentals.

---

## ✨ Features

- 🔒 **User Authentication**: Supports both traditional (JWT-based) and Google OAuth authentication.
- 🏠 **Dynamic Room Search**: Users can filter rooms based on location, room type, check-in/check-out dates, rating, and maximum guests.
- 📅 **Room Availability Calendar**: Visualize and select available dates effortlessly.
- 📈 **Vendor and User Dashboards**:
  - **Users** can manage their bookings and leave reviews.
  - **Vendors** (upon approval) can create, edit, and manage their properties and view key statistics like active listings, total reviews, and average ratings.
- 🛠️ **Admin Dashboard**: Manage users, properties, bookings, reviews, and vendor approval requests.
- 🌟 **Ratings and Reviews**: Users can leave feedback and star ratings for booked properties.
- 🖼️ **Property Listing**: Rich property cards displaying image galleries, availability status, price, name, location, rating, and number of reviews.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT, Cookies & Google OAuth
- **Image Uploads**: Multer
- **Deployment**: Netlify (Frontend) + Render (Backend)

---

## 📋 Project Management with Trello

We maintained a clear and organized workflow throughout the project using Trello. Every task — from initial brainstorming to final deployment — was meticulously tracked to ensure smooth collaboration and transparency.

🔗 **Trello Board**: [View our Trello Board](https://trello.com/invite/b/67aa2e29034f3b4ecd6d085e/ATTIb61d060f8d43f59bca2789210f89d4aeA3B0ADB8/skynetboard)

Our Trello board includes:
- 📌 **Task planning and assignment**
- ✅ **Progress tracking** (To-Do, In Progress, Done)
- 🛠️ **Bug tracking and feature requests**
- 🗓️ **Milestone setting and sprint planning**

Feel free to explore how we managed our project effectively!


## 🚀 Live Demo

Check out the live application here: [skynet1.netlify.app](https://skynet1.netlify.app)
** Please wait around 5-10 minutes and keep refreshing if properties don't load **
---

## 🛠️ Local Setup Instructions

Follow these steps to run the project locally:

1. **Clone the repository**:
   ```bash
   git clone <https://github.com/Learnathon-By-Geeky-Solutions/skynet/>
   cd <skynet>
   ```

2. **Install dependencies**:
   Open two terminals:
   - For the frontend:
     ```bash
     cd frontend
     npm install
     ```
   - For the backend:
     ```bash
     cd backend
     npm install
     ```

3. **Set up environment variables**:
   
   - **Frontend (`frontend/.env`)**:
     ```
     VITE_API_URL=<your-backend-api-url>
     ```

   - **Backend (`backend/.env`)**:
     ```
     PORT=<your-port>
     MONGO_URI=<your-mongodb-connection-string>
     GOOGLE_CLIENT_ID=<your-google-client-id>
     GOOGLE_CLIENT_SECRET=<your-google-client-secret>
     GOOGLE_CLIENT_HOST=<your-google-redirect-uri>
     GOOGLE_SERVER_HOST=<your-server-host>
     SESSION_SECRET=<your-session-secret>
     JWT_SECRET=<your-jwt-secret>
     CSRF_SECRET=<your-csrf-secret>
     ```

4. **Run the applications**:
   - Start the frontend:
     ```bash
     npm run dev
     ```
   - Start the backend:
     ```bash
     npm run dev
     ```

---

## 📄 License

This project is licensed under the terms of the [MIT License](https://github.com/Learnathon-By-Geeky-Solutions/skynet/blob/main/LICENSE).  
You are free to use, modify, and distribute this project for personal or commercial purposes, provided that the original license is included in all copies or substantial portions of the software.


# Thank you for visiting! ✨
