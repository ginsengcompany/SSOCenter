/**
 * Created by Manjesh on 14-05-2016.
 */

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
