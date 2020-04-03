const prescription = require('./prescription/post-prescription');
const health = require('./health/get-health');

const routes = [].concat(prescription, health);

module.exports = routes;
