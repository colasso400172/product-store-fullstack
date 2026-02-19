import Cliente from './Cliente.js';
import Pedido from './Pedido.js';
import PedidoItem from './PedidoItem.js';
import Producto from './Producto.js';

// Cliente 1:N Pedido
Cliente.hasMany(Pedido, { foreignKey: 'clienteId', as: 'pedidos' });
Pedido.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });

// Pedido 1:N PedidoItem
Pedido.hasMany(PedidoItem, { foreignKey: 'pedidoId', as: 'items', onDelete: 'CASCADE' }); //tiene muchos items
PedidoItem.belongsTo(Pedido, { foreignKey: 'pedidoId', as: 'pedido' }); //pertenece a un pedido

// Producto 1:N PedidoItem
Producto.hasMany(PedidoItem, { foreignKey: 'productoId', as: 'items' });
PedidoItem.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });

// No exporta nada: con importar ya registra las asociaciones
