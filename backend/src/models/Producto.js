import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Producto extends Model {}

Producto.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  // Estados: DISPONIBLE / NO_DISPONIBLE
  estado: { type: DataTypes.STRING, allowNull: false, defaultValue: 'DISPONIBLE' }
}, {
  sequelize,
  modelName: 'Producto',
  tableName: 'productos',
  timestamps: true
});

export default Producto;
