$(document).ready(function() {

	var wsUri = "ws://localhost:4080"
	// var wsUri = "ws://192.168.31.16:4080"
	
	var events = {
			outgoing: {
					JOIN_GAME: 'csJoinGame',
					MARK: 'csMark',
					QUIT: 'csQuit'
			},
			incoming: {
					JOIN_GAME: 'scJoinGame',
					MARK: 'scMark',
					SET_TURN: 'scSetTurn',
					OPPONENT_READY: 'scOpponentReady',
					GAME_OVER: 'scGameOver',
					ERROR: 'scError',
					QUIT: 'scQuit'
			}
	};

	var hero = {};
	var board = new Board();

	$("iframe").load(function() {
		board.init();
		$("#nameInputGroup").removeClass("hide");
	});

	$("#playBtn").click(function() {
		var name = jQuery.trim($("#nameInput").val());
		if (name.length > 0) {
			hero.name = name;
			$("#nameInputGroup").remove();
			$("#connecting").removeClass("hide");
			init();
		}
	});

	function makeMessage(action, data){
		var resp = {
			action: action,
			data: data
		};
		return JSON.stringify(resp);
	}

	board.onMark = function(cellId){
		websocket.send(makeMessage(events.outgoing.MARK, {playerId: hero.id, cellId: cellId}));
	};

	function init()
	{
		websocket = new WebSocket(wsUri);
		websocket.onopen = function(evt) { onOpen(evt) };
		websocket.onclose = function(evt) { onClose(evt) };
		websocket.onmessage = function(evt) { onMessage(evt) };
		websocket.onerror = function(evt) { onError(evt) };
	}

	function onOpen(evt)
	{
		console.log("wss CONNECTED");
		$("#connected").removeClass("hide");
		websocket.send(makeMessage(events.outgoing.JOIN_GAME, hero.name));
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
				alert('Error: ' + msg.data);
				break;

			case events.incoming.JOIN_GAME:
				board.addPlayer(msg.data);
				if (msg.data.name === hero.name) {
					hero = msg.data;
				}
				break;

			case events.incoming.SET_TURN:
				board.ready = true;
				if (msg.data.id === hero.id) {
					console.log("enableTurn()");
					board.enableTurn();
				}
				break;

			case events.incoming.MARK:
				board.doMark(msg.data.cellId, msg.data.player.label);
				break;

			case events.incoming.GAME_OVER:
				if (msg.data.player) {
					board.doWinner(msg.data.pos);
				} else {
					board.doDraw();
				}
				websocket.send(makeMessage(events.outgoing.QUIT, hero.id));
				break;

			case events.incoming.QUIT:
				websocket.close();
				break;
		}
	}

	function onError(evt)
	{
		console.log('ERROR: ' + evt.data);
	}

});