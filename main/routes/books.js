var express = require('express');
var router = express.Router();
var db = require('../models');
var createError = require('http-errors');

/** GET /books - list all books (match both '' and '/' when mounted at /books) */
var listBooks = async function (req, res, next) {
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
        { title: { [Op.like]: '%' + term + '%' } },
        { author: { [Op.like]: '%' + term + '%' } },
        { genre: { [Op.like]: '%' + term + '%' } },
        seq.where(
          seq.cast(seq.col('first_published'), 'VARCHAR'),
          { [Op.like]: '%' + term + '%' }
        )
      ];
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

/** PUT /books/:id - update book */
router.put('/:id', async function (req, res, next) {
  try {
    const book = await db.Book.findByPk(req.params.id);
    if (!book) return next(createError(404, 'Book not found'));
    await book.update({
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      first_published: req.body.first_published ? parseInt(req.body.first_published, 10) : null
    });
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
});

module.exports = router;
