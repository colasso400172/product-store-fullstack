import { Router } from 'express';
import { Op, ValidationError } from 'sequelize';
import Producto from '../models/Producto.js';

const router = Router();

/**
 * GET /api/productos
 */
router.get('/productos', async (req, res, next) => {
  try {
    const { q = '', page = 1, pageSize = 20 } = req.query;

    const limit = Math.min(Number(pageSize) || 20, 100);
    const offset = ((Number(page) || 1) - 1) * limit;

    const where = q ? { nombre: { [Op.like]: `%${q}%` } } : {};

    const { rows, count } = await Producto.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'ASC']]
    });

    res.json({
      data: rows,
      pagination: { page: Number(page) || 1, pageSize: limit, total: count }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/productos/:id
 */
router.get('/productos/:id', async (req, res, next) => {
  try {
    const prod = await Producto.findByPk(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(prod);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/productos
 */
router.post('/productos', async (req, res, next) => {
  try {
    const { nombre, precio, stock, estado = 'DISPONIBLE' } = req.body;
    if (!nombre || precio == null || stock == null) {
      return res.status(400).json({ error: 'nombre, precio y stock son requeridos' });
    }
    const prod = await Producto.create({ nombre, precio, stock, estado });
    res.status(201).json(prod);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(422).json({ error: err.errors?.[0]?.message || 'Datos inválidos' });
    }
    next(err);
  }
});

/**
 * PUT /api/productos/:id
 */
router.put('/productos/:id', async (req, res, next) => {
  try {
    const { nombre, precio, stock, estado = 'DISPONIBLE' } = req.body;
    if (!nombre || precio == null || stock == null) {
      return res.status(400).json({ error: 'nombre, precio y stock son requeridos' });
    }
    const prod = await Producto.findByPk(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
    await prod.update({ nombre, precio, stock, estado });
    res.json(prod);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(422).json({ error: err.errors?.[0]?.message || 'Datos inválidos' });
    }
    next(err);
  }
});

/**
 * PATCH /api/productos/:id
 */
router.patch('/productos/:id', async (req, res, next) => {
  try {
    const prod = await Producto.findByPk(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
    await prod.update(req.body);
    res.json(prod);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(422).json({ error: err.errors?.[0]?.message || 'Datos inválidos' });
    }
    next(err);
  }
});

/**
 * DELETE /api/productos/:id
 */
router.delete('/productos/:id', async (req, res, next) => {
  try {
    const prod = await Producto.findByPk(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
    await prod.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
