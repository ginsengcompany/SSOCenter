'use strict';

module.exports = function AppModel(sequelize, DataTypes) {
    const JoinUserClient = sequelize.define('JoinUserClient', {
    }, {
        tableName: 'utenti_client',
        timestamps: false,
        underscored: true,
    });
    return JoinUserClient;
};
