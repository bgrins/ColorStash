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
    
    $("#stats input").click(function() { $(this).focus(); this.select(); });
    var hsl = $("#hsl input");
    var hex = $("#hex input");
    var rgb = $("#rgb input");
    var hsv = $("#hsv input");
    
	s.spectrum({
		flat: true,
		showInput: false,
		change: function(color) {
		    var hexVal = color.toHexString();
			$("#preview").css("background-color", hexVal);
			tb.css("border-color", hexVal);
			hsv.val(color.toHsvString());
			hex.val(color.toHexString());
			rgb.val(color.toRgbString());
			hsl.val(color.toHslString());
		},
		move: function(color) {
			tb.val(color.toHexString());
		
		}
	});
});