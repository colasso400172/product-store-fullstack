//configura conexion con bd sqlite
//prepara bd desde 0
import { Sequelize } from 'sequelize';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../data/db.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',  //tipo de base de datos
  storage: dbPath,    //archivo donde se guarda la bd
  logging: false     //no mostrar consultas SQL en consola
});

export default sequelize;
