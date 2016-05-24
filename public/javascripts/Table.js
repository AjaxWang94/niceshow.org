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
			that.onMark(that.tableIndex, $(this).attr("cellId"));
			that.disableAll();
		}
	});
};

Table.prototype.clear = function() {
	this.players = ["", ""];
	this.addPlayer(0, "&nbsp;");
	this.addPlayer(1, "&nbsp;");
	this.isOnGame = false;
	this.currentTurn = 0;
	this.table.find("td").each(function() {
		$(this).attr({marked: "false"});
		$(this).attr({isActive: "false"});
		$(this).find("strong").text("");
	});
};

Table.prototype.syncState = function(table) {
	this.addPlayer(0, table.players[0]);
	this.addPlayer(1, table.players[1]);
	for (var i = 0; i < 9; i++) {
		this.doMark(i, table.cells[i].label);
	}
};

Table.prototype.addPlayer = function(label, name) {
	console.log("table " + this.tableIndex + " addPlayer " + name);
	if (name) {
		this.players[label] = name;
		this.table.find("#p"+label+"Name").html(name);
	}
};

Table.prototype.onMark = function(tableIndex, cellId){};

Table.prototype.doMark = function(cellId, label) {
	var cell = this.table.find("td[cellId="+cellId+"]");
	var cellWidth = cell.width();
	if (label + 1) {
		cell.attr({marked: "true", isActive: "false"});
		cell.find("strong").text(label?"O":"X");
		cell.find("strong").css({"line-height": cellWidth+"px", "font-size": cellWidth*0.6+"px"});
	}
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
	for (var i = 0; i < data.pos.length; i++) {
		this.table.find('[cellId="'+data.pos[i]+'"]').addClass("text-primary");
	}
	this.disableAll();
	var that = this;
	$.when(this.table.find('strong').fadeOut(1000, function() {
		$(this).parent().removeClass("text-primary");
		$(this).show();
	})).then(function() {
		that.clear();
	});
	console.log("game over win");
};

Table.prototype.doDraw = function() {
	this.disableAll();
	var that = this;
	this.table.find('strong').fadeOut(1000, function() {
		that.clear();
	});
	console.log("game over draw");
};