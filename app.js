window.log = function(){
  if(this.console) {
    arguments.callee = arguments.callee.caller;
    var newarr = [].slice.call(arguments);
    (typeof console.log === 'object' ? log.apply.call(console.log, console, newarr) : console.log.apply(console, newarr));
  }
};
var hasStorage = !!(localStorage && JSON);
var defaultPallet = '{ "#3126c1": { }, "#c8901e": { }, "#c81e59": { }, "#98c39b": { } }';

function getPallet() {
    if (!hasStorage) { "" }
    return JSON.parse(localStorage["colors"] || defaultPallet);
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
    
    var hsl = $("#hsl input"),
        hex = $("#hex input"),
        rgb = $("#rgb input"),
        hsv = $("#hsv input"),
        triad = $("#triad"), 
        tetrad = $("#tetrad"), 
        mono = $("#monochromatic");
    
    function change(color) {
        var hexVal = color.toHexString();
        console.log("change", hexVal);
        $("#preview").css("background-color", hexVal);
        tb.css("border-color", hexVal);
        hsv.val(color.toHsvString());
        hex.val(color.toHexString());
        rgb.val(color.toRgbString());
        hsl.val(color.toHslString());
        url.val(u + hexVal);
        
        var h = color.toHsv();
        var isContrast = h.s < .3 && h.v > .6;
        $("#preview").toggleClass("has", palletHas(hexVal)).toggleClass("contrast", isContrast);
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
    
    function updatePartial(color) {
        var tiny = color || s.spectrum("get");
	   $("#preview").removeClass("fromScheme");
	   $(".schemer li").removeClass("active");
        updateTextbox(tiny);
        updateSchemes(tiny);
    }
    
	s.spectrum({
	    color: getLastColor(),
		flat: true,
		showInput: false,
		change: change,
		move: updatePartial,
		show: updatePartial
	});
	
	$("#preview a").click(function() {
	   var hex = getCurrentHex();
	   $(this).is(".add") && palletAdd(hex);
	   $(this).is(".remove") && palletRemove(hex);
	   $(this).is(".reload") && updatePartial();
    
       $("#preview").toggleClass("has", palletHas(hex));
	   return false;
	});
	
	$("#pallet").delegate("li", "click", function() {
	   setCurrentHex($(this).attr("title"), true);
	});
	
    $("body").toggleClass("nostorage", !hasStorage);
    redrawPallet();
    
    window.onunload = function() {
        setLastColor(getCurrentHex()); 
    }
    
    
	
	
	// Only keep the scheme color if they click on it
	// Wait to update schemes until they press add
	var stored;
	$(".schemer").hover(
	   function() { stored = getCurrentHex(); }, 
	   function() { setCurrentHex(stored, true); }
    );
	
    $(".schemer").delegate("li", "hover", function() {
	   if ($(".schemer li.active").length == 0) {
	       setCurrentHex($(this).attr("title"), true);
	   }
	   
	}).delegate("li", "click", function() {
	   setCurrentHex($(this).attr("title"), true);
	   $(".schemer li").removeClass("active");
	   $(this).addClass("active");
	   stored = getCurrentHex();
	   $("#preview").addClass("fromScheme");
	});
	
    function schemeTmpl(e) {
            var hex = e.toHexString();
            return '<li style="background:'+hex+'" title="'+hex+'" />'
    }
    function updateSchemes(tiny) {
        
        var combines = $(".schemer").toggleClass("invisible", !tiny.ok);
        
        triad.html($.map(tinycolor.triad(tiny), schemeTmpl).join(''));
        
        tetrad.html($.map(tinycolor.tetrad(tiny), schemeTmpl).join(''));
        
        mono.html($.map(tinycolor.monochromatic(tiny), schemeTmpl).join(''));
    }
});