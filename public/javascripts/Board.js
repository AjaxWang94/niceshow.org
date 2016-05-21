/**
 *
 * @constructor
 */
var Board = function() {
	// this.dom.addEventListener('click', this.mark.bind(this));
	this.players = [];
	this.currentTurn = 0;
	this.ready = false;
};

Board.prototype.onMark = function(cellId){};

Board.prototype.init = function() {
	$("iframe").contents().find("td").click(this.mark.bind(this));
}

Board.prototype.mark = function(event) {
	var target = event.target;
	if (this.ready && target.getAttribute('active') === 'true') {
		this.onMark(parseInt(target.getAttribute('data-index')));
		this.disableAll();
	}
};

Board.prototype.doMark = function(cellId, label) {
	var cell = $("iframe").contents().find("td[data-index="+cellId+"]");
	cell.html("<strong>" + label + "</strong>");
	cell.attr({marked: "true", active: "false"});
	this.formatText(cell);
};

Board.prototype.formatText = function(text) {
	text.find("strong").css({"line-height": text.width()+"px", "font-size": text.width()*0.6+"px"});
}

Board.prototype.disableAll = function() {
	$("iframe").contents().find("td").each(function() {
		$(this).attr({active: "false"});
	});
};

Board.prototype.enableTurn = function() {
	$("iframe").contents().find("td").each(function() {
		if ($(this).attr("marked") === "false") {
			$(this).attr({active: "true"});
		}
	});
};

Board.prototype.doWinner = function(pos) {
	this.disableAll();
	console.log(pos);
	this.highlightCells(pos);
};

Board.prototype.highlightCells = function(pos) {
	pos.forEach(function(i) {
		$("iframe").contents().find('[data-index="'+i+'"]').addClass("text-primary");
	});
}

Board.prototype.doDraw = function() {
	console.log("draw...");
	// this.lowlightCells();
};

Board.prototype.addPlayer = function(player) {
	console.log("addPlayer");
	if (this.players.length < 2) {
		var isNew = this.players.filter(function(p) {
			return p.id == player.id;
		}).length === 0;

		if (isNew) {
			this.players.push(player);
			if (player.label === "X") {
				$("iframe").contents().find("#p1Score").text(player.label + ' ' + player.name);
			} else {
				$("iframe").contents().find("#p2Score").text(player.name + ' ' + player.label);
			}
		}
	}
};
