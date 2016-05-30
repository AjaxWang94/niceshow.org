var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 *
 * @constructor
 */
var Table = function(tableIndex) {
	this.tableIndex = tableIndex;
	this.clear();
};

Table.prototype.clear = function() {
	this.players = [];
	this.isOnGame = false;
	this.currentTurn = 0;
	this.cells = [];
	for (var i = 0; i < 9; i++) {
		this.cells.push({label: -1, active: false});
	}
	this.timeoutObject;
};

Table.events = {
	JOIN_TABLE: 'joinTable',
	SET_TURN: 'setTurn',
	CELL_MARKED: 'cellMarked',
	WINNER: 'winner',
	DRAW: 'draw',
	QUIT: 'quit'
};

util.inherits(Table, EventEmitter);

Table.prototype.disableAll = function() {
	this.cells.forEach(function(cell) {
		cell.active = false;
	});
};

Table.prototype.enableTurn = function() {
	this.cells.forEach(function(cell) {
		if (cell + 1) {
			cell.active = true;
		}
	});
};

Table.prototype.checkTurn = function(socketId) {
	return this.players[this.currentTurn].id == playerId;
};

Table.prototype.quit = function(that) {
	// console.log(that.currentTurn + " quit");
	that.isOnGame = false;
	that.disableAll();
	that.emit(Table.events.QUIT, that.players[that.currentTurn]);
	that.players[that.currentTurn] = undefined;
	clearTimeout(that.timeoutObject);
}

Table.prototype.mark = function(cellId) {

	var cell = this.cells[cellId];

	if (!cell) {
		return false;
	}

	if (this.isOnGame && cell.active) {
		// stop former timeout
		if (this.timeoutObject) {
			clearTimeout(this.timeoutObject);
			// console.log("timeout stoped");
		}

		var player = this.players[this.currentTurn];
		var label = this.currentTurn;
		cell.label = label;
		cell.active = false;

		this.emit(Table.events.CELL_MARKED, {tableIndex: this.tableIndex, cellId: cellId, label: label});

		var res = this.checkWinner(label);
		if (res.win) {
			this.clear();
			console.log("Table " + this.tableIndex + " game over.");
			this.emit(Table.events.WINNER, {tableIndex: this.tableIndex, label: this.currentTurn, pos: res.pos});
		} else if (this.checkDraw()) {
			this.clear();
			console.log("Table " + this.tableIndex + " game over.");
			this.emit(Table.events.DRAW, {tableIndex: this.tableIndex});
		} else {
			this.currentTurn = (this.currentTurn + 1) % 2;
			this.emit(Table.events.SET_TURN, this.players[this.currentTurn]);
			this.timeoutObject = setTimeout(this.quit, 10000, this);
		}
	}
};

Table.prototype.checkWinner = function(label) {

	var winPosition = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],

		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],

		[0, 4, 8],
		[6, 4, 2]
	];

	var pos = [];

	var win = winPosition.some(function(win) {
		if (this.cells[win[0]].label === label) {
			var res = this.cells[win[1]].label === label && this.cells[win[2]].label === label;

			if (res) {
				pos = win;
				return true;
			}
		}

		return false;
	}, this);

	return {
		win: win,
		pos: pos
	};
}

Table.prototype.checkDraw = function() {
	return this.cells.every(function(cell) {
		return (cell.label + 1);
	}, this);
};

Table.prototype.addPlayer = function(player) {
	this.players[player.label] = player;
	this.isOnGame = this.players[0] != undefined && this.players[1] != undefined;
	this.emit(Table.events.JOIN_TABLE, player);

	if (this.isOnGame) {
		this.enableTurn();
		this.emit(Table.events.SET_TURN, this.players[this.currentTurn]);
	}
};

module.exports = Table;