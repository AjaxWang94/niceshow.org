$(document).ready(function() {

	function formatText(text) {
		text.find("strong").css({"line-height": text.width()+"px", "font-size": text.width()*0.6+"px"});
	}
	function tdResize() {
		$("td").each(function(){
			$(this).height($(this).width());
			formatText($(this));
		});
	};
	tdResize();
	$(window).resize(tdResize);

	$("td").hover(
		function() {
			if ($(this).children().length === 0) {
				$(this).html("<strong>X</strong>");
				$(this).find("strong").addClass("hover");
				formatText($(this));
			}
		},
		function() {
			if ($(this).find("strong").hasClass("hover")) {
				$(this).empty();
			}
		}
	);

	$("td").click(function() {
		if ($(this).find("strong").hasClass("hover")) {
			$(this).html("<strong>X</strong>");
			formatText($(this));
		}
	});

});