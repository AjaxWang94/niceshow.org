var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Table = function(tableIndex) {
	this.index = tableIndex;
	this.init();
};

Table.events = {
	JOIN_TABLE: 'joinTable',
	CLEAR_BOARD: 'clearBoard',
	START_GAME: 'startGame',
	CELL_MARKED: 'cellMarked',
	SET_TURN: 'setTurn',
	QUIT_TABLE: 'quitTable',
	GAME_OVER: 'gameOver'
};

util.inherits(Table, EventEmitter);

Table.prototype.init = function() {
	this.players = [];
	this.initBoard();
	this.moves = 0;
	this.winner = {label: -1, name: undefined};
	this.winPos = undefined;
	this.timeoutObject = undefined;
};

Table.prototype.initBoard = function() {
	this.cells = [];
	for (var i = 0; i < 9; i++) {
		this.cells.push({label: -1, active: false});
	}
}

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
	if (this.winner.label != -1) {
		this.init();
		this.emit(Table.events.CLEAR_BOARD, {tableIndex: this.index});
	}

	this.players[player.label] = player;
	this.emit(Table.events.JOIN_TABLE, player);

	if (this.players[0] != undefined && this.players[1] != undefined) {
		this.enableBoard();
		this.emit(Table.events.START_GAME, this.players);
		this.timeoutObject = setTimeout(this.timeOut, 10000, this);
	}
};

Table.prototype.quit = function(player) {
	if (this.players[player.label].id === player.id) {
		if (this.players[0] != undefined && this.players[1] != undefined) {
			this.stopTimeCounter();
			var opponent = player.label ? 0 : 1;
			this.winner.label = opponent;
			this.winner.name = this.players[opponent].name;
			this.emit(Table.events.GAME_OVER, this);
			this.players = [];
			this.disableBoard();
		} else {
			this.players[player.label] = undefined;
			this.emit(Table.events.QUIT_TABLE, player);
		}
	}
}

Table.prototype.mark = function(label, cellId) {
	if (this.moves % 2 === label) {
		var cell = this.cells[cellId];
		if (cell.label === -1 && cell.active === true) {

			this.stopTimeCounter();

			cell.label = label;
			cell.active = false;
			this.moves++;

			var evt = {tableIndex: this.index, label: label, cellId: cellId};
			this.emit(Table.events.CELL_MARKED, evt);

			var res = this.checkWinner(label);
			if (res.win) {
				this.winner.label = label;
				this.winner.name = this.players[label].name;
				this.winPos = res.winPos;
				this.emit(Table.events.GAME_OVER, this);
				this.players = [];
				this.disableBoard();
			} else if (this.checkTie()) {
				this.winner.label = 2;
				this.emit(Table.events.GAME_OVER, this);
				this.players = [];
			} else {
				var opponent = label ? 0 : 1;
				this.emit(Table.events.SET_TURN, this.players[opponent]);
				this.timeoutObject = setTimeout(this.timeOut, 10000, this);
			}
		}
	}
};

Table.prototype.checkWinner = function(label) {

	var winPositions = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],

		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],

		[0, 4, 8],
		[6, 4, 2]
	];

	var winPos = [];

	var win = winPositions.some(function(win) {
		if (this.cells[win[0]].label === label) {
			var res = this.cells[win[1]].label === label && this.cells[win[2]].label === label;

			if (res) {
				winPos = win;
				return true;
			}
		}

		return false;
	}, this);

	return {
		win: win,
		winPos: winPos
	};
}

Table.prototype.checkTie = function() {
	return this.cells.every(function(cell) {
		return (cell.label != -1);
	}, this);
};

Table.prototype.timeOut = function(that) {
	that.stopTimeCounter();
	var label = (that.moves + 1) % 2;
	that.winner.label = label;
	that.winner.name = that.players[label].name;
	that.emit(Table.events.GAME_OVER, that);
	that.players = [];
	that.disableBoard();
}

Table.prototype.stopTimeCounter = function() {
	if (this.timeoutObject != undefined) {
		clearTimeout(this.timeoutObject);
	}
};

module.exports = Table;