'use strict';

module.exports = function AppModel(sequelize, DataTypes) {
    const OAuthClient = sequelize.define('OAuthClient', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        //name: DataTypes.STRING(255),
        client_id: DataTypes.STRING(80),
        client_secret: DataTypes.STRING(80),
        redirect_uri: DataTypes.STRING(2000),
        grant_types: DataTypes.JSONB,
        scope: DataTypes.STRING,
    }, {
        tableName: 'oauth_clients',
        timestamps: false,
        underscored: true,
    });
    return OAuthClient;
};
