//inicia el servidor

import express from 'express';
import cors from 'cors';
import sequelize from './config/db.js';

// Modelos y asociaciones
import './models/Producto.js';
import './models/Cliente.js';
import './models/Pedido.js';
import './models/PedidoItem.js';
import './models/associations.js';

// Rutas
import productosRouter from './routes/productos.js';
import clientesRouter from './routes/clientes.js';
import pedidosRouter from './routes/pedidos.js';

const app = express(); //Crea la instancia del servidor Express.
app.use(cors()); //cors: Middleware que permite peticiones entre dominios
app.use(express.json()); //express.json() permite leer req.body con datos en JSON (como en POST o PUT).

//Si el archivo productos.js define router.get('/productos'), esto responderá a /api/productos
app.use('/api', productosRouter);
app.use('/api', clientesRouter);
app.use('/api', pedidosRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

// Puerto del servidor
// El puerto 3000 es el puerto por defecto para la API, pero puedes cambiarlo si es necesario.
const PORT = 3000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => console.log(`✅ API en http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Error al iniciar la app:', err);
  }
})();
