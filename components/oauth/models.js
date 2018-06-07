var _ = require('lodash');
var sqldb = require('./sqldb');
var User = sqldb.User;
var OAuthClient = sqldb.OAuthClient;
var OAuthAccessToken = sqldb.OAuthAccessToken;
var OAuthAuthorizationCode = sqldb.OAuthAuthorizationCode;
var OAuthRefreshToken = sqldb.OAuthRefreshToken;
let request = require('request');

function getAccessToken(bearerToken) {
    console.log("getAccessToken", bearerToken);
    return OAuthAccessToken
        .findOne({
            where: {access_token: bearerToken},
            attributes: [['access_token', 'accessToken'], ['expires', 'accessTokenExpiresAt'], 'scope'],
            include: [
                {
                    model: User,
                    attributes: ['id', 'username'],
                }, OAuthClient
            ],
        }).then(function (accessToken) {
            if (!accessToken) return false;
            var token = accessToken.toJSON();
            token.user = token.User;
            token.client = token.OAuthClient;
            token.scope = token.scope;
            return token;
        }).catch(function (err) {
            console.log("getAccessToken - Err: ")
        });
}

function getClient(clientId, clientSecret) {
    const options = {
        where: {client_id: clientId},
        attributes: ['id', 'client_id', 'redirect_uri', 'scope'],
    };
    if (clientSecret) options.where.client_secret = clientSecret;

    return sqldb.OAuthClient
        .findOne(options)
        .then(function (client) {
            if (!client) return new Error("client not found");
            var clientWithGrants = client.toJSON()
            clientWithGrants.grants = ['authorization_code', 'password', 'refresh_token', 'client_credentials']
            // Todo: need to create another table for redirect URIs
            clientWithGrants.redirectUris = [clientWithGrants.redirect_uri]
            delete clientWithGrants.redirect_uri
            //clientWithGrants.refreshTokenLifetime = integer optional
            //clientWithGrants.accessTokenLifetime  = integer optional
            return clientWithGrants
        }).catch(function (err) {
            console.log("getClient - Err: ", err)
        });
}


function getUser(username, password) {
    return User
        .findOne({
            where: {username: username},
            attributes: ['id', 'username', 'password', 'scope'],
        })
        .then(function (user) {
            return user.password === password ? user.toJSON() : false;
        })
        .catch(function (err) {
            console.log("getUser - Err: ", err)
        });
}

function revokeAuthorizationCode(code) {
    return OAuthAuthorizationCode.findOne({
        where: {
            authorization_code: code.code
        }
    }).then(function (rCode) {
        //if(rCode) rCode.destroy();
        /***
         * As per the discussion we need set older date
         * revokeToken will expected return a boolean in future version
         * https://github.com/oauthjs/node-oauth2-server/pull/274
         * https://github.com/oauthjs/node-oauth2-server/issues/290
         */
        var expiredCode = code
        expiredCode.expiresAt = new Date('2015-05-28T06:59:53.000Z')
        return expiredCode
    }).catch(function (err) {
        console.log("getUser - Err: ", err)
    });
}

function revokeToken(token) {
    return OAuthRefreshToken.findOne({
        where: {
            refresh_token: token.refreshToken
        }
    }).then(function (rT) {
        if (rT) rT.destroy();
        /***
         * As per the discussion we need set older date
         * revokeToken will expected return a boolean in future version
         * https://github.com/oauthjs/node-oauth2-server/pull/274
         * https://github.com/oauthjs/node-oauth2-server/issues/290
         */
        var expiredToken = token
        expiredToken.refreshTokenExpiresAt = new Date('2015-05-28T06:59:53.000Z')
        return expiredToken
    }).catch(function (err) {
        console.log("revokeToken - Err: ", err)
    });
}


function saveToken(token, client, user) {
    return Promise.all([
        OAuthAccessToken.create({
            access_token: token.accessToken,
            expires: token.accessTokenExpiresAt,
            client_id: client.id,
            user_id: user.id,
            scope: token.scope
        }),
        token.refreshToken ? OAuthRefreshToken.create({ // no refresh token for client_credentials
            refresh_token: token.refreshToken,
            expires: token.refreshTokenExpiresAt,
            client_id: client.id,
            user_id: user.id,
            scope: token.scope
        }) : [],

    ])
        .then(function (resultsArray) {
            return _.assign(  // expected to return client and user, but not returning
                {
                    client: client,
                    user: user,
                    access_token: token.accessToken, // proxy
                    refresh_token: token.refreshToken, // proxy
                },
                token
            )
        })
        .catch(function (err) {
            console.log("revokeToken - Err: ", err)
        });
}

