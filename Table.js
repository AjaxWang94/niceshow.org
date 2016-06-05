var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Table = function(tableIndex) {
	this.tableIndex = tableIndex;

	this.players = [];
	this.currentTurn = -1;

	this.initBoard();
	this.result = -1;
	this.winPos = undefined;

	this.timeoutObject = undefined;
};

Table.events = {
	JOIN_TABLE: 'joinTable',
	START_GAME: 'startGame',
	CELL_MARKED: 'cellMarked',
	SET_TURN: 'setTurn',
	QUIT_TABLE: 'quitTable',
	WIN: 'win',
	TIE: 'tie'
};

util.inherits(Table, EventEmitter);

Table.prototype.initBoard = function() {
	this.cells = [];
	for (var i = 0; i < 9; i++) {
		this.cells.push({label: -1, active: false});
	}
};

Table.prototype.enableBoard = function() {
	this.cells.forEach(function(cell) {
		cell.active = true;
	});
};

Table.prototype.disableBoard = function() {
	this.cells.forEach(function(cell) {
		cell.active = false;
	});
};

Table.prototype.addPlayer = function(player) {
	this.players[player.label] = player;
	this.emit(Table.events.JOIN_TABLE, player);

	if (this.result != -1) {
		this.initBoard();
		this.result = -1;
		this.winPos = undefined;
	}

	if (this.players[0] != undefined && this.players[1] != undefined) {
		this.enableBoard();
		this.currentTurn = 0;
		this.emit(Table.events.START_GAME, this.players);
		this.timeoutObject = setTimeout(this.timeOut, 10000, this);
	}
};

Table.prototype.quit = function(player) {
	if (this.players[player.label].id === player.id) {
		if (this.players[0] != undefined && this.players[1] != undefined) {
			this.stopTimeCounter();
			var opponent = player.label ? 0 : 1;
			this.emit(Table.events.WIN, {players: this.players, winner: opponent});
			this.players = [];
			this.currentTurn = -1;
			this.disableBoard();
		} else {
			this.players[player.label] = undefined;
			this.emit(Table.events.QUIT_TABLE, player);
		}
	}
}

Table.prototype.mark = function(label, cellId) {
	if (this.currentTurn === label) {
		var cell = this.cells[cellId];
		if (cell.label === -1) {

			this.stopTimeCounter();

			cell.label = label;
			cell.active = false;

			var evt = {tableIndex: this.tableIndex, label: label, cellId: cellId};
			this.emit(Table.events.CELL_MARKED, evt);

			var res = this.checkWinner(label);
			if (res.win) {
				this.result = label;
				this.winPos = res.pos;
				this.emit(Table.events.WIN, {players: this.players, winner: label, pos: res.pos});
				this.players = [];
				this.currentTurn = -1;
				this.disableBoard();
			} else if (this.checkTie()) {
				this.result = 2;
				this.emit(Table.events.TIE, {players: this.players});
				this.players = [];
				this.currentTurn = -1;
			} else {
				this.currentTurn = (label + 1) % 2;
				this.emit(Table.events.SET_TURN, this.players[this.currentTurn]);
				this.timeoutObject = setTimeout(this.timeOut, 10000, this);
			}
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

Table.prototype.checkTie = function() {
	return this.cells.every(function(cell) {
		return (cell.label != -1);
	}, this);
};

Table.prototype.timeOut = function(that) {
	that.stopTimeCounter();
	that.result = (that.currentTurn + 1) % 2;
	that.emit(Table.events.WIN, {players: that.players, winner: that.result});
	that.players = [];
	that.currentTurn = -1;
	that.disableBoard();
}

Table.prototype.stopTimeCounter = function() {
	if (this.timeoutObject != undefined) {
		clearTimeout(this.timeoutObject);
		this.timeoutObject = undefined;
	}
};

module.exports = Table;