var _ = require('lodash');
var mongodb = require('./mongodb');
var User = mongodb.User;
var OAuthClient = mongodb.OAuthClient;
var OAuthAccessToken = mongodb.OAuthAccessToken;
var OAuthAuthorizationCode = mongodb.OAuthAuthorizationCode;
var OAuthRefreshToken = mongodb.OAuthRefreshToken;
let request = require('request');

function getAccessToken(bearerToken) {
    console.log("getAccessToken", bearerToken);
    return OAuthAccessToken
    //User,OAuthClient
        .findOne({access_token: bearerToken})
        .populate('User')
        .populate('OAuthClient')
        .then(function (accessToken) {
            console.log('at', accessToken)
            if (!accessToken) return false;
            var token = accessToken;
            token.user = token.User;
            token.client = token.OAuthClient;
            token.scope = token.scope;
            token.accessTokenExpiresAt = token.expires;
            return token;
        })
        .catch(function (err) {
            console.log("getAccessToken - Err: ")
        });
}

function getClient(clientId, clientSecret) {
    console.log("getClient", clientId, clientSecret)
    const options = {client_id: clientId};
    if (clientSecret) options.client_secret = clientSecret;

    return OAuthClient
        .findOne(options)
        .then(function (client) {
            if (!client) return new Error("client not found");
            var clientWithGrants = client
            clientWithGrants.grants = ['authorization_code', 'password', 'refresh_token', 'client_credentials'];
            // Todo: need to create another table for redirect URIs
            clientWithGrants.redirectUris = [clientWithGrants.redirect_uri];
            delete clientWithGrants.redirect_uri;
            //clientWithGrants.refreshTokenLifetime = integer optional
            //clientWithGrants.accessTokenLifetime  = integer optional
            return clientWithGrants
        }).catch(function (err) {
            console.log("getClient - Err: ", err)
        });
}


function getUser(username, password) {
    return User
        .findOne({username: username})
        .then(function (user) {
            console.log("u", user)
            return user.password === password ? user : false;
        })
        .catch(function (err) {
            console.log("getUser - Err: ", err)
        });
}

function revokeAuthorizationCode(code) {
    console.log("revokeAuthorizationCode", code)
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
    console.log("revokeToken", token)
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
        var expiredToken = token;
        expiredToken.refreshTokenExpiresAt = new Date('2015-05-28T06:59:53.000Z');
        return expiredToken
    }).catch(function (err) {
        console.log("revokeToken - Err: ", err)
    });
}


