'use strict';

module.exports = (sequelize, DataTypes) => {
  const Loan = sequelize.define('Loan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Book is required'
        }
      }
    },
    patron_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Patron is required'
        }
      }
    },
    loaned_on: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Loaned on date is required'
        },
        isDate: {
          msg: 'Loaned on must be a valid date'
        }
      }
    },
    return_by: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Return by date is required'
        },
        isDate: {
          msg: 'Return by must be a valid date'
        }
      }
    },
    returned_on: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Returned on must be a valid date'
        }
      }
    }
  }, {
    tableName: 'loans',
    timestamps: false
  });

  Loan.associate = function(models) {
    Loan.belongsTo(models.Book, { foreignKey: 'book_id', as: 'Book' });
    Loan.belongsTo(models.Patron, { foreignKey: 'patron_id', as: 'Patron' });
  };

  return Loan;
};
