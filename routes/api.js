const express = require('express');
const healthController = require('../controllers/healthController');
const scrapeController = require('../controllers/scrapeController');

const router = express.Router();

router.get('/ping', healthController.ping);

router.get('/scrape', scrapeController.scrapeByQuery);
router.post('/scrape', scrapeController.scrapeByBody);
router.post('/bulk', scrapeController.bulk);
router.post('/extract', scrapeController.extract);
router.post('/inspect', scrapeController.inspect);

module.exports = router;