function saveToken(token, client, user) {
    console.log("saveToken", token, client, user);
    return Promise.all([
        OAuthAccessToken.create({
            access_token: token.accessToken,
            expires: token.accessTokenExpiresAt,
            OAuthClient: client._id,
            User: user._id,
            scope: token.scope
        }),
        token.refreshToken ? OAuthRefreshToken.create({ // no refresh token for client_credentials
            refresh_token: token.refreshToken,
            expires: token.accessTokenExpiresAt,
            OAuthClient: client._id,
            User: user._id,
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
    console.log("getAuthorizationCode", code)
    return OAuthAuthorizationCode
        .findOne({authorization_code: code})
        .populate('User')
        .populate('OAuthClient')
        .then(function (authCodeModel) {
            if (!authCodeModel) return false;
            var client = authCodeModel.OAuthClient;
            var user = authCodeModel.User;
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
    console.log("save " + code);
    return OAuthAuthorizationCode
        .create({
            expires: code.expiresAt,
            OAuthClient: client._id,
            authorization_code: code.authorizationCode,
            User: user._id,
            scope: code.scope
        })
        .then(function () {
            code.code = code.authorizationCode;
            return code
        }).catch(function (err) {
            console.log("saveAuthorizationCode - Err: ", err)
        });
}

function getUserFromClient(client) {
    console.log("getUserFromClient", client)
    var options = {client_id: client.client_id};
    if (client.client_secret) options.client_secret = client.client_secret;

    return OAuthClient
        .findOne(options)
        .populate('User')
        .then(function (client) {
            console.log(client);
            if (!client) return false;
            if (!client.User) return false;
            return client.User;
        }).catch(function (err) {
            console.log("getUserFromClient - Err: ", err)
        });
}

function getRefreshToken(refreshToken) {
    console.log("getRefreshToken", refreshToken);
    if (!refreshToken || refreshToken === 'undefined') return false
//[OAuthClient, User]
    return OAuthRefreshToken
        .findOne({refresh_token: refreshToken})
        .populate('User')
        .populate('OAuthClient')
        .then(function (savedRT) {
            console.log("srt", savedRT);
            var tokenTemp = {
                user: savedRT ? savedRT.User : {},
                client: savedRT ? savedRT.OAuthClient : {},
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
    return (token.scope === scope && client.scope === scope && scope !== null) ? scope : false
}

function verifyScope(token, scope) {
    return token.scope === scope
}

function login(req, res) {
    User.findOne({username: req.body.username, password: req.body.password}, function (err, user) {
        if (user) {
            if (user.type.role === 'admin') {
                request({
                    method: 'POST',
                    uri: 'http://localhost:3000/oauth/token',
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ZGVtb2NsaWVudDpkZW1vY2xpZW50c2VjcmV0'
                    },
                    form: {
                        grant_type: 'password',
                        username: req.body.username,
                        password: req.body.password,
                        scope: 'admin'
                    },
                    json: true
                }, function (err, response, body) {
                    res.redirect(body.client.redirect_uri + "?access_token=" + body.access_token);
                    res.end();
                });
            } else {
                res.status(401);
                res.render('error', {
                    error: "Non hai i permessi!",
                    message: "Non hai i permessi!"
                });
            }
        } else {
            res.status(403);
            res.render('error', {
                error: "User o Pass errati!",
                message: "User o Pass errati!"
            });
        }
    });
}

function getUsersInformations(req, res) {
    User.find({}).populate('OAuthClient').then(users => {
        var myJson = {
            "data": users
        };
        for (var i = 0; i < myJson.data.length; i++) {
            if (myJson.data[i].type.role === 'admin') {
                myJson.data.splice(i, 1);
            }
            /*if(myJson.data[i].hasOwnProperty("OAuthClient")){
                myJson.data[i]["client"] = myJson.data[i]["OAuthClient"];
                delete data[i]["OAuthClient"]
            }*/
            for (var j = 0; j < myJson.data[i].OAuthClient.length; j++) {
                console.log(myJson.data[i].OAuthClient[j].client_id);
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
    OAuthClient.find({
        _id: req.body._id
    }).populate('User')
        .then(client => {
            var arrayUtenti = [];
            client[0].User.forEach(el => {
                arrayUtenti.push(el._doc._id);
            });
            User.find({
                _id: {
                    $nin: arrayUtenti
                }
            }).then(utenti => {
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

function associaClientUser(req, res) {
    OAuthClient.findOne({
        _id: req.body.client_Id._id
    }).then(client => {
        req.body.userId.forEach(el => {
            client.User.push(el);
        });
        client.save();
    }).catch(function (err) {
        var myJson = {
            "data": err.message
        };
        return res.json(myJson);
    });
    User.find({
        _id: req.body.userId
    }).then(utenti => {
        console.log(utenti);
        for (var i = 0; i < utenti.length; i++) {
            utenti[i].OAuthClient.push(req.body.client_Id._id);
            utenti[i].save();
        }
        return res.json({errore: false});
    }).catch(function () {
        return res.json({errore: true});
    });
}

function getClientInformations(req, res) {
    OAuthClient.find({}, function (err, client) {
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
    OAuthClient.updateMany({}, {$pullAll: {User: [id]}}, function (err, user) {
    });
    User.findOneAndRemove({_id: id}, function (err, user) {
        if (!err) {
            return res.json({errore: false});
        } else
            return res.json({errore: true});
    });
}

function deleteClient(req, res) {
    User.updateMany({}, {
        $pullAll: {OAuthClient: [req.body._id]}
    }, function (err, user) {
    });
    OAuthClient.findOneAndRemove({_id: req.body._id}, function (err, user) {
        if (!err) {
            return res.json({errore: false});
        } else
            return res.json({errore: true});
    });
}

function updateUser(req, res) {
    User.findOneAndUpdate({_id: req.body._id},
        {
            $set: {
                username: req.body.username,
                password: req.body.password,
                client: req.body.client,
                type: {
                    organization: req.body.type.organization,
                    role: req.body.type.role
                }
            }
        }, {new: true}, function (err, doc) {
            if (!err) {
                return res.json({errore: false});
            } else
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
    OAuthClient.findOneAndUpdate(
        {
            _id: req.body._id
        },
        {
            $set: {
                client_id: req.body.client_id,
                client_secret: req.body.client_secret,
                redirect_uri: req.body.redirect_uri,
                grant_types: req.body.grant_types
            }
        }, {new: true}, function (err, doc) {
            if (!err) {
                return res.json({errore: false});
            } else {
                return res.json({errore: true});
            }
        }
    );
}

function addNewUser(req, res) {
    return User.findOne({
        username: req.body.materialFormRegisterUsername,
        password: req.body.materialFormRegisterPassword,
        scope: req.body.materialFormScope,
        type: {
            organization: req.body.materialFormRegisterOrganization,
            role: req.body.materialFormRegisterRole
        }
    }).then(function (user) {
        if (!user) {
            User.create({
                username: req.body.materialFormRegisterUsername,
                password: req.body.materialFormRegisterPassword,
                type: {
                    organization: req.body.materialFormRegisterOrganization,
                    role: req.body.materialFormRegisterRole
                }
            });
            res.redirect(req.headers.referer + '&esito=true');
        }
        else
            res.redirect(req.headers.referer + '&esito=false');
    }).catch(function (err) {
        res.redirect(req.headers.referer + '&esito=false');
    });
}

function addNewClient(req, res) {
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
    return OAuthClient.findOne({
        client_id: req.body.client_id,
        client_secret: req.body.client_secret,
        redirect_uri: req.body.redirect_uri,
        grant_types: arrayGrants
    }).then(function (client) {
        if (!client) {
            OAuthClient.create({
                client_id: req.body.client_id,
                client_secret: req.body.client_secret,
                redirect_uri: req.body.redirect_uri,
                grant_types: arrayGrants
            });
            res.redirect(req.headers.referer + '&esito=true');
        }
        else
            res.redirect(req.headers.referer + '&esito=false');
    }).catch(function (err) {
        //console.log("saveAuthorizationCode - Err: ", err)
        res.redirect(req.headers.referer + '&esito=false');
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
    addNewUser: addNewUser,
    login: login,
    getUsersInformations: getUsersInformations,
    deleteUser: deleteUser,
    updateUser: updateUser,
    addNewClient: addNewClient,
    getClientInformations: getClientInformations,
    updateClient: updateClient,
    deleteClient: deleteClient,
    filterUsersByID: filterUsersByID,
    associaClientUser: associaClientUser
}

