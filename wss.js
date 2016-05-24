var server = require('http').createServer();
var url = require('url');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });
var port = 4080;

var Table = require('./TableServer');
var Player = require('./Player');

var sockets = new Map();
var tables = [];
var players = [];

for (var i = 0; i < 8; i++) {
	tables.push(new Table(i));
	players.push(["", ""]);
}
console.log(tables.length + " tables added.");

var events = {
	incoming: {
    PLAYER_CONNECTED: 'csPlayerConnected',
		SYNC_STATE: 'csSyncState',
		JOIN_ROOM: 'csJoinRoom',
		JOIN_TABLE: 'csJoinTable',
		MARK: 'csMark',
		QUIT_TABLE: 'csQuitTable'
	},
	outgoing: {
    PLAYER_CONNECTED: 'scPlayerConnected',
		SYNC_STATE: 'scSyncState',
		JOIN_ROOM: 'scJoinRoom',
		JOIN_TABLE: 'scJoinTable',
		SET_TURN: 'scSetTurn',
		MARK: 'scMark',
		OPPONENT_READY: 'scOpponentReady',
		GAME_OVER: 'scGameOver',
		ERROR: 'scError',
		QUIT_TABLE: 'scQuitTable'
	}
};

for (var i = 0; i < 8; i++) {

	tables[i].on(Table.events.JOIN_TABLE, function(msg) {
		console.log("JOIN_TABLE");
		wss.clients.forEach(function(client) {
			client.send(makeMessage(events.outgoing.JOIN_TABLE, msg));
		});
	});

	tables[i].on(Table.events.SET_TURN, function(msg) {
		var client = sockets.get(players[msg.tableIndex][msg.label])[0];
		client.send(makeMessage(events.outgoing.SET_TURN, msg));
	});

	tables[i].on(Table.events.CELL_MARKED, function(msg) {
		wss.clients.forEach(function(client) {
			client.send(makeMessage(events.outgoing.MARK, msg));
		});
	});

	tables[i].on(Table.events.WINNER, function(msg) {
		wss.clients.forEach(function(client) {
			client.send(makeMessage(events.outgoing.GAME_OVER, msg));
		});
	});

	tables[i].on(Table.events.DRAW, function(msg) {
		wss.clients.forEach(function(client) {
			client.send(makeMessage(events.outgoing.GAME_OVER, msg));
		});
	});
}

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

	var socketId = ws.upgradeReq.headers['sec-websocket-key'];
	console.log(socketId + " connected");

	sockets.set(socketId, [ws, ""]);
	ws.send(makeMessage(events.outgoing.PLAYER_CONNECTED, {socketId: socketId}));

	console.log("wss.clients.length: " + wss.clients.length);

	ws.on('message', function incoming(msg) {

		var socketId = ws.upgradeReq.headers['sec-websocket-key'];
		console.log(socketId);

		try {
			console.log('received: %s', msg);
			var msg = JSON.parse(msg);
		} catch (error) {
			ws.send(makeMessage(events.outgoing.ERROR, 'Invalid action'));
			return;
		}

		try {
			switch (msg.action) {

				case events.incoming.SYNC_STATE:
					console.log("SYNC_STATE");
					ws.send(makeMessage(events.outgoing.SYNC_STATE, tables));
					break;

				case events.incoming.JOIN_ROOM:
					sockets.get(socketId)[1] = msg.data;
					console.log(sockets.get(socketId)[1] + " joined room.");
					ws.send(makeMessage(events.outgoing.JOIN_ROOM, {}));
					break;

				case events.incoming.JOIN_TABLE:
					var tableIndex = msg.data.tableIndex;
					if (players[tableIndex][0] === "") {
						players[tableIndex][0] = socketId;
						tables[tableIndex].addPlayer(0, msg.data.playerId, msg.data.name);
					} else if (players[tableIndex][1] === "") {
						players[tableIndex][1] = socketId;
						tables[tableIndex].addPlayer(1, msg.data.playerId, msg.data.name);
					}
					break;

				case events.incoming.MARK:
					var tableIndex = msg.data.tableIndex;
					var currentTurn = tables[tableIndex].currentTurn;
					if (players[tableIndex][currentTurn] === socketId) {
						tables[tableIndex].mark(msg.data.cellId);
					}
					break;

				case events.incoming.QUIT:
					console.log("quit");
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