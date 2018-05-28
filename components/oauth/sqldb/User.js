/**
 * Created by Manjesh on 14-05-2016.
 */
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
        client_id: DataTypes.INTEGER,
        type: DataTypes.JSONB
    }, {
        tableName: 'users', // oauth_users
        timestamps: false,
        underscored: true,
    });
        User.associate = function associate(models) {
        User.belongsTo(models.OAuthClient, {
            foreignKey: 'client_id',
        });
    };
    return User;
};

