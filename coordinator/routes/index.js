const postPrescription = require('./prescription/post-convert-full-message');
const putPrescription = require('./prescription/post-convert-signature-fragments');
const health = require('./health/get-health');

const routes = [].concat(postPrescription, putPrescription, health);

module.exports = routes;