function getAuthorizationCode(code) {
    return OAuthAuthorizationCode
        .findOne({
            attributes: ['client_id', 'expires', 'user_id', 'scope'],
            where: {authorization_code: code},
            include: [User, OAuthClient]
        })
        .then(function (authCodeModel) {
            if (!authCodeModel) return false;
            var client = authCodeModel.OAuthClient.toJSON()
            var user = authCodeModel.User.toJSON()
            return reCode = {
                code: code,
                client: client,
                expiresAt: authCodeModel.expires,
                redirectUri: client.redirect_uri,
                user: user,
                scope: authCodeModel.scope,
            };
        }).catch(function (err) {
            console.log("getAuthorizationCode - Err: ", err)
        });
}

function saveAuthorizationCode(code, client, user) {
    return OAuthAuthorizationCode
        .create({
            expires: code.expiresAt,
            client_id: client.id,
            authorization_code: code.authorizationCode,
            user_id: user.id,
            scope: code.scope
        })
        .then(function () {
            code.code = code.authorizationCode
            return code
        }).catch(function (err) {
            console.log("saveAuthorizationCode - Err: ", err)
        });
}

function getUserFromClient(client) {
    var options = {
        where: {client_id: client.client_id},
        include: [User],
        attributes: ['id', 'client_id', 'redirect_uri'],
    };
    if (client.client_secret) options.where.client_secret = client.client_secret;

    return OAuthClient
        .findOne(options)
        .then(function (client) {
            if (!client) return false;
            if (!client.User) return false;
            return client.User.toJSON();
        }).catch(function (err) {
            console.log("getUserFromClient - Err: ", err)
        });
}

function getRefreshToken(refreshToken) {
    if (!refreshToken || refreshToken === 'undefined') return false

    return OAuthRefreshToken
        .findOne({
            attributes: ['client_id', 'user_id', 'expires'],
            where: {refresh_token: refreshToken},
            include: [OAuthClient, User]

        })
        .then(function (savedRT) {
            var tokenTemp = {
                user: savedRT ? savedRT.User.toJSON() : {},
                client: savedRT ? savedRT.OAuthClient.toJSON() : {},
                refreshTokenExpiresAt: savedRT ? new Date(savedRT.expires) : null,
                refreshToken: refreshToken,
                refresh_token: refreshToken,
                scope: savedRT.scope
            };
            return tokenTemp;

        }).catch(function (err) {
            console.log("getRefreshToken - Err: ", err)
        });
}

function validateScope(token, client, scope) {
    //return true;
    return (token.scope === scope && client.scope === scope && scope !== null) ? scope : false;
}

function verifyScope(token, scope) {
    return token.scope === scope
}

function login(req, res) {
    return User.findOne({
        where: {username: req.body.username, password: req.body.password},
        attributes: ['id', 'username', 'password', 'scope', 'type'],
    }).then(function (user) {
        var userJson = user.toJSON();
        if (userJson.type.role === 'admin') {
            console.log(userJson);
            request({
                method: 'POST',
                uri: 'http://localhost:3000/oauth/token',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ZGVtb2NsaWVudDpkZW1vY2xpZW50c2VjcmV0'
                },
                form: {grant_type: 'password', username: userJson.username, password: userJson.password, scope:'admin'},
                json: true
            }, function (err, response, body) {
                console.log(body);
                res.redirect(body.client.redirectUris[0] + "?access_token=" + body.access_token);
                res.end();
            });
        } else {
            res.render('error', {
                error: "Non hai i permessi!",
                message: "Non hai i permessi!"
            });
        }
    }).catch(function (err) {
        res.render('error', {
            error: "User o Pass errati!",
            message: "User o Pass errati!"
        });
    });
}

