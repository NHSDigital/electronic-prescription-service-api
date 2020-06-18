const postPrescription = require('./prescription/post-prescription');
const putPrescription = require('./prescription/put-prescription');
const health = require('./health/get-health');
const status = require('./health/get-status');

const routes = [].concat(postPrescription, putPrescription, health, status);

module.exports = routes;
