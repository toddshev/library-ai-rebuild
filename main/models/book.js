'use strict';

module.exports = (sequelize, DataTypes) => {
  const Book = sequelize.define('Book', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Title is required'
        },
        notEmpty: {
          msg: 'Title cannot be empty'
        }
      }
    },
    author: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Author is required'
        },
        notEmpty: {
          msg: 'Author cannot be empty'
        }
      }
    },
    genre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Genre is required'
        },
        notEmpty: {
          msg: 'Genre cannot be empty'
        }
      }
    },
    first_published: {
      type: DataTypes.INTEGER,
      validate: {
        min: {
          args: [0],
          msg: 'First published year must be greater than or equal to 0'
        },
        max: {
          args: [new Date().getFullYear()],
          msg: `First published year cannot be greater than ${new Date().getFullYear()}`
        }
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'books',
    timestamps: true
  });

  Book.associate = function(models) {
    Book.hasMany(models.Loan, { foreignKey: 'book_id', as: 'loans' });
  };

  return Book;
};
