$(document).ready(function() {

	var wsUri = "ws://localhost:4080";
	// var wsUri = "ws://192.168.31.16:4080";
	
	var events = {
		outgoing: {
			PLAYER_CONNECTED: 'csPlayerConnected',
			UPDATE_PLAYER_NUMBERS: 'csUpdatePlayerNumbers',
			SYNC_STATE: 'csSyncState',
			ADD_NAME: 'csAddName',
			JOIN_TABLE: 'csJoinTable',
			MARK: 'csMark',
			QUIT_TABLE: 'csQuitTable'
		},
		incoming: {
			PLAYER_CONNECTED: 'scPlayerConnected',
			UPDATE_PLAYER_NUMBERS: 'scUpdatePlayerNumbers',
			SYNC_STATE: 'scSyncState',
			ADD_NAME: 'scAddName',
			JOIN_TABLE: 'scJoinTable',
			CLEAR_BOARD: 'scClearBoard',
			START_GAME: 'scStartGame',
			MARK: 'scMark',
			SET_TURN: 'scSetTurn',
			TIME_OUT: 'scTimeOut',
			QUIT_TABLE: 'scQuitTable',
			GAME_OVER: 'scGameOver',
			ERROR: 'scError'
		}
	};

	var player = new Player();
	var tables = [];
	for (var i = 0; i < 8; i++) {
		tables.push(new Table(i));
	}
	var websocket;

	function makeMessage(action, data){
		var resp = {
			action: action,
			data: data
		};
		return JSON.stringify(resp);
	}

	for (var i = 0; i < 8; i++) {
		tables[i].onMark = function(cellId){
			websocket.send(makeMessage(events.outgoing.MARK, {cellId: cellId}));
		};
	}

	$("#playBtn").click(function() {
		var name = jQuery.trim($("#nameInput").val());
		if (name.length > 0) {
			player.name = name;
			websocket.send(makeMessage(events.outgoing.ADD_NAME, {name: player.name}));
		}
	});

	$(".panel-heading").click(function(evt) {
		var label = parseInt(evt.target.getAttribute("label"));
		if (!isNaN(label)) {
			if (player.tableIndex === -1) {
				var index = parseInt($(this).closest(".panel").attr("table-index"));
				if (tables[index].players[label] === undefined) {
					var msg = {tableIndex: index, label: label};
					websocket.send(makeMessage(events.outgoing.JOIN_TABLE, msg));
				}
			}
		}
	});

	$(".panel-footer").click(function(evt) {
		var label = parseInt(evt.target.getAttribute("label"));
		if (!isNaN(label)) {
			var index = parseInt($(this).closest(".panel").attr("table-index"));
			if (player.tableIndex === index && player.label === label) {
				websocket.send(makeMessage(events.outgoing.QUIT_TABLE, {}));
			}
		}
	});

	function init()
	{
		console.log("int()");
		websocket = new WebSocket(wsUri);
		websocket.onopen = function(evt) { onOpen(evt) };
		websocket.onclose = function(evt) { onClose(evt) };
		websocket.onmessage = function(evt) { onMessage(evt) };
		websocket.onerror = function(evt) { onError(evt) };
	}

	function onOpen(evt)
	{
		console.log("wss CONNECTED");
		websocket.send(makeMessage(events.outgoing.SYNC_STATE, {}));
	}

	function onClose(evt)
	{
		console.log("wss DISCONNECTED");
	}

	function onMessage(evt)
	{
		console.log('RESPONSE: ' + evt.data);
		var msg = JSON.parse(evt.data);

		switch (msg.action) {

			case events.incoming.ERROR:
				console.log(msg.data);
				break;

			case events.incoming.PLAYER_CONNECTED:
				player.id = msg.data.socketId;
				break;

			case events.incoming.UPDATE_PLAYER_NUMBERS:
				$("#playerNumbers").text(msg.data.playerNumbers);
				break;

			case events.incoming.SYNC_STATE:
				for (var i = 0; i < 8; i++) {
					tables[i].syncState(msg.data.tables[i]);
				}
				break;

			case events.incoming.ADD_NAME:
				$("#nameInput").val(msg.data.name);
				$("#nameInput").attr({disabled: "disabled"});
				$("#playBtn").attr({disabled: "disabled"});
				break;

			case events.incoming.JOIN_TABLE:
				tables[msg.data.tableIndex].addPlayer(msg.data);
				if (player.id === msg.data.id) {
					player.tableIndex = msg.data.tableIndex;
					player.label = msg.data.label;
					tables[msg.data.tableIndex].boardReady();
				}
				break;

			case events.incoming.CLEAR_BOARD:
				tables[msg.data.tableIndex].clearBoard();
				break;

			case events.incoming.START_GAME:
				if (player.id === msg.data.id) {
					tables[msg.data.tableIndex].enableBoard();
				}
				tables[msg.data.tableIndex].countPlayer(0);
				break;

			case events.incoming.QUIT_TABLE:
				tables[msg.data.tableIndex].doQuit(msg.data.label);
				if (msg.data.id === player.id) {
					player.tableIndex = -1;
					player.label = -1;
				}
				break;

			case events.incoming.MARK:
				tables[msg.data.tableIndex].stopTimeCounter();
				tables[msg.data.tableIndex].doMark(msg.data.cellId, msg.data.label);
				if (player.tableIndex === msg.data.tableIndex) {
					tables[msg.data.tableIndex].countPlayer(msg.data.label ? 0 : 1);
				}
				break;

			case events.incoming.SET_TURN:
				tables[msg.data.tableIndex].enableBoard();
				break;

			case events.incoming.GAME_OVER:
				console.log(msg.data.tableIndex);
				tables[msg.data.tableIndex].doGameOver(msg.data);
				if (player.tableIndex === msg.data.tableIndex) {
					player.tableIndex = -1;
					player.label = -1;
				}
				break;
		}
	}

	function onError(evt)
	{
		console.log('ERROR: ' + evt.data);
	}

	init();

});