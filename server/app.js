if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const router = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

// Security & logging
app.use(helmet());
app.use(morgan("dev"));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//CORS
app.use(cors());

// Routes
app.use(router);

// Error handler
app.use(errorHandler);

module.exports = app;
