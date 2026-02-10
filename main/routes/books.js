const express = require('express');
const router = express.Router();
const db = require('../models');
const createError = require('http-errors');

/** GET /books - list all books (match both '' and '/' when mounted at /books) */
const listBooks = async function (req, res, next) {
  try {
    const { search, page = 1 } = req.query;
    const limit = 10;
    const offset = (Number(page) - 1) * limit;
    const where = {};
    if (search && search.trim()) {
      const Op = db.Sequelize.Op;
      const seq = db.sequelize;
      const term = search.trim();
      const orConditions = [
        { title: { [Op.like]: '%' + term + '%' } },
        { author: { [Op.like]: '%' + term + '%' } },
        { genre: { [Op.like]: '%' + term + '%' } }
      ];
      const yearNum = parseInt(term, 10);
      if (!isNaN(yearNum) && String(yearNum) === term) {
        orConditions.push({ first_published: yearNum });
      }
      orConditions.push(
        seq.where(
          seq.cast(seq.col('first_published'), 'TEXT'),
          { [Op.like]: '%' + term + '%' }
        )
      );
      where[Op.or] = orConditions;
    }
    const { count, rows: books } = await db.Book.findAndCountAll({
      where,
      limit,
      offset,
      order: [['title', 'ASC']]
    });
    const totalPages = Math.ceil(count / limit) || 1;
    res.render('books/all_books', {
      books,
      search: search || '',
      page: Number(page),
      totalPages,
      count
    });
  } catch (err) {
    next(err);
  }
};
router.get('/', listBooks);
router.get('', listBooks);

/** GET /books/new - new book form (must be before /:id so "new" isn't treated as id) */
router.get('/new', function (req, res) {
  res.render('books/new_book', { book: {}, errors: [] });
});

/** POST /books - create book */
router.post('/', async function (req, res, next) {
  try {
    const book = await db.Book.create({
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      first_published: req.body.first_published ? parseInt(req.body.first_published, 10) : null
    });
    res.redirect('/books');
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message);
      return res.status(422).render('books/new_book', {
        book: req.body,
        errors
      });
    }
    next(err);
  }
});

/** GET /books/:id - show one book */
router.get('/:id', async function (req, res, next) {
  try {
    const book = await db.Book.findByPk(req.params.id);
    if (!book) return next(createError(404, 'Book not found'));
    res.render('books/show', { book });
  } catch (err) {
    next(err);
  }
});

/** GET /books/:id/edit - edit book form */
router.get('/:id/edit', async function (req, res, next) {
  try {
    const book = await db.Book.findByPk(req.params.id);
    if (!book) return next(createError(404, 'Book not found'));
    res.render('books/update_book', { book, errors: [] });
  } catch (err) {
    next(err);
  }
});

/** Update book handler (shared by PUT and POST) */
var updateBook = async function (req, res, next) {
  try {
    const book = await db.Book.findByPk(req.params.id);
    if (!book) return next(createError(404, 'Book not found'));
    await book.update({
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      first_published: req.body.first_published ? parseInt(req.body.first_published, 10) : null
    }, { validate: true });
    res.redirect('/books');
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message);
      const book = await db.Book.findByPk(req.params.id);
      return res.status(422).render('books/update_book', {
        book: { ...book.toJSON(), ...req.body },
        errors
      });
    }
    next(err);
  }
};

router.put('/:id', updateBook);
router.post('/:id', updateBook);

module.exports = router;
