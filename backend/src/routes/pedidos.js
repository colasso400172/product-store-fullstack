import { Router } from 'express';
import sequelize from '../config/db.js';
import Cliente from '../models/Cliente.js';
import Producto from '../models/Producto.js';
import Pedido from '../models/Pedido.js';
import PedidoItem from '../models/PedidoItem.js';

const router = Router();
const ESTADOS = new Set(['CREADO', 'CONFIRMADO', 'CANCELADO']);

// GET /api/pedidos?include=items
router.get('/pedidos', async (req, res, next) => {
  try {
    const include = (req.query.include || '').split(',').map(s => s.trim());
    const withItems = include.includes('items');
//Busca todos los pedidos, ordenados por ID descendente, incluyendo cliente y (opcionalmente) items + producto.
    const pedidos = await Pedido.findAll({
      order: [['id', 'DESC']],
      //Si withItems es true, se incluye el detalle de ítems y sus productos asociados.
      include: [
        { model: Cliente, as: 'cliente' },
        ...(withItems ? [{ model: PedidoItem, as: 'items', include: [{ model: Producto, as: 'producto' }] }] : [])
      ]
    });
    res.json(pedidos);
  } catch (err) { next(err); }
});

router.get('/pedidos/:id', async (req, res, next) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: PedidoItem, as: 'items', include: [{ model: Producto, as: 'producto' }] }
      ]
    });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(pedido);
  } catch (err) { next(err); }
});

// POST /api/pedidos  { clienteId, items:[{productoId, cantidad}] }
router.post('/pedidos', async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { clienteId, items } = req.body;
    if (!clienteId || !Array.isArray(items) || items.length === 0) {
      await t.rollback(); return res.status(400).json({ error: 'clienteId e items son requeridos' });
    }

    const cliente = await Cliente.findByPk(clienteId, { transaction: t });
    if (!cliente) { await t.rollback(); return res.status(404).json({ error: 'Cliente no existe' }); }

    const ids = [...new Set(items.map(i => Number(i.productoId)))];
    const productos = await Producto.findAll({ where: { id: ids }, transaction: t });
    const porId = new Map(productos.map(p => [p.id, p]));

    for (const it of items) {
      const cant = Number(it.cantidad);
      const p = porId.get(Number(it.productoId));
      if (!p) { await t.rollback(); return res.status(404).json({ error: `Producto ${it.productoId} no existe` }); }
      if (p.estado === 'NO_DISPONIBLE') { await t.rollback(); return res.status(409).json({ error: `Producto ${p.nombre} no disponible` }); }
      if (!Number.isFinite(cant) || cant <= 0) { await t.rollback(); return res.status(422).json({ error: 'Cada item debe tener cantidad > 0' }); }
      if (p.stock < cant) { await t.rollback(); return res.status(409).json({ error: `Stock insuficiente de ${p.nombre}` }); }
    }

    const pedido = await Pedido.create({ clienteId, total: 0 }, { transaction: t });
//Calcula subtotal por item y suma al total general.
    let total = 0;
    for (const it of items) {
      const p = porId.get(Number(it.productoId));
      const cant = Number(it.cantidad);
      const precioUnitario = Number(p.precio);
      const subtotal = +(precioUnitario * cant).toFixed(2);
//Crea los PedidoItem y descuenta el stock.
//Actualiza el total del pedido y hace commit() de la transacción.
      await PedidoItem.create({ pedidoId: pedido.id, productoId: p.id, cantidad: cant, precioUnitario, subtotal }, { transaction: t });
      await p.update({ stock: p.stock - cant }, { transaction: t });
      total += subtotal;
    }

    await pedido.update({ total: +total.toFixed(2) }, { transaction: t });
    await t.commit();

    const creado = await Pedido.findByPk(pedido.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: PedidoItem, as: 'items', include: [{ model: Producto, as: 'producto' }] }
      ]
    });

    res.status(201).json(creado);
  } catch (err) { await t.rollback(); next(err); }
});

// PATCH /api/pedidos/:id   { estado?, clienteId? }  (actualiza estado/cliente)
router.patch('/pedidos/:id', async (req, res, next) => {
  try {
    const { estado, clienteId } = req.body;
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
//Valida el nuevo estado
    const update = {};
    if (estado !== undefined) {
      if (!ESTADOS.has(String(estado))) return res.status(422).json({ error: 'Estado inválido (CREADO, CONFIRMADO, CANCELADO)' });
      update.estado = String(estado);
    } //Si se provee clienteId, verifica que el cliente exista.
    if (clienteId !== undefined) {
      const cli = await Cliente.findByPk(clienteId);
      if (!cli) return res.status(404).json({ error: 'Cliente no existe' });
      update.clienteId = clienteId;
    }
    if (!Object.keys(update).length) return res.status(400).json({ error: 'Nada para actualizar' });

    await pedido.update(update);
    const actualizado = await Pedido.findByPk(pedido.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: PedidoItem, as: 'items', include: [{ model: Producto, as: 'producto' }] }
      ]
    });
    res.json(actualizado);
  } catch (err) { next(err); }
});

