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
      const Op = db.Sequelize.Op;
      const seq = db.sequelize;
      const term = search.trim();
      where[Op.or] = [
        { first_name: { [Op.like]: '%' + term + '%' } },
        { last_name: { [Op.like]: '%' + term + '%' } },
        { email: { [Op.like]: '%' + term + '%' } },
        { address: { [Op.like]: '%' + term + '%' } },
        seq.where(seq.cast(seq.col('library_id'), 'TEXT'), { [Op.like]: '%' + term + '%' }),
        seq.where(seq.cast(seq.col('zip_code'), 'TEXT'), { [Op.like]: '%' + term + '%' })
      ];
    }
    const { count, rows: patrons } = await db.Patron.findAndCountAll({
      where,
      limit,
      offset,
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });
    const totalPages = Math.ceil(count / limit) || 1;
    res.render('patrons/all_patrons', {
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
router.get('/new', async function (req, res, next) {
  try {
    const max = await db.Patron.max('library_id');
    const patron = { library_id: (max == null ? 0 : max) + 1 };
    res.render('patrons/new_patron', { patron, errors: [] });
  } catch (err) {
    next(err);
  }
});

/** POST /patrons - create patron */
router.post('/', async function (req, res, next) {
  try {
    let libraryId = req.body.library_id ? parseInt(req.body.library_id, 10) : null;
    if (libraryId == null || isNaN(libraryId)) {
      const max = await db.Patron.max('library_id');
      libraryId = (max == null ? 0 : max) + 1;
    }
    await db.Patron.create({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      address: req.body.address,
      email: req.body.email,
      library_id: libraryId,
      zip_code: req.body.zip_code ? parseInt(req.body.zip_code, 10) : null
    });
    res.redirect('/patrons');
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message);
      return res.status(422).render('patrons/new_patron', {
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

/** GET /patrons/:id/edit - edit patron form with loan history */
router.get('/:id/edit', async function (req, res, next) {
  try {
    const patron = await db.Patron.findByPk(req.params.id, {
      include: [
        { model: db.Loan, as: 'loans', include: [{ model: db.Book, as: 'Book', attributes: ['id', 'title'] }] }
      ]
    });
    if (!patron) return next(createError(404, 'Patron not found'));
    const loans = (patron.loans || []).sort((a, b) => new Date(b.loaned_on) - new Date(a.loaned_on));
    res.render('patrons/update_patron', { patron, loans, errors: [] });
  } catch (err) {
    next(err);
  }
});

/** Update patron handler (shared by PUT and POST) */
var updatePatron = async function (req, res, next) {
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
    }, { validate: true });
    res.redirect('/patrons');
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message);
      const patronWithLoans = await db.Patron.findByPk(req.params.id, {
        include: [
          { model: db.Loan, as: 'loans', include: [{ model: db.Book, as: 'Book', attributes: ['id', 'title'] }] }
        ]
      });
      const patronData = { ...patronWithLoans.toJSON(), ...req.body };
      const loans = (patronWithLoans.loans || []).sort((a, b) => new Date(b.loaned_on) - new Date(a.loaned_on));
      return res.status(422).render('patrons/update_patron', {
        patron: patronData,
        loans,
        errors
      });
    }
    next(err);
  }
};

router.put('/:id', updatePatron);
router.post('/:id', updatePatron);

module.exports = router;
