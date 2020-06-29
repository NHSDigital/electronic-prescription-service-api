const postPrescription = require('./prescription/prepare');
const putPrescription = require('./prescription/send');
const status = require('./health/get-status');

const routes = [].concat(postPrescription, putPrescription, status);

module.exports = routes;
