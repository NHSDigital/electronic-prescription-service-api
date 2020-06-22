const postPrescription = require('./prescription/prepare');
const putPrescription = require('./prescription/send');
const health = require('./health/get-health');

const routes = [].concat(postPrescription, putPrescription, health);

module.exports = routes;
