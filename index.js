/** Basic module */
const { version } = require('cucumber/package.json');
const before6=Number(version.split('.')[0])<6;

module.exports=before6?require("./before6"):require('./v6');
