'use strict';

const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nome é obrigatório'
        },
        len: {
          args: [2, 100],
          msg: 'Nome deve ter entre 2 e 100 caracteres'
        }
      }
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: {
        msg: 'Este email já está em uso'
      },
      validate: {
        isEmail: {
          msg: 'Email deve ter um formato válido'
        },
        notEmpty: {
          msg: 'Email é obrigatório'
        }
      }
    },
    senha: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Senha é obrigatória'
        },
        len: {
          args: [6, 255],
          msg: 'Senha deve ter pelo menos 6 caracteres'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'vendedor'),
      allowNull: false,
      defaultValue: 'vendedor',
      validate: {
        isIn: {
          args: [['admin', 'vendedor']],
          msg: 'Role deve ser admin ou vendedor'
        }
      }
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    ultimo_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.senha) {
          user.senha = await bcrypt.hash(user.senha, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('senha')) {
          user.senha = await bcrypt.hash(user.senha, 12);
        }
      }
    },
    defaultScope: {
      attributes: { exclude: ['senha'] }
    },
    scopes: {
      withPassword: {
        attributes: { include: ['senha'] }
      },
      active: {
        where: { ativo: true }
      },
      admins: {
        where: { role: 'admin' }
      },
      vendedores: {
        where: { role: 'vendedor' }
      }
    }
  });

  // Métodos de instância
  User.prototype.verificarSenha = async function(senha) {
    return await bcrypt.compare(senha, this.senha);
  };

  User.prototype.isAdmin = function() {
    return this.role === 'admin';
  };

  User.prototype.isVendedor = function() {
    return this.role === 'vendedor';
  };

  User.prototype.atualizarUltimoLogin = async function() {
    this.ultimo_login = new Date();
    await this.save();
  };

  // Métodos estáticos
  User.findByEmail = async function(email) {
    return await this.scope('withPassword').findOne({
      where: { email: email.toLowerCase() }
    });
  };

  User.findActiveUsers = async function() {
    return await this.scope('active').findAll();
  };

  // Associações
  User.associate = function(models) {
    // Aqui podem ser adicionadas associações futuras
    // Por exemplo: User.hasMany(models.Orcamento, { foreignKey: 'user_id' });
  };

  return User;
};