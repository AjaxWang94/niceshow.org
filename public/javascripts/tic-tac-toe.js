$(document).ready(function() {

	var wsUri = "ws://localhost:4080";
	// var wsUri = "ws://192.168.31.16:4080";
	
	var events = {
			outgoing: {
		    PLAYER_CONNECTED: 'csPlayerConnected',
				SYNC_STATE: 'csSyncState',
				JOIN_ROOM: 'csJoinRoom',
				JOIN_TABLE: 'csJoinTable',
				MARK: 'csMark',
				QUIT_TABLE: 'csQuitTable'
			},
			incoming: {
		    PLAYER_CONNECTED: 'scPlayerConnected',
				SYNC_STATE: 'scSyncState',
				JOIN_ROOM: 'scJoinRoom',
				JOIN_TABLE: 'scJoinTable',
				MARK: 'scMark',
				SET_TURN: 'scSetTurn',
				OPPONENT_READY: 'scOpponentReady',
				GAME_OVER: 'scGameOver',
				ERROR: 'scError',
				QUIT_TABLE: 'scQuitTable'
			}
	};

	var player = new Player();
	var tables = [];
	var websocket;
	for (var i = 0; i < 8; i++) {
		tables.push(new Table(i));
	}

	function makeMessage(action, data){
		var resp = {
			action: action,
			data: data
		};
		return JSON.stringify(resp);
	}

	for (var i = 0; i < 8; i++) {
		tables[i].onMark = function(tableIndex, cellId){
			websocket.send(makeMessage(events.outgoing.MARK, {tableIndex: tableIndex, cellId: cellId}));
		};
	}

	$("#playBtn").click(function() {
		var name = jQuery.trim($("#nameInput").val());
		if (name.length > 0) {
			player.name = name;
			websocket.send(makeMessage(events.outgoing.JOIN_ROOM, player.name));
			$(this).attr({disabled: "disabled"});
			$("#nameInput").attr({disabled: "disabled"});
		}
	});

	$(".panel-heading").hover(
		function() {
			if (player.name && !(player.currentTable+1)) {
				var index = parseInt($(this).parent().attr("table-index"));
				if (tables[index].isOnGame === false) {
					$(this).css({cursor: "pointer"});
				}
			}
		},
		function() {
			$(this).css({cursor: "default"});
		}
	);

	$(".panel-heading").click(function() {
		var offset = $(this).parent().offset();
		if (player.name && !(player.currentTable+1)) {
			$(this).css({cursor: "default"});
			var tableIndex = parseInt($(this).parent().attr("table-index"));
			var msg = {tableIndex: tableIndex};
			websocket.send(makeMessage(events.outgoing.JOIN_TABLE, msg));
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
				break;

			case events.incoming.PLAYER_CONNECTED:
				player.id = msg.data.socketId;
				break;

			case events.incoming.SYNC_STATE:
				for (var i = 0; i < 8; i++) {
					tables[i].syncState(msg.data[i]);
				}
				break;

			case events.incoming.JOIN_TABLE:
				tables[msg.data.currentTable].addPlayer(msg.data);
				if (msg.data.id === player.id) {
					player.currentTable = msg.data.currentTable;
					player.label = msg.data.label;
				}
				break;

			case events.incoming.SET_TURN:
				tables[msg.data.tableIndex].isOnGame = true;
				tables[msg.data.tableIndex].enableTurn();
				break;

			case events.incoming.MARK:
				tables[msg.data.tableIndex].doMark(msg.data.cellId, msg.data.label);
				break;

			case events.incoming.GAME_OVER:
				if (msg.data.pos) {
					tables[msg.data.tableIndex].doWinner(msg.data);
				} else {
					tables[msg.data.tableIndex].doDraw();
				}
				if (msg.data.tableIndex === player.currentTable) {
					player.currentTable = -1;
					player.label = -1;
				}
				break;

			case events.incoming.QUIT_TABLE:
				if (msg.data.id === player.id) {
					tables[player.currentTable].disableAll();
					player.currentTable = -1;
					player.label = -1;
				}
				tables[msg.data.currentTable].doQuit(msg.data.label);
				// websocket.close();
				break;
		}
	}

	function onError(evt)
	{
		console.log('ERROR: ' + evt.data);
	}

	init();

});