// PUT /api/pedidos/:id  { clienteId?, items:[{productoId, cantidad}] }  -> reemplaza DETALLE
//Este endpoint permite modificar los items del pedido (reemplazo total), y opcionalmente el cliente.
//transacción completa, se ajusta el stock según el delta (diferencia entre cantidades viejas y nuevas), y se actualizan o eliminan items según corresponda.
router.put('/pedidos/:id', async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { clienteId, items } = req.body;
    const pedido = await Pedido.findByPk(req.params.id, { include: [{ model: PedidoItem, as: 'items' }], transaction: t });
    if (!pedido) { await t.rollback(); return res.status(404).json({ error: 'Pedido no encontrado' }); }

    // Validar cliente (opcional)
    if (clienteId !== undefined) {
      const cli = await Cliente.findByPk(clienteId, { transaction: t });
      if (!cli) { await t.rollback(); return res.status(404).json({ error: 'Cliente no existe' }); }
      await pedido.update({ clienteId }, { transaction: t });
    }

    // Debe venir items para "editar detalle"
    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback(); return res.status(400).json({ error: 'items es requerido y no puede estar vacío' });
    }

    // Mapear actuales y nuevos
    const actuales = new Map(pedido.items.map(i => [i.productoId, i])); // productoId -> PedidoItem
    const nuevos = new Map(); // productoId -> cantidad

    for (const it of items) {
      const pid = Number(it.productoId);
      const cant = Number(it.cantidad);
      if (!Number.isFinite(pid) || !Number.isFinite(cant) || cant <= 0) {
        await t.rollback(); return res.status(422).json({ error: 'Cada item debe tener productoId válido y cantidad > 0' });
      }
      nuevos.set(pid, (nuevos.get(pid) || 0) + cant); // agrupar por producto
    }

    // Traer todos los productos involucrados
    const todosIds = [...new Set([...actuales.keys(), ...nuevos.keys()])];
    const productos = await Producto.findAll({ where: { id: todosIds }, transaction: t });
    const prodPorId = new Map(productos.map(p => [p.id, p]));

    // Calcular deltas de stock: delta = nuevaCant - viejaCant
    for (const pid of todosIds) {
      const p = prodPorId.get(pid);
      if (!p) { await t.rollback(); return res.status(404).json({ error: `Producto ${pid} no existe` }); }
      if (nuevos.has(pid) && p.estado === 'NO_DISPONIBLE') {
        await t.rollback(); return res.status(409).json({ error: `Producto ${p.nombre} no disponible` });
      }
      const vieja = actuales.get(pid)?.cantidad || 0;
      const nueva = nuevos.get(pid) || 0;
      const delta = nueva - vieja; // si >0 necesito stock

      if (delta > 0 && p.stock < delta) {
        await t.rollback(); return res.status(409).json({ error: `Stock insuficiente de ${p.nombre} (faltan ${delta})` });
      }
    }

    // Aplicar cambios de items y ajustar stock
    // 1) Borrar items removidos
    for (const [pid, item] of actuales.entries()) {
      if (!nuevos.has(pid)) {
        // devolver stock
        const p = prodPorId.get(pid);
        await p.update({ stock: p.stock + item.cantidad }, { transaction: t });
        await item.destroy({ transaction: t });
      }
    }

    // 2) Crear/actualizar items y ajustar stock por delta
    let total = 0;
    for (const pid of todosIds) {
      const p = prodPorId.get(pid);
      const vieja = actuales.get(pid)?.cantidad || 0;
      const nueva = nuevos.get(pid) || 0;
      const delta = nueva - vieja;

      // Ajustar stock (si delta>0 restar, si delta<0 devolver)
      if (delta !== 0) {
        await p.update({ stock: p.stock - delta }, { transaction: t });
      }

      if (nueva === 0) continue;

      const precioUnitario = Number(p.precio);
      const subtotal = +(precioUnitario * nueva).toFixed(2);

      if (actuales.has(pid)) {
        await actuales.get(pid).update({ cantidad: nueva, precioUnitario, subtotal }, { transaction: t });
      } else {
        await PedidoItem.create({ pedidoId: pedido.id, productoId: pid, cantidad: nueva, precioUnitario, subtotal }, { transaction: t });
      }
      total += subtotal;
    }
//toFixed(2) redondea a 2 decimales
    await pedido.update({ total: +total.toFixed(2) }, { transaction: t });

    await t.commit();

    const actualizado = await Pedido.findByPk(pedido.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: PedidoItem, as: 'items', include: [{ model: Producto, as: 'producto' }] }
      ]
    });

    res.json(actualizado);
  } catch (err) { await t.rollback(); next(err); }
});

// DELETE /api/pedidos/:id
router.delete('/pedidos/:id', async (req, res, next) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    await pedido.destroy(); // CASCADE borra items
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
