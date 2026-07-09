const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(require('morgan')('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/project'));
app.use('/api/farming', require('./routes/farming'));
app.use('/api/fishing', require('./routes/fishing'));
app.use('/api/electricity', require('./routes/electricity'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`MX PS Niger State Backend running on port ${PORT}`));