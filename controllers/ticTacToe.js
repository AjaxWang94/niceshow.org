module.exports = {
	index: function(req, res, next) {
		res.render('tic-tac-toe');
	},
	board: function(req, res, next) {
		res.render('board');
	},
};