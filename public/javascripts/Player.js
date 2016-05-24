var Player = function() {
	this.id = "";
	this.name = "";
	this.init();
};

Player.prototype.init = function() {
	this.currentTable = -1;
	this.label = -1;
};