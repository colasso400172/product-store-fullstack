import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.js';

class Cliente extends Model {}

//crea tabla clientes
//cliente.init(atributos, opciones)
Cliente.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
  email: {
    type: DataTypes.STRING, allowNull: false, unique: true,
    validate: { isEmail: true }
  }
}, {
  sequelize, //instance de conexión
  modelName: 'Cliente', //nombre lógico
  tableName: 'clientes',
  timestamps: true //createdAt, updatedAt modificaciones
});

export default Cliente;
