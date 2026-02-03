var express = require('express');
var router = express.Router();
var db = require('../models');
var createError = require('http-errors');

/** GET /patrons - list all patrons (match both '' and '/' when mounted at /patrons) */
var listPatrons = async function (req, res, next) {
  try {
    const { search, page = 1 } = req.query;
    const limit = 10;
    const offset = (Number(page) - 1) * limit;
    const where = {};
    if (search && search.trim()) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { first_name: { [Op.like]: '%' + search.trim() + '%' } },
        { last_name: { [Op.like]: '%' + search.trim() + '%' } },
        { email: { [Op.like]: '%' + search.trim() + '%' } },
        { address: { [Op.like]: '%' + search.trim() + '%' } }
      ];
    }
    const { count, rows: patrons } = await db.Patron.findAndCountAll({
      where,
      limit,
      offset,
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });
    const totalPages = Math.ceil(count / limit) || 1;
    res.render('patrons/index', {
      patrons,
      search: search || '',
      page: Number(page),
      totalPages,
      count
    });
  } catch (err) {
    next(err);
  }
};
router.get('/', listPatrons);
router.get('', listPatrons);

/** GET /patrons/new - new patron form (must be before /:id) */
router.get('/new', function (req, res) {
  res.render('patrons/new', { patron: {}, errors: [] });
});

/** POST /patrons - create patron */
router.post('/', async function (req, res, next) {
  try {
    await db.Patron.create({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      address: req.body.address,
      email: req.body.email,
      library_id: req.body.library_id ? parseInt(req.body.library_id, 10) : null,
      zip_code: req.body.zip_code ? parseInt(req.body.zip_code, 10) : null
    });
    res.redirect('/patrons');
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message);
      return res.status(422).render('patrons/new', {
        patron: req.body,
        errors
      });
    }
    next(err);
  }
});

/** GET /patrons/:id - show one patron */
router.get('/:id', async function (req, res, next) {
  try {
    const patron = await db.Patron.findByPk(req.params.id);
    if (!patron) return next(createError(404, 'Patron not found'));
    res.render('patrons/show', { patron });
  } catch (err) {
    next(err);
  }
});

/** GET /patrons/:id/edit - edit patron form */
router.get('/:id/edit', async function (req, res, next) {
  try {
    const patron = await db.Patron.findByPk(req.params.id);
    if (!patron) return next(createError(404, 'Patron not found'));
    res.render('patrons/edit', { patron, errors: [] });
  } catch (err) {
    next(err);
  }
});

/** PUT /patrons/:id - update patron */
router.put('/:id', async function (req, res, next) {
  try {
    const patron = await db.Patron.findByPk(req.params.id);
    if (!patron) return next(createError(404, 'Patron not found'));
    await patron.update({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      address: req.body.address,
      email: req.body.email,
      library_id: req.body.library_id ? parseInt(req.body.library_id, 10) : patron.library_id,
      zip_code: req.body.zip_code ? parseInt(req.body.zip_code, 10) : null
    });
    res.redirect('/patrons');
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message);
      const patron = await db.Patron.findByPk(req.params.id);
      return res.status(422).render('patrons/edit', {
        patron: { ...patron.toJSON(), ...req.body },
        errors
      });
    }
    next(err);
  }
});

module.exports = router;
