var Table = function(tableIndex) {
	this.index = tableIndex;
	this.table = $("div[table-index='"+tableIndex+"']");

	this.initPlayers();
	this.initBoard();

	this.intervalID = undefined;
	this.counts = undefined;
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

Table.prototype.enableBoard = function() {
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

Table.prototype.initTimeCounter = function() {
	this.table.find("#p0Counter").html("&nbsp;");
	this.table.find("#p1Counter").html("&nbsp;");
	this.table.find("#p0Counter").addClass("hidden");
	this.table.find("#p1Counter").addClass("hidden");
	this.table.find("#timeCounter").addClass("hidden");
};

Table.prototype.initResult = function() {
	this.table.find("#result").html("&nbsp;");
	this.table.find("#result").addClass("hidden");
};

Table.prototype.clearBoard = function() {
	this.initResult();
	this.initBoard();
	this.table.find("td").each(function() {
		$(this).removeClass("text-primary");
	});
}

Table.prototype.syncState = function(table) {
	this.addPlayer(table.players[0]);
	this.addPlayer(table.players[1]);
	for (var i = 0; i < 9; i++) {
		this.doMark(i, table.cells[i].label);
	}
	if (table.winner.label != -1) {
		this.doGameOver({winner: table.winner, winPos: table.winPos});
	}
};

Table.prototype.addPlayer = function(player) {
	if (player != undefined) {
		this.players[player.label] = player;
		var playerName = player.name;
		if (playerName === "") {
			playerName = "Player" + player.label;
		}
		this.table.find("#p" + player.label + "Name").text(playerName);
		this.table.find("#timeCounter").removeClass("hidden");
		this.table.find("#p" + player.label + "Counter").removeClass("hidden");
	}
};

Table.prototype.boardReady = function() {
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

Table.prototype.onMark = function(cellId) {};

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

Table.prototype.doGameOver = function(data) {
	this.stopTimeCounter();
	this.initTimeCounter();
	this.table.find("#result").removeClass("hidden");
	if (data.winner.label === 2) {
		this.table.find("#result").text("Tie");
	} else {
		var winnerName = data.winner.name;
		if (winnerName === "") {
			winnerName = "Player" + data.winner.label;
		}
		this.table.find("#result").text(winnerName + "(" + (data.winner.label ? "O" : "X") + ") wins");
		if (data.winPos != undefined) {
			for (var i = 0; i < data.winPos.length; i++) {
				this.table.find('[cellId="'+data.winPos[i]+'"]').addClass("text-primary");
			}
		}
	}
	this.initPlayers();
};