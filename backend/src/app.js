const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { mountRoutes } = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

mountRoutes(app);

app.use(errorHandler);

module.exports = app;
