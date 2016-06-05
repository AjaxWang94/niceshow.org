var Table = function(tableIndex) {
	this.tableIndex = tableIndex;
	this.table = $("div[table-index='"+tableIndex+"']");

	this.initPlayers();
	this.initBoard();

	this.intervalID = undefined;
	this.counts = undefined;

	this.result = -1;
};

Table.prototype.initPlayers = function() {
	this.players = [];
	this.table.find("#p0Name").html("&nbsp;");
	this.table.find("#p1Name").html("&nbsp;");
};

Table.prototype.initBoard = function() {
	this.table.find("td").each(function() {
		$(this).attr({marked: "false", isActive: "false"});
		$(this).find("strong").text("");
	});
};

Table.prototype.enableTurn = function() {
	this.table.find("td").each(function() {
		if ($(this).attr("marked") === "false") {
			$(this).attr({isActive: "true"});
		}
	});
};

Table.prototype.disableBoard = function() {
	this.table.find("td").each(function() {
		$(this).attr({isActive: "false"});
	});
};

Table.prototype.syncState = function(table) {
	this.result = table.result;
	this.addPlayer(table.players[0]);
	this.addPlayer(table.players[1]);
	for (var i = 0; i < 9; i++) {
		this.doMark(i, table.cells[i].label);
	}
	if (table.result != -1) {
		if (table.result === 0 || table.result === 1) {
			this.doWin({label: table.result, pos: table.winPos});
		} else if (table.result === 2) {
			this.doTie();
		}
	}
};

Table.prototype.addPlayer = function(player) {
	if (player != undefined) {

		if (this.result != -1) {
			this.table.find("#result").text("");
			this.table.find("#result").addClass("hidden");
			this.initBoard();
			this.table.find("td").each(function() {
				$(this).removeClass("text-primary");
			});
			this.result = -1;
		}

		this.players[player.label] = player;
		if (player.name != "") {
			this.table.find("#p" + player.label + "Name").text(player.name);
		} else {
			this.table.find("#p" + player.label + "Name").text("Player" + player.label);
		}
		this.table.find("#timeCounter").removeClass("hidden");
		this.table.find("#p" + player.label + "Counter").removeClass("hidden");
	}
};

Table.prototype.ready = function() {
	var that = this;
	this.table.find("td").click(function() {
		if ($(this).attr("isActive") === "true") {
			that.disableBoard();
			that.onMark(parseInt($(this).attr("cellId")));
		}
	});
};

Table.prototype.doQuit = function(label) {
	this.players[label] = undefined;
	this.table.find("#p" + label + "Name").html("&nbsp;");
	this.table.find("#p" + label + "Counter").addClass("hidden");
	this.table.find("#timeCounter").addClass("hidden");
};

Table.prototype.onMark = function(tableIndex, cellId) {};

Table.prototype.doMark = function(cellId, label) {
	if (label === 0 || label === 1) {
		var cell = this.table.find("td[cellId="+cellId+"]");
		cell.find("strong").text(label ? "O" : "X");
		cell.attr({marked: "true", isActive: "false"});
	}
};

Table.prototype.countPlayer = function(label) {
	this.counts = 10;
	this.table.find("#p" + label + "Counter").text(this.counts);
	this.intervalID = setInterval(this.count, 1000, this, label);
};

Table.prototype.count = function(that, label) {
	counts = --that.counts;
	that.table.find("#p" + label + "Counter").text(counts);
	if (counts === 0) {
		clearInterval(that.intervalID);
		that.intervalID = undefined;
	}
};

Table.prototype.stopTimeCounter = function() {
	if (this.intervalID != undefined) {
		clearInterval(this.intervalID);
		this.intervalID = undefined;
	}
};

Table.prototype.doWin = function(data) {
	this.stopTimeCounter();
	this.result = data.winner.label;
	this.table.find("#p0Counter").html("&nbsp;");
	this.table.find("#p0Counter").addClass("hidden");
	this.table.find("#p1Counter").html("&nbsp;");
	this.table.find("#p1Counter").addClass("hidden");
	this.table.find("#timeCounter").addClass("hidden");
	this.table.find("#result").removeClass("hidden");
	var winnerName;
	if (data.winner.name === "") {
		winnerName = "Player" + data.winner.label;
	} else {
		winnerName = data.winner.name;
	}
	this.table.find("#result").text(winnerName + "(" + (data.winner.label ? "O" : "X") + ") wins");
	if (data.pos != undefined) {
		for (var i = 0; i < data.pos.length; i++) {
			this.table.find('[cellId="'+data.pos[i]+'"]').addClass("text-primary");
		}
	}
	this.initPlayers();
};

Table.prototype.doTie = function() {
	this.stopTimeCounter();
	this.result = 2;
	this.table.find("#p0Counter").html("&nbsp;");
	this.table.find("#p0Counter").addClass("hidden");
	this.table.find("#p1Counter").html("&nbsp;");
	this.table.find("#p1Counter").addClass("hidden");
	this.table.find("#timeCounter").addClass("hidden");
	this.table.find("#result").removeClass("hidden");
	this.table.find("#result").text("Tie");
	this.initPlayers();
};