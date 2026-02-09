var express = require('express');
var router = express.Router();
var db = require('../models');
var createError = require('http-errors');
var Op = db.Sequelize.Op;

/** GET /loans - list loans (filter: all | overdue | active), search across loan + book + patron */
var listLoans = async function (req, res, next) {
  try {
    const { filter = 'all', search, page = 1 } = req.query;
    const limit = 10;
    const offset = (Number(page) - 1) * limit;
    const seq = db.sequelize;
    const where = {};
    if (filter === 'overdue') {
      where.returned_on = null;
      where.return_by = { [Op.lt]: new Date() };
    } else if (filter === 'active') {
      where.returned_on = null;
    }
    if (search && search.trim()) {
      const term = search.trim();
      const orConditions = [
        seq.where(seq.cast(seq.col('loaned_on'), 'TEXT'), { [Op.like]: '%' + term + '%' }),
        seq.where(seq.cast(seq.col('return_by'), 'TEXT'), { [Op.like]: '%' + term + '%' }),
        seq.where(seq.cast(seq.col('returned_on'), 'TEXT'), { [Op.like]: '%' + term + '%' }),
        { '$Book.title$': { [Op.like]: '%' + term + '%' } },
        { '$Patron.first_name$': { [Op.like]: '%' + term + '%' } },
        { '$Patron.last_name$': { [Op.like]: '%' + term + '%' } },
        { '$Patron.email$': { [Op.like]: '%' + term + '%' } },
        { '$Patron.address$': { [Op.like]: '%' + term + '%' } },
        { '$Patron.library_id$': { [Op.like]: '%' + term + '%' } }
      ];
      const idNum = parseInt(term, 10);
      if (!isNaN(idNum) && String(idNum) === term) {
        orConditions.push({ book_id: idNum }, { patron_id: idNum });
      }
      where[Op.or] = orConditions;
    }
    const include = [
      { model: db.Book, as: 'Book', attributes: ['id', 'title'], required: !!where[Op.or] },
      { model: db.Patron, as: 'Patron', attributes: ['id', 'first_name', 'last_name', 'email', 'library_id'], required: !!where[Op.or] }
    ];
    const { count, rows: loans } = await db.Loan.findAndCountAll({
      where,
      limit,
      offset,
      order: [['loaned_on', 'DESC']],
      include,
      distinct: true
    });
    const totalPages = Math.ceil(count / limit) || 1;
    if (!filter || filter === 'all') {
      res.render(`loans/all_loans`, {
        loans,
        filter: 'all',
        search: search || '',
        page: Number(page),
        totalPages,
        count
      });
    } else if (filter === 'overdue') {
      res.render(`loans/overdue_loans`, {
        loans,
        filter: 'overdue',
        search: search || '',
        page: Number(page),
        totalPages,
        count
      });
    } else if (filter === 'active') {
      res.render(`loans/active_loans`, {
        loans,
        filter: 'active',
        search: search || '',
        page: Number(page),
        totalPages,
        count
      });
    }
  } catch (err) {
    next(err);
  }
};
router.get('/', listLoans);
router.get('', listLoans);

/** GET /loans/new - new loan form */
router.get('/new', async function (req, res, next) {
  try {
    const [books, patrons] = await Promise.all([
      db.Book.findAll({ order: [['title', 'ASC']] }),
      db.Patron.findAll({ order: [['last_name', 'ASC'], ['first_name', 'ASC']] })
    ]);
    const today = new Date();
    const returnBy = new Date(today);
    returnBy.setDate(returnBy.getDate() + 7);
    const loan = {
      loaned_on: today.toISOString().slice(0, 10),
      return_by: returnBy.toISOString().slice(0, 10)
    };
    res.render('loans/new_loan', { loan, books, patrons, errors: [] });
  } catch (err) {
    next(err);
  }
});

