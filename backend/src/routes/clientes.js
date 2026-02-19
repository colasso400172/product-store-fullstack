//endpoints
//Router: permite definir rutas
import { Router } from 'express';
import { Op, UniqueConstraintError, ValidationError } from 'sequelize';
import Cliente from '../models/Cliente.js';

const router = Router();

/**
 * GET /api/clientes
 * Opcionales:
 *   ?q=texto (filtra por nombre o email)
 *   ?page=1&pagesize=20 (paginación)
 */

//req: contiene información de la solicitud del cliente.
//res: sirve para enviar la respuesta al cliente.
//next: Función que llama al siguiente middleware o manejador de errores si existe.
router.get('/clientes', async (req, res, next) => {
  try {
    const { q = '', page = 1, pageSize = 20 } = req.query;

    const limit = Math.min(Number(pageSize) || 20, 100);
    const offset = ((Number(page) || 1) - 1) * limit;

    const where = q
      ? {
          [Op.or]: [
            { nombre: { [Op.like]: `%${q}%` } },
            { email: { [Op.like]: `%${q}%` } }
          ]
        }
      : {};

      //findAndCountAll: busca los resultados paginados y cuenta el total.
    const { rows, count } = await Cliente.findAndCountAll({
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
 * GET /api/clientes/:id
 */
router.get('/clientes/:id', async (req, res, next) => {
  try {
    const cli = await Cliente.findByPk(req.params.id);
    if (!cli) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cli);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/clientes
 * body: { nombre, email }
 */

//post: crear un nuevo cliente
router.post('/clientes', async (req, res, next) => {
  try {
    const { nombre, email } = req.body;
    if (!nombre || !email) {
      return res.status(400).json({ error: 'nombre y email son requeridos' });
    }
    const cli = await Cliente.create({ nombre, email });
    res.status(201).json(cli);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }
    if (err instanceof ValidationError) {
      return res.status(422).json({ error: err.errors?.[0]?.message || 'Datos inválidos' });
    }
    next(err);
  }
});

/**
 * PUT /api/clientes/:id
 * Reemplazo total
 */
router.put('/clientes/:id', async (req, res, next) => {
  try {
    const { nombre, email } = req.body;
    if (!nombre || !email) {
      return res.status(400).json({ error: 'nombre y email son requeridos' });
    }
    const cli = await Cliente.findByPk(req.params.id);
    if (!cli) return res.status(404).json({ error: 'Cliente no encontrado' });
    await cli.update({ nombre, email });
    res.json(cli);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }
    if (err instanceof ValidationError) {
      return res.status(422).json({ error: err.errors?.[0]?.message || 'Datos inválidos' });
    }
    next(err);
  }
});

/**
 * PATCH /api/clientes/:id
 * Actualización parcial
 */

//patch: Actualización parcial del cliente (solo los campos enviados).
router.patch('/clientes/:id', async (req, res, next) => {
  try {
    const cli = await Cliente.findByPk(req.params.id);
    if (!cli) return res.status(404).json({ error: 'Cliente no encontrado' });
    await cli.update(req.body);
    res.json(cli);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }
    if (err instanceof ValidationError) {
      return res.status(422).json({ error: err.errors?.[0]?.message || 'Datos inválidos' });
    }
    next(err);
  }
});

/**
 * DELETE /api/clientes/:id
 */
router.delete('/clientes/:id', async (req, res, next) => {
  try {
    const cli = await Cliente.findByPk(req.params.id);
    if (!cli) return res.status(404).json({ error: 'Cliente no encontrado' });
    await cli.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
