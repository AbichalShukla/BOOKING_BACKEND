require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./config/db");



const roomRoutes = require('./routes/room.routes');
const bookingRoutes = require('./routes/booking.routes');
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");

const app = express();
app.use(cors());
app.use(express.json());




app.use('/api', roomRoutes);
app.use('/api', bookingRoutes);


app.get("/", (req, res) => {
  res.json({
    message: "Backend is running",
  });
});













app.use(notFound);
app.use(errorHandler);
async function startServer() {
  try {
    // Test MySQL
    const [result] = await db.execute("SELECT 1 AS result");

    console.log("MySQL connected:", result);


    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();