/** POST /loans - create loan */
router.post('/', async function (req, res, next) {
  try {
    await db.Loan.create({
      book_id: req.body.book_id ? parseInt(req.body.book_id, 10) : null,
      patron_id: req.body.patron_id ? parseInt(req.body.patron_id, 10) : null,
      loaned_on: req.body.loaned_on || null,
      return_by: req.body.return_by || null
    });
    res.redirect('/loans');
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message);
      const [books, patrons] = await Promise.all([
        db.Book.findAll({ order: [['title', 'ASC']] }),
        db.Patron.findAll({ order: [['last_name', 'ASC'], ['first_name', 'ASC']] })
      ]).catch(() => [[], []]);
      return res.status(422).render('loans/new_loan', {
        loan: req.body,
        books: books || [],
        patrons: patrons || [],
        errors
      });
    }
    next(err);
  }
});

/** GET /loans/overdue - overdue loans (must be before /:id) */
router.get('/overdue', async function (req, res, next) {
  req.query.filter = 'overdue';
  return listLoans(req, res, next);
});

/** GET /loans/active - active/current loans (must be before /:id) */
router.get('/active', async function (req, res, next) {
  req.query.filter = 'active';
  return listLoans(req, res, next);
});

/** GET /loans/:id - show one loan */
router.get('/:id', async function (req, res, next) {
  try {
    const loan = await db.Loan.findByPk(req.params.id, {
      include: [
        { model: db.Book, as: 'Book' },
        { model: db.Patron, as: 'Patron' }
      ]
    });
    if (!loan) return next(createError(404, 'Loan not found'));
    res.render('loans/show', { loan });
  } catch (err) {
    next(err);
  }
});

/** GET /loans/:id/edit - edit loan form */
router.get('/:id/edit', async function (req, res, next) {
  try {
    const loan = await db.Loan.findByPk(req.params.id, {
      include: [
        { model: db.Book, as: 'Book' },
        { model: db.Patron, as: 'Patron' }
      ]
    });
    if (!loan) return next(createError(404, 'Loan not found'));
    res.render('loans/update_loan', { loan, errors: [] });
  } catch (err) {
    next(err);
  }
});

/** Update loan handler (shared by PUT and POST) */
var updateLoan = async function (req, res, next) {
  try {
    const loan = await db.Loan.findByPk(req.params.id);
    if (!loan) return next(createError(404, 'Loan not found'));
    await loan.update({
      loaned_on: req.body.loaned_on || loan.loaned_on,
      return_by: req.body.return_by || loan.return_by,
      returned_on: req.body.returned_on && req.body.returned_on.trim() !== '' ? req.body.returned_on : null
    }, { validate: true });
    res.redirect('/loans');
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message);
      const loanWithBody = await db.Loan.findByPk(req.params.id, {
        include: [
          { model: db.Book, as: 'Book' },
          { model: db.Patron, as: 'Patron' }
        ]
      });
      const loanData = { ...loanWithBody.toJSON(), ...req.body };
      return res.status(422).render('loans/update_loan', {
        loan: loanData,
        errors
      });
    }
    next(err);
  }
};

router.put('/:id', updateLoan);
router.post('/:id', updateLoan);

/** GET /loans/:id/return - return book form */
router.get('/:id/return', async function (req, res, next) {
  try {
    const loan = await db.Loan.findByPk(req.params.id, {
      include: [
        { model: db.Book, as: 'Book' },
        { model: db.Patron, as: 'Patron' }
      ]
    });
    if (!loan) return next(createError(404, 'Loan not found'));
    res.render('loans/return_book', { loan, errors: [] });
  } catch (err) {
    next(err);
  }
});

/** Return book handler (shared by PUT and POST) */
var returnBook = async function (req, res, next) {
  try {
    const loan = await db.Loan.findByPk(req.params.id);
    if (!loan) return next(createError(404, 'Loan not found'));
    const returnedOn = req.body.returned_on && req.body.returned_on.trim() !== '' ? req.body.returned_on : new Date().toISOString().slice(0, 10);
    await loan.update({ returned_on: returnedOn }, { validate: true });
    res.redirect('/loans');
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message);
      const loanWithAssoc = await db.Loan.findByPk(req.params.id, {
        include: [
          { model: db.Book, as: 'Book' },
          { model: db.Patron, as: 'Patron' }
        ]
      });
      return res.status(422).render('loans/return_book', {
        loan: loanWithAssoc,
        errors
      });
    }
    next(err);
  }
};

router.put('/:id/return', returnBook);
router.post('/:id/return', returnBook);

module.exports = router;
