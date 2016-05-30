var server = require('http').createServer();
var url = require('url');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });
var port = 4080;

var Table = require('./Table');
var Player = require('./Player');

var sockets = new Map();
var tables = [];

for (var i = 0; i < 8; i++) {
	tables.push(new Table(i));
	// players.push(["", ""]);
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

function makeMessage(action, data) {
	var resp = {
		action: action,
		data: data
	};
	return JSON.stringify(resp);
}

for (var i = 0; i < 8; i++) {

	tables[i].on(Table.events.JOIN_TABLE, function(player) {
		wss.clients.forEach(function(client) {
			client.send(makeMessage(events.outgoing.JOIN_TABLE, player));
		});
	});

	tables[i].on(Table.events.SET_TURN, function(player) {
		var client = sockets.get(player.id).ws;
		client.send(makeMessage(events.outgoing.SET_TURN, {tableIndex: player.currentTable}));
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

	tables[i].on(Table.events.QUIT, function(player) {
		var player = sockets.get(player.id).player;
		wss.clients.forEach(function(client) {
			client.send(makeMessage(events.outgoing.QUIT_TABLE, player));
		});
		player.currentTable = -1;
		player.label = -1;
	});
}

wss.on('connection', function connection(ws) {
	var location = url.parse(ws.upgradeReq.url, true);
	// you might use location.query.access_token to authenticate or share sessions 
	// or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312) 

	var socketId = ws.upgradeReq.headers['sec-websocket-key'];
	console.log(socketId + " connected");

	var player = new Player();
	player.id = socketId;
	sockets.set(socketId, {ws: ws, player: player});
	ws.send(makeMessage(events.outgoing.PLAYER_CONNECTED, {socketId: socketId}));

	console.log("wss.clients.length: " + wss.clients.length + "\n");

	ws.on('message', function incoming(msg) {

		var socketId = ws.upgradeReq.headers['sec-websocket-key'];
		console.log(socketId);

		try {
			console.log(msg + "\n");
			var msg = JSON.parse(msg);
		} catch (error) {
			ws.send(makeMessage(events.outgoing.ERROR, 'Invalid action'));
			return;
		}

		try {
			switch (msg.action) {

				case events.incoming.SYNC_STATE:
					ws.send(makeMessage(events.outgoing.SYNC_STATE, tables));
					break;

				case events.incoming.JOIN_ROOM:
					sockets.get(socketId).player.name = msg.data;
					ws.send(makeMessage(events.outgoing.JOIN_ROOM, {}));
					break;

				case events.incoming.JOIN_TABLE:
					var index = msg.data.tableIndex;
					if (tables[index].isOnGame === false) {
						var player = sockets.get(socketId).player;
						player.currentTable = index;
						if (tables[index].players[0] === undefined) {
							player.label = 0;
						} else if (tables[index].players[1] === undefined) {
							player.label = 1;
						}
						tables[index].addPlayer(player);
					}
					break;

				case events.incoming.MARK:
					var index = msg.data.tableIndex;
					if (sockets.get(socketId).player.currentTable === index) {
						tables[index].mark(msg.data.cellId);
					}
					break;

				/*case events.incoming.QUIT:
					console.log("quit");
					ws.send(makeMessage(events.outgoing.QUIT, {}));
					break;*/
			}
		} catch (error) {
			console.log(error.stack);
		}
	});
 });

server.listen(
	port,
	function () {
		console.log('Listening on ' + server.address().port + "\n");
	}
);