function getUsersInformations(req, res) {
    User.findAll({
        include: [{
            model: OAuthClient, as: 'Client',
            attributes: ['client_id'],
            through: {
                attributes: ['client_id', 'user_id'],
            }
        }]
    }).then(function (users) {
        var myJson = {
            "data": users
        };
        for (var i = 0; i < myJson.length; i++) {
            if (myJson.data[i].type.role === 'admin') {
                myJson.data.splice(i, 1);
            }
        }
        return res.json(myJson);
    }).catch(function (err) {
        var myJson = {
            "data": err.message
        };
        return res.json(myJson);
    });
}


function filterUsersByID(req, res) {
    OAuthClient.findAll({
        where: {
            id: req.body.id
        },
        attributes: ['client_id'],
        include: [{
            model: User, as: 'Utenti',
            attributes: ['id', 'username'],
            through: {
                attributes: ['client_id', 'user_id'],
            }
        }]
    }).then(client => {
        var arrayUtenti = [];
        client[0].Utenti.forEach(el => {
            arrayUtenti.push(el.id);
        });
        //console.log(client);
        //var myJson = {
        //    "data": users[0].Utenti
        //};
        //console.log(users);
        //return res.json(myJson);
        var option = '';
        if(arrayUtenti.length !== 0) {
            option = {
                where: {
                    id: {
                        $notIn: arrayUtenti
                    }
                },
                attributes: ['id', 'username']
            }
        }else
            option = {};
        User.findAll(
            option
        ).then(utenti => {
            var myJson = {
                "data": utenti
            };
            return res.json(myJson);
            })
    }).catch(function (err) {
        var myJson = {
            "data": err.message
        };
        return res.json(myJson);
    });
}

function associaClientUser(req,res) {
    OAuthClient.findOne({
        where: {
            id: req.body.client_Id.id
        }
    }).then(client => {
        User.findAll({
            where: {
                id: req.body.userId
            }
        }).then(users => {
            client.addUtenti(users);
            return res.json({errore: false});
        }).catch(function () {
            return res.json({errore: true});
        });
    });
}

//User.findAll({
//    //attributes: ['client_id'],
//    where: {
//        id: {
//            $or: {
//                $ne: req.body.id,
//                $eq: null
//            }
//        }
//    },
//    include: [
//        {
//            model: OAuthClient
//        }
//    ],
//    //through: {
//    //    attributes: ['client_id', 'user_id'],
//    //}
//}).then(function (users) {
//    //console.log(users);
//    var myJson = {
//        "data": users
//    };
//    return res.json(myJson);
//}).catch(function (err) {
//    var myJson = {
//        "data": err.message
//    };
//    return res.json(myJson);
//});
//User.create({
//    username: "prova",
//    password: "admin",
//    type: {"role": "admin", "organization":"admin"}
//}).then(user => {
//    let users = [user];
//})

//var utente = "";
//User.find({
//    where: {id: "1"}
//}).then(user =>{
//    utente = user;
//});
//OAuthClient.create({
//    client_id: 'prova',
//    client_secret: 'prova_secret',
//    redirect_uri: "http://",
//    grant_types: ["password"]
//}).then(client => {
//    users = {
//        username:"prova",
//        password:"admin",
//        type: {"role": "admin", "organization":"admin"}
//    };
//    client.setUtenti(utente);
//})

function getClientInformations(req, res) {
    OAuthClient.findAll({}).then(function (client) {
        var myJson = {
            "data": client
        };
        return res.json(myJson);
    }).catch(function (err) {
        var myJson = {
            "data": err.message
        };
        return res.json(myJson);
    });
}

function deleteUser(id, res) {
    User.destroy({
        where: {
            id: id,
        }
    }).then(function () {
        return res.json({errore: false});
    }).catch(function () {
        return res.json({errore: true});
    });
}

function deleteClient(req, res) {
    OAuthClient.destroy({
        where: {
            id: req.body.id
        }
    }).then(function () {
        return res.json({errore: false});
    }).catch(function (err) {
        return res.json({errore: true});
    });
}

function updateUser(req, res) {
    User.update({
            username: req.body.username,
            password: req.body.password,
            client: req.body.client,
            type: {
                organization: req.body.type.organization,
                role: req.body.type.role
            }
        },
        {
            where: {
                id: req.body.id
            }
        }).then(function (user) {
        return res.json({errore: false});
    }).catch(function (err) {
        return res.json({errore: true});
    });
}

