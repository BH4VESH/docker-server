const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken'); 
const User = require('./models/adminModel');
const vehicleRoutes = require('./routes/vehicleRoutes');
const countryRoutes = require('./routes/countryRoutes')
const cityRoutes=require('./routes/cityRoutes')
const vehicle_price_Routes=require('./routes/vehiclePriceRoutes')
const userRoutes=require('./routes/userRoutes')
const driver_listRoutes=require('./routes/driverListRoutes')
const settingRoutes=require('./routes/settingRoutes')
const createRideRoutes=require('./routes/createRideRoutes')
const confirmedRideRoutes=require('./routes/confirmedRideRoutes')
const runningRequestRoutes=require('./routes/runningRequestRoutes')
const ridedHistoryRoutes=require('./routes/ridedHistoryRoutes')
// const socketService = require('./service/socketService');
const initializeCronJob = require('./service/cron');
const dotenv=require("dotenv").config();
const app = express();

global.counter=0

// create socket 
const http = require('http').Server(app);
const initializeSocket = require("./service/socketService")
// const server = http.Server(app);

const port = process.env.port;

// mongoose.connect(process.env.mongo_path)
//   .then(() => console.log('MongoDB Connected'))
//   .catch(err => console.log(err));
mongoose.connect(process.env.mongo_path)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

  const corsOptions = {
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200
  };

app.use(cors());
// app.use(cors(corsOptions));
app.use(bodyParser.json());

// const JWT_SECRET = 'secret_key'; 

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).send('Invalid username');
  }
  if (user.password !== password) {
    return res.status(401).send('Invalid password');
  }
  if (user) {
    // const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '2000m' });
    res.json({ token });
  } 
});

function checkAuth(req, res, next) {
  const token = req.headers['authorization']; 
  if (token) {
    jwt.verify(token,process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send('Unauthorized');
      } else {
        req.user = decoded;
        next();
      }
    });
  } else {  
    res.status(401).send('Unauthorized');
  }
}

app.use('/vehicles', checkAuth,vehicleRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/countrys',checkAuth, countryRoutes);
app.use('/city',checkAuth, cityRoutes);
app.use('/vehicle/price',checkAuth, vehicle_price_Routes);
app.use('/users',checkAuth, userRoutes);
app.use('/driverlist',checkAuth,driver_listRoutes);
app.use('/setting',checkAuth,settingRoutes);
// task-4 start
app.use('/createride',checkAuth,createRideRoutes);
app.use('/confirmedride',checkAuth,confirmedRideRoutes);
app.use('/runningride',checkAuth,runningRequestRoutes);
app.use('/ridehistory',checkAuth,ridedHistoryRoutes);



// for the socket connection
initializeSocket(http)
  initializeCronJob();

http.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
