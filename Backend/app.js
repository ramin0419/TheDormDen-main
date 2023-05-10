const logger = require('./utils/logger');
const config = require('./utils/config');
const middleware = require('./utils/middleware');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookie_parser = require('cookie-parser');
const bodyParser = require('body-parser');
app = express();

logger.info('connecting to', config.MONGODB_URI);

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB');
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB: ', error.message);
  });

// app.use(cors({credentials: true, origin: 'https://dormden.me'}));
// app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
var allowedOrigins = ['http://localhost:3000', 'http://localhost:3005'];
app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          'The CORS policy for this site does not ' +
          'allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);
app.use(express.json({ limit: '25mb' }));
app.use(cookie_parser());
app.use(bodyParser.json());
app.use(middleware.requestLogger);

/*
    import Routes
*/
const userRouter = require('./routers/userRouter');
const hostelRouter = require('./routers/hostelRouter');
const reviewRouter = require('./routers/reviewRouter');
const analyticsRouter = require('./routers/analyticsRouter');

app.use('/api/reviews', reviewRouter);
app.use('/api/users', userRouter);
app.use('/api/hostels', hostelRouter);
app.use('/api/analytics', analyticsRouter);

app.use((err, req, res, next) => {
  err.status = err.status || 500;
  err.message = err.message || 'Internal Server Error';
  res.status(err.status).json({
    success: false,
    message: err.message,
    stack: err.stack,
  });
});
app.delete('/api/hostels/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const client = await MongoClient.connect(config.MONGODB_URI);
    const db = client.db('Hostel123');
    const hostels = db.collection('hostels');

    const result = await hostels.deleteOne({ id: ObjectId(id) });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Hostel deleted successfully' });
    } else {
      res.status(404).json({ message: 'Hostel not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = app;