function updateClient(req, res) {
    arrayGrants = [];
    var arr = 0;
    var dim = 0;
    if (Array.isArray(req.body.grant_types)) {
        dim = req.body.grant_types.length;
        for (var i = 0; i < dim; i++) {
            if (req.body.grant_types[i] === 'password')
                arrayGrants[arr] = 'password';
            if (req.body.grant_types[i] === 'authorization_code')
                arrayGrants[arr] = 'authorization_code';
            if (req.body.grant_types[i] === 'refresh_token')
                arrayGrants[arr] = 'refresh_token';
            if (req.body.grant_types[i] === 'client_credentials')
                arrayGrants[arr] = 'client_credentials';
            arr = arr + 1;
        }
    }
    else {
        arrayGrants[0] = req.body.grant_types;
    }
    OAuthClient.update({
            client_id: req.body.client_id,
            client_secret: req.body.client_secret,
            redirect_uri: req.body.redirect_uri,
            grant_types: arrayGrants
        },
        {
            where: {
                id: req.body.id
            }
        }).then(function (client) {
        return res.json({errore: false});
    }).catch(function (err) {
        return res.json({errore: true});
    });
}

function addNewUser(req, res) {
    return User.findOrCreate({
        where: {
            username: req.body.materialFormRegisterUsername,
            password: req.body.materialFormRegisterPassword,
            scope: req.body.materialFormScope,
            type: {
                organization: req.body.materialFormRegisterOrganization,
                role: req.body.materialFormRegisterRole
            }
        }
    }).spread((user, created) => {
        console.log(user.get({
            plain: true
        }));
        console.log(created);
        if (created)
            res.redirect(req.headers.referer + '&esito=true');
        else
            res.redirect(req.headers.referer + '&esito=false');
    })
        .catch(function (err) {
            res.redirect(req.headers.referer + '&esito=false');
        });
}

function addNewClient(req, res, user) {
    arrayGrants = [];
    var arr = 0;
    var dim = 0;
    if (Array.isArray(req.body.grant_types)) {
        dim = req.body.grant_types.length;
        for (var i = 0; i < dim; i++) {
            if (req.body.grant_types[i] === 'password')
                arrayGrants[arr] = 'password';
            if (req.body.grant_types[i] === 'authorization_code')
                arrayGrants[arr] = 'authorization_code';
            if (req.body.grant_types[i] === 'refresh_token')
                arrayGrants[arr] = 'refresh_token';
            if (req.body.grant_types[i] === 'client_credentials')
                arrayGrants[arr] = 'client_credentials';
            arr = arr + 1;
        }
    }
    else {
        arrayGrants[0] = req.body.grant_types;
    }
    return OAuthClient.findOrCreate({
        where: {
            client_id: req.body.client_id,
            client_secret: req.body.client_secret,
            redirect_uri: req.body.redirect_uri,
            grant_types: arrayGrants,
        }
    }).spread((oauthclient, created) => {
        console.log(oauthclient.get({
            plain: true
        }));
        console.log(created);
        if (created)
            return res.json({errore: false});
        else
            return res.json({errore: true});
    }).catch(function (err) {
        return res.json({errore: true});
    });
}


module.exports = {
    //generateOAuthAccessToken, optional - used for jwt
    //generateAuthorizationCode, optional
    //generateOAuthRefreshToken, - optional
    getAccessToken: getAccessToken,
    getAuthorizationCode: getAuthorizationCode, //getOAuthAuthorizationCode renamed to,
    getClient: getClient,
    getRefreshToken: getRefreshToken,
    getUser: getUser,
    getUserFromClient: getUserFromClient,
    //grantTypeAllowed, Removed in oauth2-server 3.0
    revokeAuthorizationCode: revokeAuthorizationCode,
    revokeToken: revokeToken,
    saveToken: saveToken,//saveOAuthAccessToken, renamed to
    saveAuthorizationCode: saveAuthorizationCode, //renamed saveOAuthAuthorizationCode,
    validateScope: validateScope,
    verifyScope: verifyScope,
    login: login,
    getUsersInformations: getUsersInformations,
    addNewUser: addNewUser,
    deleteUser: deleteUser,
    updateUser: updateUser,
    addNewClient: addNewClient,
    getClientInformations: getClientInformations,
    updateClient: updateClient,
    deleteClient: deleteClient,
    filterUsersByID: filterUsersByID,
    associaClientUser: associaClientUser
}

