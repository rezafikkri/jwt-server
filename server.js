// Setup
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const router = express.Router();

// Setup Local
const config = require('./app/config');
const User = require('./app/models/user');
const port = '4000';

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(config.database);
app.set('secretKey', config.secret);

// Router API
router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.json({ success: false, messsage: 'User tidak ada' });
    } else {
      if (req.body.password != user.password) {
        res.json({ success: false, messsage: 'Password user salah' });
      } else {
        // Membuat token
        const token = jwt.sign(user.toJSON(), app.get('secretKey'), {
          expiresIn: '24h'
        });
        // mengirim balik token
        res.json({
          success: true,
          message: 'Token berhasil didapatkan',
          token
        });
      }
    }
  } catch (err) {
    next(err);
  }
});

router.get('/', (req, res) => {
  res.send('ini di route home');
});

// Proteksi route dengan token
router.use(async (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    try {
      const decoded = await jwt.verify(token, app.get('secretKey'));
      req.decoded = decoded;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    res.status(403).send({
      success: false,
      message: 'Token tidak tersedia'
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    next(err);
  }
});
router.get('/profile', (req, res) => {
  res.json(req.decoded);
});

app.use('/api', router);
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name == 'JsonWebTokenError') {
    res.status(403).json({
      success: false,
      message: 'Token tidak valid',
    });
  } else if (err.name == 'TokenExpiredError') {
    res.status(403).json({
      success: false,
      message: 'Token sudah expire'
    });
  } else {
    res.status(500).send('Something broke!');
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
