const postPrescription = require('./prescription/prepare');
const putPrescription = require('./prescription/send');
const health = require('./health/get-health');
const status = require('./health/get-status');

const routes = [].concat(postPrescription, putPrescription, health, status);

module.exports = routes;
