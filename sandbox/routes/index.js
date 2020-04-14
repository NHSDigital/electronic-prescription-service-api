const postPrescription = require('./prescription/post-prescription');
const putPrescription = require('./prescription/put-prescription');
const health = require('./health/get-health');

const routes = [].concat(postPrescription, putPrescription, health);

module.exports = routes;
