$(document).ready(function() {
	
	function formatText(text) {
		var width = text.parent().width();
		text.css({"line-height": width+"px", "font-size": width*0.6+"px"});
	}
	function tdResize() {
		$("td").each(function(){
			$(this).css({"border-width": $(this).width()*0.05+"px"});
			$(this).height($(this).width());
			formatText($(this).find("strong"));
		});
	};
	tdResize();
	$(window).resize(tdResize);

});