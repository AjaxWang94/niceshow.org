/**
 *
 * @constructor
 */
var Table = function(tableIndex) {
	this.tableIndex = tableIndex;
	this.table = $("div[table-index='"+tableIndex+"']");
	this.clear();
	var that = this;
	this.table.find("td").click(function() {
		if (that.isOnGame && $(this).attr("isActive") === "true") {
			that.disableAll();
			that.onMark(that.tableIndex, $(this).attr("cellId"));
		}
	});
};

Table.prototype.clear = function() {
	this.players = [];
	this.table.find("#p" + 0 +"Name").html("&nbsp;");
	this.table.find("#p" + 1 +"Name").html("&nbsp;");
	this.isOnGame = false;
	this.currentTurn = 0;
	this.table.find("td").each(function() {
		$(this).attr({marked: "false"});
		$(this).attr({isActive: "false"});
		$(this).find("strong").text("");
	});
	this.intervalID = undefined;
	this.counts = undefined;
};

Table.prototype.syncState = function(table) {
	this.addPlayer(table.players[0]);
	this.addPlayer(table.players[1]);
	for (var i = 0; i < 9; i++) {
		this.doMark(i, table.cells[i].label);
	}
};

Table.prototype.addPlayer = function(player) {
	if (player != undefined) {
		this.table.find("strong").stop(true, true);
		this.players[player.label] = player;
		this.table.find("#p"+player.label+"Name").html(player.name);
	}
};

Table.prototype.onMark = function(tableIndex, cellId) {};

Table.prototype.doMark = function(cellId, label) {
	if (label + 1) {
		// stop former timeout
		if (this.intervalID) {
			clearInterval(this.intervalID);
		}

		var cell = this.table.find("td[cellId="+cellId+"]");
		cell.attr({marked: "true", isActive: "false"});
		cell.find("strong").text(label?"O":"X");
		var cellWidth = cell.width();
		cell.find("strong").css({"line-height": cellWidth+"px", "font-size": cellWidth*0.6+"px"});
		// countdown opponent
		this.currentTurn = (this.currentTurn + 1) % 2;
		this.counts = 10;
		this.table.find("#countdown" + this.currentTurn).text(this.counts);
		this.intervalID = setInterval(this.count, 1000, this);
		console.log("this.intervalID: " + this.intervalID);
	}
};

Table.prototype.count = function(that) {
	counts = --that.counts;
	that.table.find("#countdown" + that.currentTurn).text(counts);
	if (counts === 0) {
		clearInterval(that.intervalID);
	}
};

Table.prototype.doQuit = function(label) {
	this.players[label] = undefined;
	this.isOnGame = false;
	this.table.find("#p"+label+"Name").html("&nbsp;");
};

Table.prototype.disableAll = function() {
	this.table.find("td").each(function() {
		$(this).attr({isActive: "false"});
	});
};

Table.prototype.enableTurn = function() {
	this.table.find("td").each(function() {
		if ($(this).attr("marked") === "false") {
			$(this).attr({isActive: "true"});
		}
	});
};

Table.prototype.doWinner = function(data) {
	clearInterval(this.intervalID);

	for (var i = 0; i < data.pos.length; i++) {
		this.table.find('[cellId="'+data.pos[i]+'"]').addClass("text-primary");
	}
	this.disableAll();
	var that = this;
	$.when(this.table.find('strong').fadeOut(2000, function() {
		$(this).parent().removeClass("text-primary");
		$(this).show();
	})).then(function() {
		that.clear();
	});
	console.log("game over win");
};

Table.prototype.doDraw = function() {
	clearInterval(this.intervalID);

	this.disableAll();
	var that = this;
	this.table.find('strong').fadeOut(2000, function() {
		that.clear();
	});
	console.log("game over draw");
};