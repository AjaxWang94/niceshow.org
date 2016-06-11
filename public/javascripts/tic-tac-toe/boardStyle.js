$(document).ready(function() {
	function tdResize() {
		$("td").each(function(){
			var width = $(this).width();
			$(this).height(width);
		});
	};
	tdResize();
	$(window).resize(tdResize);
});