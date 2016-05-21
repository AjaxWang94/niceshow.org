var server = require('http').createServer();
var url = require('url');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });
var port = 4080;

var Board = require('./BoardServer');
var Player = require('./Player');

var board = new Board();

var events = {
	incoming: {
		JOIN_GAME: 'csJoinGame',
		MARK: 'csMark',
		QUIT: 'csQuit'
	},
	outgoing: {
		JOIN_GAME: 'scJoinGame',
		SET_TURN: 'scSetTurn',
		MARK: 'scMark',
		OPPONENT_READY: 'scOpponentReady',
		GAME_OVER: 'scGameOver',
		ERROR: 'scError',
		QUIT: 'scQuit'
	}
};

function makeMessage(action, data) {
	var resp = {
		action: action,
		data: data
	};
	return JSON.stringify(resp);
}

wss.on('connection', function connection(ws) {
	var location = url.parse(ws.upgradeReq.url, true);
	// you might use location.query.access_token to authenticate or share sessions 
	// or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312) 
 
	board.on(Board.events.PLAYER_CONNECTED, function(player) {
		board.players.forEach(function(player) {
			ws.send(makeMessage(events.outgoing.JOIN_GAME, player));
		});
	});

	board.on(Board.events.SET_TURN, function(player) {
		ws.send(makeMessage(events.outgoing.SET_TURN, player));
	});

	board.on(Board.events.CELL_MARKED, function(event) {
		ws.send(makeMessage(events.outgoing.MARK, event));
	});

	board.on(Board.events.WINNER, function(event) {
		ws.send(makeMessage(events.outgoing.GAME_OVER, event));
	});

	board.on(Board.events.DRAW, function(event) {
		ws.send(makeMessage(events.outgoing.GAME_OVER, event));
	});

	ws.on('message', function incoming(msg) {
		try {
			console.log('received: %s', msg);
			var msg = JSON.parse(msg);
		} catch (error) {
			ws.send(makeMessage(events.outgoing.ERROR, 'Invalid action'));
			return;
		}

		try {
			switch (msg.action) {

				case events.incoming.JOIN_GAME:
					var player = new Player(board.players.length + 1, board.players.length === 0 ? 'X' : 'O', msg.data);
					board.addPlayer(player);
					break;

				case events.incoming.MARK:
					if (board.checkTurn(msg.data.playerId)) {
						board.mark(msg.data.cellId);
					}
					break;

				case events.incoming.QUIT:
					board = new Board();
					ws.send(makeMessage(events.outgoing.QUIT, {}));
					break;
			}
		} catch (error) {
			ws.send(makeMessage(events.outgoing.ERROR, error.message));
		}
	});

 });

server.listen(
	port,
	function () {
		console.log('Listening on ' + server.address().port);
	}
);