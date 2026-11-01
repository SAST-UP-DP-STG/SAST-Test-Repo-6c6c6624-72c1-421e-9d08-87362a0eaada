const path = require('path');
const crypto = require('crypto');
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

dotenv.config();

const sequelize = require('./config/database');
const User = require('./models/User');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  const secret = process.env.JWT_SECRET || 'b7f9c2e4d8a1465f9e3c7b2a4d6f8e1c3a5b7d9f2e4c6a8b1d3e5f7c9a2b4d6';
  const token = (req.cookies && req.cookies.token) || null;
  if (!token) {
    res.locals.currentUser = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, secret);
    res.locals.currentUser = { id: payload.id, email: payload.email, role: payload.role };
  } catch (e) {
    res.locals.currentUser = null;
  }
  next();
});

app.use('/', authRoutes);
app.use('/', usersRoutes);

app.get('/', (req, res) => {
  if (res.locals.currentUser) return res.redirect('/dashboard');
  res.redirect('/login');
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.status(404).render('dashboard', { title: 'Not Found', user: null, tokenCount: 0, message: 'Page not found' });
});

async function seedInitialAccounts() {
  const count = await User.count();
  if (count > 0) return;

  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 12);
  const staffPasswordHash = await bcrypt.hash('StaffPass123!', 12);

  await User.create({
    fullName: 'IT Administrator',
    email: 'admin@company.test',
    phone: '+1-555-0100',
    nationalId: 'US-000000000',
    passwordHash: adminPasswordHash,
    role: 'admin',
    status: 'active'
  });

  await User.create({
    fullName: 'Alice Staff',
    email: 'alice@company.test',
    phone: '+1-555-0101',
    nationalId: 'US-111111111',
    passwordHash: staffPasswordHash,
    role: 'staff',
    status: 'active'
  });

  await User.create({
    fullName: 'Bob Staff',
    email: 'bob@company.test',
    phone: '+1-555-0102',
    nationalId: 'US-222222222',
    passwordHash: staffPasswordHash,
    role: 'staff',
    status: 'active'
  });
}

async function bootstrap() {
  const force = String(process.env.RESET_DB || '').toLowerCase() === 'true';
  await sequelize.sync({ force });

  await seedInitialAccounts();

  const port = Number(process.env.PORT || 3000);
  app.listen(port);
}

bootstrap().catch(() => {
  process.exitCode = 1;
});
