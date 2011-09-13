window.log = function(){
  if(this.console) {
    arguments.callee = arguments.callee.caller;
    var newarr = [].slice.call(arguments);
    (typeof console.log === 'object' ? log.apply.call(console.log, console, newarr) : console.log.apply(console, newarr));
  }
};

$(function() {
	console.log($("#pick1"));
	$("#pick1").spectrum({
		flat: true,
		change: function(color) {
			$("#preview").css("background-color", color.toHexString());
		}
	});
});