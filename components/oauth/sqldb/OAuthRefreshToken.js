'use strict';

module.exports = function RefreshTokenModel(sequelize, DataTypes) {
    const RefreshToken = sequelize.define('RefreshToken', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        refresh_token: DataTypes.STRING(256),
        expires: DataTypes.DATE,
        scope: DataTypes.STRING,
        //client_id: DataTypes.INTEGER,
        //user_id: DataTypes.INTEGER
    }, {
        tableName: 'oauth_refresh_tokens',
        timestamps: false,
        underscored: true,
    });
    RefreshToken.associate = function associate(models) {
                RefreshToken.belongsTo(models.OAuthClient, {
                    foreignKey: 'client_id',
                });

                RefreshToken.belongsTo(models.User, {
                    foreignKey: 'user_id',
                });
    };
    return RefreshToken;
};
