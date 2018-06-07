module.exports = function(sequelize, DataTypes) {
  var OAuthScope = sequelize.define('OAuthScope',  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    scope: DataTypes.STRING(80),
    is_default: DataTypes.BOOLEAN
  }, {
    tableName: 'oauth_scopes',
    timestamps: false,
    underscored: true
  });
  return OAuthScope;
}