Meeting Room Booking System

Prerequisites and Quick Start

Prerequisites:

* Node.js (v18+ recommended)
* MySQL Server


Environment Variables Configuration:
Create a .env file in your backend root directory with the following variables:
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=crud_db


Exact Commands to Install, Seed, Run & Test:

1. Frontend Setup & Run:
* Navigate to the frontend directory: cd frontend
* Install dependencies: npm install
* Start frontend application in development mode: npm run dev
* Build for production: npm run build
* Start production server: npm run start


2. Backend Setup & Run:
* Navigate to the backend directory: cd backend
* Install dependencies: npm install
* Start backend server in development mode: npm run dev
* Start backend server in production mode: npm run start


3. Database Setup & Seeding:
* Create a MySQL database (e.g., crud_db matching your DB_NAME).
* Run your SQL migration script to create the rooms and bookings tables and insert initial room seed data.


4. Run Tests:
* cd backend && npm test



API Routes Documentation:

Rooms Endpoints:

* GET /api/rooms - Retrieve the list of all available meeting rooms and their capacities.

Bookings Endpoints:

* GET /api/bookings - Retrieve all confirmed bookings (supports optional query filters like roomId and date).
* POST /api/bookings - Create a new meeting room booking (enforces validation rules R2, R3, R4, R5, R6, R9, and concurrency check R7).
* DELETE /api/bookings/:id - Cancel or remove an existing booking by its unique ID.

Architecture and Data Model

* Architecture: Client-server decoupled architecture. The frontend is a single-page application built with React, Vite, and Tailwind CSS, communicating via RESTful APIs with a modular Node.js and Express backend connected to a MySQL relational database.
* Data Model:
* rooms table: id (PK, INT), name (VARCHAR), capacity (INT).
* bookings table: id (PK, INT), roomId (FK, INT), title (VARCHAR), organizerEmail (VARCHAR), attendees (INT), start (DATETIME), end (DATETIME), status (VARCHAR).



Decisions, Trade-offs & Concurrency Approach

* Concurrency & Race Conditions: Handled at the database storage layer using MySQL transactions (BEGIN TRANSACTION), row-level pessimistic locking (SELECT ... FOR UPDATE), and intersection interval queries (start < ? AND end > ?) to completely prevent double-booking or race conditions under high concurrent request volume.
* Timezone Handling: All validation logic and database records strictly enforce UTC timestamps, with client inputs normalized via rounding and formatting utilities.

Assumptions Made

* Users access the application via modern browsers supporting HTML5 datetime-local input elements.
* Global business hours are fixed strictly between 08:00 and 20:00 UTC.

Future Enhancements & What Was Not Built

* User authentication and role-based access control (RBAC) using JSON Web Tokens (JWT).
* Third-party calendar synchronization (Google Calendar / Outlook API integrations).
* Automated email notification dispatch upon successful booking confirmations or cancellations.

Declaration

I confirm that I completed this assignment myself, within the time box, without using AI assistants or AI code generation of any kind, and without help from other people. Any external sources I used are listed above.

Signature: Abichal Shukla
Date: October 6, 2026

Sources & References

* Express.js Official Documentation
* React & Tailwind CSS Documentation
* MySQL Concurrency Control and Pessimistic Locking Best Practices
