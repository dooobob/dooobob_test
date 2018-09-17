var express = require('express');
var router = express.Router(),
    test = require('../api/test');

router.get('/test', test.test);

module.exports = router;