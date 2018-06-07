'use strict';

module.exports = function (sequelize, DataTypes) {
    var User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        username: DataTypes.STRING(32),
        password: DataTypes.STRING(32),
        scope: DataTypes.STRING(255),
        type: DataTypes.JSONB
    }, {
        tableName: 'users', // oauth_users
        timestamps: false,
        underscored: true,
    });
    return User;
};

