import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Pedido extends Model {}

Pedido.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  estado: { type: DataTypes.STRING, allowNull: false, defaultValue: 'CREADO' }, // CREADO/CONFIRMADO/CANCELADO
  fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  modelName: 'Pedido',
  tableName: 'pedidos',
  timestamps: true
});

export default Pedido;
