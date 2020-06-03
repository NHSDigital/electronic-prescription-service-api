const postConvertMessage = require('./prescription/post-convert-full-message');
const postConvertSignatureFragments = require('./prescription/post-convert-signature-fragments');
const postSendPrescription = require('./prescription/post-send-message');
const health = require('./health/get-health');

const routes = [].concat(postConvertMessage, postConvertSignatureFragments, postSendPrescription, health);

module.exports = routes;
