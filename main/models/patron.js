'use strict';

module.exports = (sequelize, DataTypes) => {
  const Patron = sequelize.define('Patron', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    first_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'First name is required'
        },
        notEmpty: {
          msg: 'First name cannot be empty'
        }
      }
    },
    last_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Last name is required'
        },
        notEmpty: {
          msg: 'Last name cannot be empty'
        }
      }
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Address is required'
        },
        notEmpty: {
          msg: 'Address cannot be empty'
        }
      }
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Email is required'
        },
        notEmpty: {
          msg: 'Email cannot be empty'
        },
        isEmail: {
          msg: 'Please provide a valid email address'
        }
      }
    },
    library_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: 'Library ID is required'
        }
      }
    },
    zip_code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Zip code is required'
        },
        isInt: {
          msg: 'Zip code must be an integer'
        }
      }
    }
  }, {
    tableName: 'patrons',
    timestamps: false
  });

  Patron.associate = function(models) {
    Patron.hasMany(models.Loan, { foreignKey: 'patron_id', as: 'loans' });
  };

  return Patron;
};
