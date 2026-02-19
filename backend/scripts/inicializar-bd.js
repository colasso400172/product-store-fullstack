import sequelize from '../src/config/db.js';
import '../src/models/Producto.js';
import '../src/models/Cliente.js';
import '../src/models/Pedido.js';
import '../src/models/PedidoItem.js';
import '../src/models/associations.js';

import Cliente from '../src/models/Cliente.js';
import Producto from '../src/models/Producto.js';

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // fuerza recrear tablas

    //datos de prueba
    await Cliente.bulkCreate([
      { nombre: 'Ana Díaz', email: 'ana@mail.com' },
      { nombre: 'Luis Pérez', email: 'luis@mail.com' }
    ]);

    await Producto.bulkCreate([
      { nombre: 'Mouse', precio: 10000, stock: 10 },
      { nombre: 'Teclado', precio: 25000, stock: 5 },
      { nombre: 'Monitor', precio: 95000, stock: 3 }
    ]);

    console.log('✅ Base inicializada correctamente');
    process.exit(0); //terminó correctamente, sin errores.
  } catch (err) {
    console.error('❌ Error al inicializar:', err);
    process.exit(1); //terminó con error.
  }
}

main();
