import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class PedidoItem extends Model {}

PedidoItem.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  precioUnitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } }
}, {
  sequelize,
  modelName: 'PedidoItem',
  tableName: 'pedido_items',
  timestamps: true
});

export default PedidoItem;
