var express = require('express');
var router = express.Router();

var home = require('../controllers/home');
var ticTacToe = require('../controllers/ticTacToe');

/* GET home page. */
router.get('/', home.index);
router.get('/tic-tac-toe', ticTacToe.index);

module.exports = router;
