const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fullName: { type: DataTypes.STRING(200), allowNull: false },
    email: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    nationalId: { type: DataTypes.STRING(50), allowNull: true },
    passwordHash: { type: DataTypes.STRING(200), allowNull: false },
    role: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'staff' },
    status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'active' },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true }
  },
  {
    tableName: 'users',
    indexes: [{ unique: true, fields: ['email'] }]
  }
);

module.exports = User;
