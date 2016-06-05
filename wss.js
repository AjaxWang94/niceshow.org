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
}
console.log(tables.length + " tables added.");

var events = {
	incoming: {
    PLAYER_CONNECTED: 'csPlayerConnected',
		UPDATE_PLAYER_NUMBERS: 'csUpdatePlayerNumbers',
		SYNC_STATE: 'csSyncState',
		ADD_NAME: 'csAddName',
		JOIN_TABLE: 'csJoinTable',
		MARK: 'csMark',
		QUIT_TABLE: 'csQuitTable'
	},
	outgoing: {
    PLAYER_CONNECTED: 'scPlayerConnected',
		UPDATE_PLAYER_NUMBERS: 'scUpdatePlayerNumbers',
		SYNC_STATE: 'scSyncState',
		ADD_NAME: 'scAddName',
		JOIN_TABLE: 'scJoinTable',
		START_GAME: 'scStartGame',
		MARK: 'scMark',
		SET_TURN: 'scSetTurn',
		QUIT_TABLE: 'scQuitTable',
		GAME_OVER: 'scGameOver',
		ERROR: 'scError'
	}
};

function makeMessage(action, data) {
	var resp = {
		action: action,
		data: data
	};
	return JSON.stringify(resp);
}

function makeTables(action, data) {
	var resp = {
		action: action,
		data: data
	};
	return JSON.stringify(resp, replacer);
}

var blacklist = ["currentTurn", "timeoutObject", "_events", "_eventsCount"];

function replacer(key, value) {
	var pass = blacklist.every(function(element) {
		return key != element;
	});
	if (pass) {
		return value;
	}
	return undefined;
}

for (var i = 0; i < 8; i++) {

	tables[i].on(Table.events.JOIN_TABLE, function(player) {
		wss.clients.forEach(function(client) {
			client.send(makeMessage(events.outgoing.JOIN_TABLE, player));
		});
	});

	tables[i].on(Table.events.QUIT_TABLE, function(player) {
		wss.clients.forEach(function(client) {
			client.send(makeMessage(events.outgoing.QUIT_TABLE, player));
		});
		var player = sockets.get(player.id).player;
		player.currentTable = -1;
		player.label = -1;
	});

	tables[i].on(Table.events.START_GAME, function(players) {
		var client0 = sockets.get(players[0].id).ws;
		var client1 = sockets.get(players[1].id).ws;
		client0.send(makeMessage(events.outgoing.START_GAME, players[0]));
		client1.send(makeMessage(events.outgoing.START_GAME, players[0]));
	});

	tables[i].on(Table.events.CELL_MARKED, function(evt) {
		wss.clients.forEach(function(client) {
			client.send(makeMessage(events.outgoing.MARK, evt));
		});
	});

	tables[i].on(Table.events.SET_TURN, function(player) {
		var client = sockets.get(player.id).ws;
		client.send(makeMessage(events.outgoing.SET_TURN, {tableIndex: player.currentTable}));
	});

	tables[i].on(Table.events.WIN, function(evt) {
		// var msg = {tableIndex: evt.players[0].currentTable, winner: evt.winner, pos: evt.pos};
		var msg = {winner: evt.players[evt.winner], pos: evt.pos};
		wss.clients.forEach(function(client) {
			client.send(makeMessage(events.outgoing.GAME_OVER, msg));
		});
		var player0 = sockets.get(evt.players[0].id).player;
		player0.currentTable = -1;
		player0.label = -1;
		var player1 = sockets.get(evt.players[1].id).player;
		player1.currentTable = -1;
		player1.label = -1;
	});

	tables[i].on(Table.events.TIE, function(evt) {
		var msg = {tableIndex: evt.players[0].currentTable};
		wss.clients.forEach(function(client) {
			client.send(makeMessage(events.outgoing.GAME_OVER, msg));
		});
		var player0 = sockets.get(evt.players[0].id).player;
		player0.currentTable = -1;
		player0.label = -1;
		var player1 = sockets.get(evt.players[1].id).player;
		player1.currentTable = -1;
		player1.label = -1;
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
	wss.clients.forEach(function(client) {
		client.send(makeMessage(events.outgoing.UPDATE_PLAYER_NUMBERS, {playerNumbers: wss.clients.length}));
	});

	console.log("wss.clients.length: " + wss.clients.length);
	console.log("sockets.size: " + sockets.size + "\n");

	ws.on('close', function(msg) {
		console.log("client %s closed.", sockets.get(socketId).player.id);
		console.log("msg: " + msg);

		wss.clients.forEach(function(client) {
			client.send(makeMessage(events.outgoing.UPDATE_PLAYER_NUMBERS, {playerNumbers: wss.clients.length}));
		});

		var player = sockets.get(socketId).player;
		if (player.currentTable != -1 && player.label != -1) {
			tables[player.currentTable].quit(player);
		}

		sockets.delete(socketId);
		console.log("wss.clients.length: " + wss.clients.length);
		console.log("sockets.size: " + sockets.size + "\n");
	});

	ws.on('message', function incoming(msg) {

		console.log("socketId: " + socketId);
		var player = sockets.get(socketId).player;

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
					ws.send(makeTables(events.outgoing.SYNC_STATE, {tables: tables}));
					break;

				case events.incoming.ADD_NAME:
					if (player.name === "" && msg.data.name.length <= 8) {
						player.name = msg.data.name;
						ws.send(makeMessage(events.outgoing.ADD_NAME, {name: player.name}));
					}
					break;

				case events.incoming.JOIN_TABLE:
					if (player.currentTable === -1) {
						var index = msg.data.tableIndex;
						var label = msg.data.label;
						var available = [0, 1, 2, 3, 4, 5, 6, 7];
						var pass = available.some(function(element) {
							return index === element;
						});
						if (pass && (label === 0 || label ===1)) {
							if (tables[index].players[label] === undefined) {
								player.currentTable = index;
								player.label = label;
								tables[index].addPlayer(player);
							}
						}
					}
					break;

				case events.incoming.QUIT_TABLE:
					if (player.currentTable != -1 && player.label != -1) {
						tables[player.currentTable].quit(player);
					}
					break;

				case events.incoming.MARK:
					var cellId = msg.data.cellId;
					var available = [0, 1, 2, 3, 4, 5, 6, 7, 8];
					var pass = available.some(function(element) {
						return cellId === element;
					});
					if (pass && player.currentTable != -1) {
						tables[player.currentTable].mark(player.label, cellId);
					}
					break;
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