const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.get('/login', (req, res) => {
  if (res.locals.currentUser) return res.redirect('/dashboard');
  res.render('login', { title: 'Login', error: null });
});


router.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});


module.exports = router;
