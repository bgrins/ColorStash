window.log = function(){
  if(this.console) {
    arguments.callee = arguments.callee.caller;
    var newarr = [].slice.call(arguments);
    (typeof console.log === 'object' ? log.apply.call(console.log, console, newarr) : console.log.apply(console, newarr));
  }
};

$(function() {
    var s = $("#pick1");
    var tb = $("#pick2");
    
    tb.bind("keyup change", function() {
        s.spectrum("set", $(this).val())
    });
    
	s.spectrum({
		flat: true,
		showInput: false,
		change: function(color) {
			$("#preview").css("background-color", color.toHexString());
		},
		move: function(color) {
			tb.val(color.toHexString());
		
		}
	});
});