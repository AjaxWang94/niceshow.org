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
	this.players = ["", ""];
	this.isOnGame = false;
	this.currentTurn = 0;
	this.cells = [];
	for (var i = 0; i < 9; i++) {
		this.cells.push({label: -1, active: false});
	}
};

Table.events = {
	JOIN_TABLE: 'joinTable',
	SET_TURN: 'setTurn',
	CELL_MARKED: 'cellMarked',
	WINNER: 'winner',
	DRAW: 'draw'
};

util.inherits(Table, EventEmitter);

Table.prototype.disableAll = function() {
	this.cells.forEach(function(cell) {
		cell.active = false;
	});
};

Table.prototype.enableAll = function() {
	this.cells.forEach(function(cell) {
		cell.active = true;
	});
};

Table.prototype.checkTurn = function(socketId) {
	return this.players[this.currentTurn].id == playerId;
};

Table.prototype.mark = function(cellId) {

	var cell = this.cells[cellId];

	if (!cell) {
		return false;
	}

	if (this.isOnGame && cell.active) {
		var player = this.players[this.currentTurn];
		var label = this.currentTurn;
		cell.label = label;
		cell.active = false;

		this.emit(Table.events.CELL_MARKED, {tableIndex: this.tableIndex, cellId: cellId, label: label});

		// console.log(this.cells);

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
			var msg = {tableIndex: this.tableIndex, label: this.currentTurn};
			this.emit(Table.events.SET_TURN, msg);
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
			var res = this.cells[win[0]].label === this.cells[win[1]].label && this.cells[win[1]].label === this.cells[win[2]].label;

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

Table.prototype.addPlayer = function(label, playerId, name) {

	this.players[label] = name;
	this.isOnGame = this.players[0] && this.players[1];
	var msg = {tableIndex: this.tableIndex, label: label, playerId: playerId, name: name};
	this.emit(Table.events.JOIN_TABLE, msg);

	if (this.isOnGame) {
		this.enableAll();
		var opponent = label ? 0 : 1;
		var msg = {tableIndex: this.tableIndex, label: opponent};
		this.emit(Table.events.SET_TURN, msg);
	}
};

module.exports = Table;