window.log = function(){
  if(this.console) {
    arguments.callee = arguments.callee.caller;
    var newarr = [].slice.call(arguments);
    (typeof console.log === 'object' ? log.apply.call(console.log, console, newarr) : console.log.apply(console, newarr));
  }
};
var hasStorage = !!(localStorage && JSON);

function getPallet() {
    if (!hasStorage) { return { }; }
    return JSON.parse(localStorage["colors"] || "{ }");
}
function setPallet(c) {
    if (!hasStorage) { return; }
    localStorage["colors"] = JSON.stringify(c);
}
function setLastColor(c) {
    if (!hasStorage) { return; }
    localStorage["lastColor"] = c; 
}
function getLastColor() {
    return (hasStorage && localStorage["lastColor"]) || "ddf";
}
function redrawPallet() {
    var c = getPallet();
    var html = [];
    for (var i in c) {
        html.push("<li style='background-color:" + i + ";' title='" + i + "' />");
    }
    
    $("#pallet ul").html(html.join(''));   
}

function palletHas(hex) {
    return getPallet().hasOwnProperty(hex);
}
function palletAdd(hex) {
    var c = getPallet();
    c[hex] = { };
    setPallet(c);
    redrawPallet(c);
}
function palletRemove(hex) {
    var c = getPallet();
    if (c.hasOwnProperty(hex)) {
        delete c[hex];
    }
    setPallet(c);
    redrawPallet(c);
}

$(function() {
    var s = $("#pick1");
    var tb = $("#pick2");
    var url = $("#share input");
    var u = "http://localhost/~brian/colorstash/";
    var pallet = $("#pallet ul");
    tb.bind("keyup change", function() { setCurrentHex($(this).val()); });
    $("input[readonly]").click(function() { $(this).focus(); this.select(); });
    
    var hsl = $("#hsl input");
    var hex = $("#hex input");
    var rgb = $("#rgb input");
    var hsv = $("#hsv input");
    
    function change(color) {
        var hexVal = color.toHexString();
        $("#preview").css("background-color", hexVal);
        tb.css("border-color", hexVal);
        hsv.val(color.toHsvString());
        hex.val(color.toHexString());
        rgb.val(color.toRgbString());
        hsl.val(color.toHslString());
        url.val(u + hexVal);
        
        $("#preview").toggleClass("has", palletHas(hexVal));
    }
    
    function getCurrentHex() {
        return s.spectrum("get").toHexString();
    }
    function setCurrentHex(color, shouldUpdateTextbox) {
	   s.spectrum("set", color);
	   shouldUpdateTextbox && updateTextbox();
    }
    
    function updateTextbox(color) {
        tb.val((color || s.spectrum("get")).toHexString());
    }
    
	s.spectrum({
	    color: getLastColor(),
		flat: true,
		showInput: false,
		change: change,
		move: updateTextbox,
		show: updateTextbox
	});
	
	$("#preview a").click(function() {
	   var hex = getCurrentHex();
	   $(this).is(".add") ? palletAdd(hex) : palletRemove(hex);
       $("#preview").toggleClass("has", palletHas(hex));
	   return false;
	});
	
	$("#pallet").delegate("li", "click", function() {
	   setCurrentHex($(this).attr("title"));
	});
	
    $("body").toggleClass("nostorage", !hasStorage);
    redrawPallet();
    
    window.onunload = function() {
        setLastColor(getCurrentHex()); 
    }
});