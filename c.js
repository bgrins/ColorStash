$.fn.tc = $.fn.toggleClass;
$.fn.rc = $.fn.removeClass;
$.fn.ac = $.fn.addClass;

$(function() {

    
var win = window,
    document = win.document,
    tinycolor = win.tinycolor,
    localStorage = win.localStorage,
    JSON = win.JSON;
    
var rangeTest = document.createElement("input");
rangeTest.setAttribute('type', "range");
    
var hasStorage = !!(localStorage && JSON),
    hasTouch = ('ontouchstart' in window),
    s = document.createElement("input"),
    hasSlider = !hasTouch && rangeTest.type == "range",
    currentAlpha = 1,
    body = $(document.body).tc("ns", !hasStorage).tc("noslider", !hasSlider),
    defaultPallet = '{ "#3126c1": { }, "#c8901e": { }, "#c81e59": { } }',
    colorStorageName = "colors",
    CLICK = hasTouch ? "touchstart" : "click",
    lastColorName = "lc1",
    fromScheme = "fromScheme",
    BACKGROUND_COLOR = "background-color",
    BORDER_COLOR = "border-color",
    location = win.location,
    spec = $("#spec"),
    current = $("#current"),
    pallet = $("#pa"),
    hsl = $("#hsl"),
    hex = $("#hex"),
    rgb = $("#rgb"),
    hsv = $("#hsv"),
    ie = $("#ie"),
    analogous = $("#an"), 
    splitcomplement = $("#sc"), 
    tetrad = $("#tetrad"),  
    triad = $("#triad"), 
    mono = $("#mono"),
    modifications = $("#mod"),
    shareInput = $("#share input"),
    preview = $("#prev"),
    schemeContainer = $("#scheme"),
    slider = $("#a"),
    readonlyInputs = $("input[grab]").attr("spellcheck", "false");

current.bind("keyup change", function() { setCurrentHex($(this).val(), true); updateSchemes(); });
slider.bind("change", function() {
    currentAlpha = $(this).val() / 100;
    change(tinycolor(getCurrentHex()));
});
// iphone wont let you copy text out of readonly input
if (!hasTouch) {
    readonlyInputs.attr("readonly", "true").bind(CLICK, function() { $(this).focus(); this.select(); });
}
initDragDrop();
function change(color) {
    var hexVal = color.toHexString();
    var fullColor = tinycolor($.extend(color.toRgb(), { a: currentAlpha }));
    var fullRgb = fullColor.toRgbString();
    var hsvVal = color.toHsv();
    var fullFilter = fullColor.alpha < 1 ? fullColor.toFilter() : false;
    
    body.tc("has", palletHas(hexVal)).tc("contrast", ( hsvVal.v > .6)).css(
        BACKGROUND_COLOR, tinycolor($.extend({}, hsvVal, {a: .2})).toRgbString()
    );
    
    preview.css(BACKGROUND_COLOR, fullRgb);
    if (fullFilter && $.browser.msie) {
        preview.css("filter", fullColor.toFilter());
    }
    
    redrawPallet(hexVal);
    
    shareInput.css(BORDER_COLOR, hexVal).
        val(location.href.split('#')[0] + hexVal);
    
    hsv.val(fullColor.toHsvString());
    ie.val(fullFilter || "Will show IE filter if alpha is used");
    hex.val(hexVal);
    rgb.val(fullRgb);
    hsl.val(fullColor.toHslString());
}

function getCurrentHex() {
    return spec.spectrum("get").toHexString();
}
function setCurrentHex(color, noTextbox, noSchemes) {
    var tiny = tinycolor(color);
    var ok = tiny.ok;
    if (tiny.alpha && tiny.alpha < 1) { currentAlpha = tiny.alpha; slider.val(currentAlpha * 100); }
    else { currentAlpha = 1; slider.val(100); }
    spec.spectrum("set", tiny);
    !noTextbox && updateTextbox();
    !noSchemes && updatePartial();
    schemeContainer.tc("vhide", !ok);
    return ok;
}

function updateTextbox(color) {
    current.val((color || spec.spectrum("get")).toHexString());
}
function updateFull(color) {
    var tiny = color || spec.spectrum("get");
    updatePartial(tiny);
    updateTextbox(tiny);
}
function updatePartial(color) {
    var tiny = color || spec.spectrum("get");
    body.rc(fromScheme);
    schemeContainer.find("li").rc("active");
    updateSchemes(tiny);
}

spec.spectrum({
    color: getLastColor(),
    change: change,
    move: function(color) {
        // reset alpha if there is no slider when they move
        if (!hasSlider) { currentAlpha = 1; }
        updateFull(color);
    },
    show: updateFull
});

redrawPallet(getCurrentHex());

$("button").bind(CLICK, function() {
   var hex = getCurrentHex();
   this.id == "add" && palletAdd(hex);
   this.id == "rm" && palletRemove(hex);
   this.id == "rl" && updatePartial();

   $(body).tc("has", palletHas(hex));
   return false;
});

pallet.delegate("li", CLICK, function(e) {
   setCurrentHex(this.title);
   return false;
});

win.onhashchange = function() {
    setCurrentHex(getLastColor());
}
win.onunload = function() {
    setLastColor(getCurrentHex()); 
}
	
// Only keep the scheme color if they click on it
// Wait to update schemes until they press add
var stored;

schemeContainer.delegate("li", CLICK, function() {
   setCurrentHex(this.title, false, true);
   $("#scheme li").rc("active");
   $(this).ac("active");
   stored = getCurrentHex();
   body.ac(fromScheme);
   return false;
});

function schemeTmpl(e) {
    var hex = e.toHexString();
    return '<li style="background:'+hex+'" title="'+hex+'" />'
}
function updateSchemes(tiny) {
    var tiny = tiny || spec.spectrum("get");
    analogous.html($.map(tinycolor.analogous(tiny, 5, 10), schemeTmpl).join(''));
    splitcomplement.html($.map(tinycolor.splitcomplement(tiny), schemeTmpl).join(''));
    triad.html($.map(tinycolor.triad(tiny), schemeTmpl).join(''));
    tetrad.html($.map(tinycolor.tetrad(tiny), schemeTmpl).join(''));
    mono.html($.map(tinycolor.monochromatic(tiny, 5), schemeTmpl).join(''));
}
    
function getPallet() {
    if (!hasStorage) { return {}; }
    return JSON.parse(localStorage[colorStorageName] || defaultPallet);
}
function setPallet(c) {
    if (!hasStorage) { return; }
    localStorage[colorStorageName] = JSON.stringify(c);
}
function setLastColor(c) {
    if (!hasStorage) { return; }
    localStorage[lastColorName] = c; 
}
function getLastColor() {
    var fromHash = tinycolor(location.hash);
    if (fromHash.ok) { return fromHash.toHexString(); }
    return (hasStorage && localStorage[lastColorName]) || "2525c4";
}
        
function redrawPallet(active) {
    var c = getPallet();
    var html = [];
    for (var i in c) {
        var cl = i == active ? " class='active' " : "";
        html.push("<li style='background-color:" + i + ";' title='" + i + "' " + cl + " />");
    }
    
    pallet.html(html.join('')); 
}

function palletHas(hex) {
    return getPallet().hasOwnProperty(hex);
}
function palletAdd(hex) {
    var c = getPallet();
    c[hex] = { };
    setPallet(c);
    redrawPallet(hex);
}
function palletRemove(hex) {
    var c = getPallet();
    if (c.hasOwnProperty(hex)) {
        delete c[hex];
    }
    setPallet(c);
    redrawPallet();
}

// Some drag/drop crap here
function getThumbnail(img, maxWidth, maxHeight) {

	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");
	
	var ratio = 1;
	if (img.width > maxWidth) {
	    ratio = maxWidth / img.width;
	}
	if ((img.height * ratio) > maxHeight) {
	    ratio = maxHeight / img.height;
	}

	canvas.width = img.width * ratio;
	canvas.height = img.height * ratio;
	
	ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
	return canvas;
}


function initDragDrop() {

    var dropZone = $("body");
    var fileInput = $("#pickimage");
    var imageContainer = $("#image");
    var imageEyedropper = $("#image .sp-dragger");
    
    if (!window.FileReader || !document.createElement('canvas').getContext) {
        dropZone.addClass("nofiles");
        return;
    }
    
    function loadImage(img) {
        console.log("ere");
        
        dropZone.addClass("file");
        var canvas = getThumbnail(img, $("#files").width(), $("#files").height());
        var context = canvas.getContext("2d");
        
        imageContainer.find("canvas").remove();
        imageContainer.append(canvas);
        
        var canvasHeight = canvas.height;
        var canvasWidth = canvas.width;
        var dragHeight = imageEyedropper.height();
        var dragWidth = imageEyedropper.width();
        
        $.fn.spectrum.draggable(canvas, function(dragX, dragY) {
            drawPx(dragX, dragY)
        });
        drawPx(0, 0);
        function drawPx(x, y) {
            x = Math.min(x, canvasWidth -1);
            y = Math.min(y, canvasHeight -1);
            var imgd = context.getImageData(x, y, 1, 1).data;    
                              
            setCurrentHex({r: imgd[0], g: imgd[1], b: imgd[2], a: imgd[3] });
            imageEyedropper.css({
                top: y - dragHeight,
                left: x - dragWidth
            });
        
        }
    }
  function handleFileSelect(files) {
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
        
            if (!f.type.match('image.*')) {
                continue;
            }
            
            var reader = new FileReader();
            
            reader.onload = (function(theFile) {
              return function(e) {
              
                var img = new Image(); 
                img.onload = function() {
                    loadImage(img);
                }
                img.src =  e.target.result;
              };
            })(f);
            
            reader.readAsDataURL(f);
            
            // Only read one file
            break;
        }
        
        return false;
  }


    dropZone.bind("dragenter dragover", false);
    dropZone.bind("drop", function(e) {
        e.stopPropagation();
        e.preventDefault();
        handleFileSelect(e.originalEvent.dataTransfer.files);
    });
  
    $("#file-controls button").click(function() {
        dropZone.removeClass("file");
    });
    
    fileInput.change(function(e) {
        handleFileSelect(e.originalEvent.target.files);
    });
	
}

});



// TinyColor.js - https://github.com/bgrins/TinyColor - 2011 Brian Grinstead - v0.4.3
(function(window) {

var tc = _tinycolor;
tc.version = "0.4.3";

var trimLeft = /^[\s,#]+/, 
	trimRight = /\s+$/,
	tinyCounter = 0,
	math = Math,
	math_round = math.round,
	math_min = math.min,
	math_max = math.max,
	parseFloat = window.parseFloat;

function _tinycolor (color, opts) {
	
	// If input is already a tinycolor, return itself
	if (typeof color == "object" && color.hasOwnProperty("_tc_id")) {
	   return color;
	}
	
	// If input is an object, force 1 into "1.0" to handle ratios properly
	// String input requires "1.0" as input, so 1 will be treated as 1
	if (typeof color == "object" && (!opts || !opts.skipRatio)) {
        for (var i in color) {
            if (color[i] === 1) {
                color[i] = "1.0";
            }
        }
	}
	
	var rgb = inputToRGB(color);
	var r = rgb.r, g = rgb.g, b = rgb.b, a = parseFloat(rgb.a);
	
	// Don't let the range of [0,255] come back in [0,1].
	// Potentially lose a little bit of precision here, but will fix issues where
	// .5 gets interpreted as half of the total, instead of half of 1
	if (r < 1) { r = math_round(r); }
	if (g < 1) { g = math_round(g); }
	if (b < 1) { b = math_round(b); }
	
	return {
		ok: rgb.ok,
		_tc_id: tinyCounter++,
		alpha: a,
		toHsv: function() {
			return rgbToHsv(r, g, b);
		},
		toHsvString: function() {
			var hsv = rgbToHsv(r, g, b);
			var h = math_round(hsv.h * 360), s = math_round(hsv.s * 100), v = math_round(hsv.v * 100);
			return "hsv(" + h + ", " + s + "%, " + v + "%)";
		},
		toHsl: function() {
			return rgbToHsl(r, g, b);
		},
		toHslString: function() {
			var hsl = rgbToHsl(r, g, b);
			var h = math_round(hsl.h * 360), s = math_round(hsl.s * 100), l = math_round(hsl.l * 100);
		    return (a == 1) ? 
		      "hsl("  + h + ", " + s + "%, " + l + "%)" : 
		      "hsla(" + h + ", " + s + "%, " + l + "%, "+ a + ")";
		},
		toHex: function() {
			return rgbToHex(r, g, b);
		},
		toHexString: function() {
			return '#' + rgbToHex(r, g, b);
		},
		toRgb: function() {
			return { r: math_round(r), g: math_round(g), b: math_round(b) };
		},
		toRgbString: function() {
		    return (a == 1) ? 
		      "rgb("  + math_round(r) + ", " + math_round(g) + ", " + math_round(b) + ")" :
		      "rgba(" + math_round(r) + ", " + math_round(g) + ", " + math_round(b) + ", " + a + ")";
		},
		toName: function() {
			return hexNames[rgbToHex(r, b, g)] || false;
		},
		toFilter: function() {
            var hex = rgbToHex(r, g, b);
            var alphaHex = Math.round(parseFloat(a) * 255).toString(16);
            return "progid:DXImageTransform.Microsoft.gradient(startColorstr=#" +
                alphaHex + hex + ",endColorstr=#" + alphaHex + hex + ")";         
		}
	};
}

function inputToRGB(color) {

	var rgb = { r: 255, g: 255, b: 255 };
	var a = 1;
	var ok = false;
	
	if (typeof color == "string") {
		color = stringInputToObject(color);
	}
	if (typeof color == "object") {
		if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
			rgb = rgbToRgb(color.r, color.g, color.b);
			ok = true;
		}
		else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v")) {
			rgb = hsvToRgb(color.h, color.s, color.v);
			ok = true;
		}
		else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("l")) {
			var rgb = hslToRgb(color.h, color.s, color.l);
			ok = true;
		}
		
		if (color.hasOwnProperty("a")) {
            a = color.a;
		}
	}
	
	return {
		ok: ok,
		r: math_min(255, math_max(rgb.r, 0)),
		g: math_min(255, math_max(rgb.g, 0)),
		b: math_min(255, math_max(rgb.b, 0)),
		a: a
	};
}


// Handle bounds / percentage checking to conform to CSS color spec http://www.w3.org/TR/css3-color/
function rgbToRgb(r, g, b){	
	return { 
		r: bound01(r, 255) * 255, 
		g: bound01(g, 255) * 255,
		b: bound01(b, 255) * 255
	};
}

// rgbToHsl, rgbToHsv, hslToRgb, hsvToRgb modified from: 
// http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript

/** 
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] or [0, 1] and
 * returns h, s, l in [0,1]
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl(r, g, b){
	
	r = bound01(r, 255);
	g = bound01(g, 255);
	b = bound01(b, 255);
	
    var max = math_max(r, g, b), min = math_min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h, s: s, l: l };
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] or [0, 360] and [0, 100] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

	h = bound01(h, 360);
	s = bound01(s, 100);
	l = bound01(l, 100);
	
    function hue2rgb(p, q, t){
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }
    
    if(s == 0){
        r = g = b = l; // achromatic
    }else{

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return { r: r * 255, g: g * 255, b: b * 255 };
}

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] or [0, 1] and
 * returns h, s, v in [0,1]
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSV representation
 */
function rgbToHsv(r, g, b){

	r = bound01(r, 255);
	g = bound01(g, 255);
	b = bound01(b, 255);
	
    var max = math_max(r, g, b), min = math_min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if(max == min){
        h = 0; // achromatic
    }else{
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h, s: s, v: v };
}


/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] or [0, 360] and [0, 100] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
 function hsvToRgb(h, s, v){
    var r, g, b;
    
	h = bound01(h, 360);
	s = bound01(s, 100);
	v = bound01(v, 100);

    var i = math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
    
    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    
    return {r: r * 255, g: g * 255, b: b * 255};
}

function rgbToHex(r, g, b) {
	function pad(c) {
		return c.length == 1 ? '0' + c : c;
	}	
	return [ 
		pad(math_round(r).toString(16)),
		pad(math_round(g).toString(16)),
		pad(math_round(b).toString(16))
	].join("");
}


tc.equals = function(color1, color2) {
	return tc(color1).toHex() == tc(color2).toHex();
};

// Thanks to less.js for some functions: 
// https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js
tc.desaturate = function (color, amount) {
    var hsl = tc(color).toHsl();
    hsl.s -= ((amount || 10) / 100);
    hsl.s = clamp01(hsl.s);
    return tc(hsl);
};
tc.saturate = function (color, amount) {
    var hsl = tc(color).toHsl();
    hsl.s += ((amount || 10) / 100);
    hsl.s = clamp01(hsl.s);
    return tc(hsl);
};
tc.greyscale = function(color) {
    return tc.desaturate(color, 100);
};
tc.lighten = function(color, amount) {
    var hsl = tc(color).toHsl();
    hsl.l += ((amount || 10) / 100);
    hsl.l = clamp01(hsl.l);
    return tc(hsl);
};
tc.darken = function (color, amount) {
    var hsl = tc(color).toHsl();
    hsl.l -= ((amount || 10) / 100);
    hsl.l = clamp01(hsl.l);
    return tc(hsl);
};
tc.complement = function(color) {
    var hsl = tc(color).toHsl();
    hsl.h = (hsl.h + .5) % 1;
    return tc(hsl);
};

tc.triad = function(color) {
    var hsl = tc(color).toHsl();
    var h = hsl.h * 360;
    return [
        tc(color),
        tc({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
        tc({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
    ];
};
tc.tetrad = function(color) {
    var hsl = tc(color).toHsl();
    var h = hsl.h * 360;
    return [
        tc(color),
        tc({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
        tc({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
        tc({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
    ];
};

// Thanks to xColor for some of the combinations, and the great isReadable function
// https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js
tc.splitcomplement = function(color) {
    var hsl = tc(color).toHsl();
    var h = hsl.h * 360;
    return [
        tc(color),
        tc({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
        tc({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
    ];
};
tc.analogous = function(color, results, slices) {
    results = results || 6;
    slices = slices || 30;
    
    var hsl = tc(color).toHsl();
    var part = 360 / slices
    var ret = [tc(color)];
    
    hsl.h *= 360;

    for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
        hsl.h = (hsl.h + part) % 360;
        ret.push(tc(hsl));
    }
    return ret;
};
tc.monochromatic = function(color, results) {
    results = results || 6;
    var hsv = tc(color).toHsv();
    var h = hsv.h, s = hsv.s, v = hsv.v;
    var ret = [];
        
    while (results--) {
        ret.push(tc({ h: h, s: s, v: v}));
        v = (v + .2) % 1;
    }
    
    return ret;
};
tc.readable = function(color1, color2) {
    var a = tc(color1).toRgb(), b = tc(color2).toRgb();
    return (
        (b.r - a.r) * (b.r - a.r) +
        (b.g - a.g) * (b.g - a.g) +
        (b.b - a.b) * (b.b - a.b)
    ) > 0x28A4;
};

var names = tc.names = {
    aliceblue: "f0f8ff",
    antiquewhite: "faebd7",
    aqua: "0ff",
    aquamarine: "7fffd4",
    azure: "f0ffff",
    beige: "f5f5dc",
    bisque: "ffe4c4",
    black: "000",
    blanchedalmond: "ffebcd",
    blue: "00f",
    blueviolet: "8a2be2",
    brown: "a52a2a",
    burlywood: "deb887",
    burntsienna: "ea7e5d",
    cadetblue: "5f9ea0",
    chartreuse: "7fff00",
    chocolate: "d2691e",
    coral: "ff7f50",
    cornflowerblue: "6495ed",
    cornsilk: "fff8dc",
    crimson: "dc143c",
    cyan: "0ff",
    darkblue: "00008b",
    darkcyan: "008b8b",
    darkgoldenrod: "b8860b",
    darkgray: "a9a9a9",
    darkgreen: "006400",
    darkgrey: "a9a9a9",
    darkkhaki: "bdb76b",
    darkmagenta: "8b008b",
    darkolivegreen: "556b2f",
    darkorange: "ff8c00",
    darkorchid: "9932cc",
    darkred: "8b0000",
    darksalmon: "e9967a",
    darkseagreen: "8fbc8f",
    darkslateblue: "483d8b",
    darkslategray: "2f4f4f",
    darkslategrey: "2f4f4f",
    darkturquoise: "00ced1",
    darkviolet: "9400d3",
    deeppink: "ff1493",
    deepskyblue: "00bfff",
    dimgray: "696969",
    dimgrey: "696969",
    dodgerblue: "1e90ff",
    firebrick: "b22222",
    floralwhite: "fffaf0",
    forestgreen: "228b22",
    fuchsia: "f0f",
    gainsboro: "dcdcdc",
    ghostwhite: "f8f8ff",
    gold: "ffd700",
    goldenrod: "daa520",
    gray: "808080",
    green: "008000",
    greenyellow: "adff2f",
    grey: "808080",
    honeydew: "f0fff0",
    hotpink: "ff69b4",
    indianred: "cd5c5c",
    indigo: "4b0082",
    ivory: "fffff0",
    khaki: "f0e68c",
    lavender: "e6e6fa",
    lavenderblush: "fff0f5",
    lawngreen: "7cfc00",
    lemonchiffon: "fffacd",
    lightblue: "add8e6",
    lightcoral: "f08080",
    lightcyan: "e0ffff",
    lightgoldenrodyellow: "fafad2",
    lightgray: "d3d3d3",
    lightgreen: "90ee90",
    lightgrey: "d3d3d3",
    lightpink: "ffb6c1",
    lightsalmon: "ffa07a",
    lightseagreen: "20b2aa",
    lightskyblue: "87cefa",
    lightslategray: "789",
    lightslategrey: "789",
    lightsteelblue: "b0c4de",
    lightyellow: "ffffe0",
    lime: "0f0",
    limegreen: "32cd32",
    linen: "faf0e6",
    magenta: "f0f",
    maroon: "800000",
    mediumaquamarine: "66cdaa",
    mediumblue: "0000cd",
    mediumorchid: "ba55d3",
    mediumpurple: "9370db",
    mediumseagreen: "3cb371",
    mediumslateblue: "7b68ee",
    mediumspringgreen: "00fa9a",
    mediumturquoise: "48d1cc",
    mediumvioletred: "c71585",
    midnightblue: "191970",
    mintcream: "f5fffa",
    mistyrose: "ffe4e1",
    moccasin: "ffe4b5",
    navajowhite: "ffdead",
    navy: "000080",
    oldlace: "fdf5e6",
    olive: "808000",
    olivedrab: "6b8e23",
    orange: "ffa500",
    orangered: "ff4500",
    orchid: "da70d6",
    palegoldenrod: "eee8aa",
    palegreen: "98fb98",
    paleturquoise: "afeeee",
    palevioletred: "db7093",
    papayawhip: "ffefd5",
    peachpuff: "ffdab9",
    peru: "cd853f",
    pink: "ffc0cb",
    plum: "dda0dd",
    powderblue: "b0e0e6",
    purple: "800080",
    red: "f00",
    rosybrown: "bc8f8f",
    royalblue: "4169e1",
    saddlebrown: "8b4513",
    salmon: "fa8072",
    sandybrown: "f4a460",
    seagreen: "2e8b57",
    seashell: "fff5ee",
    sienna: "a0522d",
    silver: "c0c0c0",
    skyblue: "87ceeb",
    slateblue: "6a5acd",
    slategray: "708090",
    slategrey: "708090",
    snow: "fffafa",
    springgreen: "00ff7f",
    steelblue: "4682b4",
    tan: "d2b48c",
    teal: "008080",
    thistle: "d8bfd8",
    tomato: "ff6347",
    turquoise: "40e0d0",
    violet: "ee82ee",
    wheat: "f5deb3",
    white: "fff",
    whitesmoke: "f5f5f5",
    yellow: "ff0",
    yellowgreen: "9acd32"
};

var hexNames = flip(names);

function flip(o) {
	var flipped = { };
	for (var i in o) {
		if (o.hasOwnProperty(i)) {
			flipped[o[i]] = i;
		}
	}
	return flipped;
}

function bound01(n, max) {
	// Handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
	// http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0
	if (typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1) { n = "100%"; }
    
	var processPercent = isPercentage(n);
	n = math_min(max, math_max(0, parseFloat(n)));
	
	// Automatically convert percentage into number
	if (processPercent) {
		n = n * (max / 100);
	}
	
	// Handle floating point rounding errors
	if ((math.abs(n - max) < 0.000001)) {
		return 1;
	}
	else if (n >= 1) {
		return (n % max) / parseFloat(max);
	}
	return n;
}

function clamp01(val) {
    return math_min(1, math_max(0, val));
}
function parseHex(val) {
    return parseInt(val, 16);
}
function isPercentage(n) {
	return typeof n === "string" && n.indexOf('%') != -1;
}

var matchers = (function() {

	// http://www.w3.org/TR/css3-values/#integers
	var CSS_INTEGER = "[-\\+]?\\d+%?"; 
	
	// http://www.w3.org/TR/css3-values/#number-value
	var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?"; 
	
	// Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
	var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")"; 
	
	// Actual matching... parentheses and commas are optional, but not required.  Whitespace can take the place of commas or opening paren
	var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
	var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
	
	return {
		rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
		rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
		hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
		hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
		hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
		hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
		hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
	};
})();

function stringInputToObject(color) {

    color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
    if (names[color]) {
        color = names[color];
    }
    if (color == 'transparent') { 
        return { r: 0, g: 0, b: 0, a: 0 }; 
    }
    
    // Try to match string input using regular expressions.  Keep most of the number bounding
    // out of this function - don't worry about [0,1] or [0,100] or [0,360] - just return 
    // an object and let the conversion functions handle that.  This way the result will
    // be the same whether the tinycolor is initialized with string or object.
    var match;
    if ((match = matchers.rgb.exec(color))) {
        return { r: match[1], g: match[2], b: match[3] };
    }
    if ((match = matchers.rgba.exec(color))) {
        return { r: match[1], g: match[2], b: match[3], a: match[4] };
    }
    if ((match = matchers.hsl.exec(color))) {
        return { h: match[1], s: match[2], l: match[3] };
    }
    if ((match = matchers.hsla.exec(color))) {
        return { h: match[1], s: match[2], l: match[3], a: match[4] };
    }
    if ((match = matchers.hsv.exec(color))) {
        return { h: match[1], s: match[2], v: match[3] };
    }
    if ((match = matchers.hex6.exec(color))) {
        return {
            r: parseHex(match[1]),
            g: parseHex(match[2]),
            b: parseHex(match[3])
        };
    }
    if ((match = matchers.hex3.exec(color))) {
        return {
            r: parseHex(match[1] + '' + match[1]),
            g: parseHex(match[2] + '' + match[2]),
            b: parseHex(match[3] + '' + match[3])
        };
    }
    
    return false;
}

window.tinycolor = tc;

})(this);


// Spectrum: The No Hassle Colorpicker
// https://github.com/bgrins/spectrum
// Author: Brian Grinstead
// License: MIT
// Requires: jQuery, spectrum.css

(function(window) {
    var defaultOpts = {
        color: false,
        flat: true,
        showInput: false,
        changeOnMove: true,
        beforeShow: noop,
        move: noop,
        change: noop,
        show: noop,
        hide: noop,
        theme: 'sp-dark'
    },
    spectrums = [],
    tinycolor = window.tinycolor,
    IE = $.browser.msie,
    markup = (function() {
        
        // IE does not support gradients with multiple stops, so we need to simulate            
        //  that for the rainbow slider with 8 divs that each have a single gradient
        var gradientFix = "";
        if (IE) {
            for (var i = 1; i < 9; i++) {
                gradientFix += "<div class='sp-" + i + "'></div>";
            }
        }
        
        return [
            "<div class='sp-container sp-flat'>",
                "<div class='sp-top sp-cf'>",
                    "<div class='sp-fill'></div>",
                    "<div class='sp-top-inner'>",
                        "<div class='sp-color'>",
                            "<div class='sp-sat'>",
                                "<div class='sp-val'>",
                                    "<div class='sp-dragger'></div>",
                                "</div>",
                            "</div>",
                        "</div>",
                        "<div class='sp-hue'>",
                            "<div class='sp-slider'></div>",
                            gradientFix,
                        "</div>",
                    "</div>",
                "</div>",
            "</div>"
        ].join("");
    })();
    
    function instanceOptions(o, callbackContext) {
        var opts = $.extend({ }, defaultOpts, o);
        opts.callbacks = {
            'move': bind(opts.move, callbackContext),
            'change': bind(opts.change, callbackContext),
            'show': bind(opts.show, callbackContext)
        };
        
        return opts;
    }
	
    function spectrum(element, o) {
        
        var opts = instanceOptions(o, element),
            flat = opts.flat,
            theme = opts.theme,
            callbacks = opts.callbacks,
            resize = reflow,
            visible = false,
            dragWidth = 0,
            dragHeight = 0,
            dragHelperHeight = 0,
            slideHeight = 0,
            slideWidth = 0,
            slideHelperHeight = 0,
            currentHue = 0,
            currentSaturation = 0,
            currentValue = 0,
            draggingClass = "sp-d",
            CLICK_TOUCHSTART = "click touchstart";
        
        var doc = element.ownerDocument,
            body = doc.body, 
            boundElement = $(element),
        	container = $(markup, doc).ac(theme),
            dragger = container.find(".sp-color"),
            dragHelper = container.find(".sp-dragger"),
            slider = container.find(".sp-hue"),
            slideHelper = container.find(".sp-slider"),
            isInput = boundElement.is("input"),
            changeOnMove = true,
            offsetElement = boundElement,
            initialColor = opts.color || (isInput && boundElement.val()),
            colorOnShow = false,
            hasOpened = false;

		function initialize() {
			
    	    if (IE) {
    	        container.find("*:not(input)").attr("unselectable", "on");
    	    }   
    	    
            	boundElement.after(container).hide();
    	    
    	    offsetElement.bind(CLICK_TOUCHSTART, function(e) {
    	        e.stopPropagation();
    	        
    	        if (!$(e.target).is("input")) {
    	        	e.preventDefault();
    	        }
    	    });
    	    
    	    // Prevent clicks from bubbling up to document.  This would cause it to be hidden.
    	    container.click(stopPropagation);
    	    
    	    draggable(slider, function(dragX, dragY) {
    	        currentHue = (dragY / slideHeight);
    	        updateUI();
                callbacks.move(get());
    	    }, dragStart, dragStop);
    	    
    	    draggable(dragger, function(dragX, dragY) {
    	        currentSaturation = dragX / dragWidth;
    	        currentValue = (dragHeight -     dragY) / dragHeight;
    	        updateUI();
                callbacks.move(get());
    	    }, dragStart, dragStop);
    	    
        	if (!!initialColor) {
        	    set(initialColor);
        	}
        	
        	if (flat) {
        	    show();
        	}
        	
		}
		
		function dragStart() {
		  container.ac(draggingClass);
		}
		function dragStop() {
		  container.rc(draggingClass);
		}
        
        function show() {
            if (visible) { return; }
            
            if (!hasOpened) {
            	hasOpened = true;
            }
            
            visible = true;
            
            $(window).bind("resize", resize);
            container.show();
            
            reflow();
            updateUI();
            
            colorOnShow = get();
            callbacks.show(get())
        }
        
        function set(color) {
            var newColor = tinycolor(color);
            var newHsv = newColor.toHsv();
            
            currentHue = newHsv.h;
            currentSaturation = newHsv.s;
            currentValue = newHsv.v;
            
            updateUI();
        }
        
        function get() {
            return tinycolor({ h: currentHue, s: currentSaturation, v: currentValue });
        }
        
        function updateUI() {
        
            updateHelperLocations();
            
            // Update dragger background color ("flat" because gradients take care of saturation
            // and value).
            var flatColor = tinycolor({ h: currentHue, s: 1, v: 1 });
            dragger.css("background-color", flatColor.toHexString());
            
            var realColor = get(),
            	realHex = realColor.toHexString();
                        
            	updateOriginalInput();
        }
        
        function updateHelperLocations() {
            var h = currentHue;
            var s = currentSaturation;
            var v = currentValue;
            
            // Where to show the little circle in that displays your current selected color
            var dragX = s * dragWidth;
            var dragY = dragHeight - (v * dragHeight);
            dragX = Math.max(
                -dragHelperHeight, 
                Math.min(dragWidth - dragHelperHeight, dragX - dragHelperHeight)
            );
            dragY = Math.max(
                -dragHelperHeight, 
                Math.min(dragHeight - dragHelperHeight, dragY - dragHelperHeight)
            );
            dragHelper.css({
                "top": dragY,
                "left": dragX
            });
            
            // Where to show the bar that displays your current selected hue
            var slideY = (currentHue) * slideHeight;
            slideHelper.css({
                "top": slideY - slideHelperHeight
            });
        
        }
        
        function updateOriginalInput() {
        	callbacks.change(get());
        }
        
        function reflow() {
            dragWidth = dragger.width();
            dragHeight = dragger.height();
            dragHelperHeight = dragHelper.height();
            slideWidth = slider.width();
            slideHeight = slider.height();
            slideHelperHelperHeight = slideHelper.height();
            
            
            updateHelperLocations();
        }
        
        initialize();
        
        var spect = {
            show: show,
            set: set,
            get: get
        };
        
        spect.id = spectrums.push(spect) - 1;
        
        return  spect;
    }
	
	
	/** 
	 * noop - do nothing
	 */
    function noop() { 
    
    }
    
    /**
     * stopPropagation - makes the code only doing this a little easier to read in line
     */
    function stopPropagation(e) {
        e.stopPropagation();
    }
    
    /**
     * Create a function bound to a given object
     * Thanks to underscore.js
     */
    function bind (func, obj) {
        var slice = Array.prototype.slice;
        var args = slice.call(arguments, 2);
        return function() {
            return func.apply(obj, args.concat(slice.call(arguments)));
        }
    }
    
    /**
     * Lightweight drag helper.  Handles containment within the element, so that
     * when dragging, the x is within [0,element.width] and y is within [0,element.height]
     */
    function draggable(element, onmove, onstart, onstop) {
        onmove = onmove || function() { };
        onstart = onstart || function() { };
        onstop = onstop || function() { };
        var doc = element.ownerDocument || document;
        var dragging = false;
        var offset = { };
        var maxHeight = 0;
        var maxWidth = 0;
        var IE = $.browser.msie;
        var hasTouch = ('ontouchstart' in window);
        
        var duringDragEvents = { };
        duringDragEvents["selectstart"] = prevent;
        duringDragEvents["dragstart"] = prevent;
        duringDragEvents[(hasTouch ? "touchmove" : "mousemove")] = move;
        duringDragEvents[(hasTouch ? "touchend" : "mouseup")] = stop;

        function prevent(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.returnValue = false;
        }
        
        function move(e) {
            if (dragging) {
                // Mouseup happened outside of window
                if (IE && !(document.documentMode >= 9) && !e.button) {
                    return stop();
                }
                
                var touches =  e.originalEvent.touches;
                var pageX = touches ? touches[0].pageX : e.pageX;
                var pageY = touches ? touches[0].pageY : e.pageY;
                
                var dragX = Math.max(0, Math.min(pageX - offset.left, maxWidth));
                var dragY = Math.max(0, Math.min(pageY - offset.top, maxHeight));
                
                if (hasTouch) {
                    // Stop scrolling in iOS
                    prevent(e);
                }
                
                onmove.apply(element, [dragX, dragY]); 
            } 
        }
        function start(e) { 
            var rightclick = (e.which) ? (e.which == 3) : (e.button == 2);
            var touches =  e.originalEvent.touches;
            
            if (!rightclick && !dragging) { 
                if (onstart.apply(element, arguments) !== false) {
                    dragging = true; 
                    maxHeight = $(element).height();
                    maxWidth = $(element).width();
                    offset = $(element).offset();
                    
                    $(doc).bind(duringDragEvents);
                    
                    if (!hasTouch) {
                        move(e);
                    }
                    else {
                        prevent(e);
                    }
                }
            }
        }
        function stop() { 
            if (dragging) { 
                $(doc).unbind(duringDragEvents);
                onstop.apply(element, arguments); 
            }
            dragging = false; 
        }
    
        $(element).bind(hasTouch ? "touchstart" : "mousedown", start);
    }
    /*
    function throttle(func, wait, debounce) {
        var timeout;
        return function() {
          var context = this, args = arguments;
          var throttler = function() {
            timeout = null;
            func.apply(context, args);
          };
          if (debounce) clearTimeout(timeout);
          if (debounce || !timeout) timeout = setTimeout(throttler, wait);
        };
    }
    */
    
    /**
     * Define a jQuery plugin
     */
    var dataID = "spectrum.id";
    var fnspectrum = $.fn.spectrum = function(opts, extra) {
        if (typeof opts == "string") {
            if (opts == "get") {
                return spectrums[this.eq(0).data(dataID)].get();
            }
            
            return this.each(function() {
                var spect = spectrums[$(this).data(dataID)];
                if (opts == "set")  { spect.set(extra); }
            });
        }
        
        // Initializing a new one
        return this.each(function() {
            var spect = spectrum(this, opts);
            $(this).data(dataID, spect.id);
        }); 
    };
    
    fnspectrum.load = true;
    fnspectrum.loadOpts = { };
    
    $(function() {
    	if (fnspectrum.load) {
    		$("input[type=spectrum]").spectrum(fnspectrum.loadOpts);
    	}
    });
    
    fnspectrum.draggable = draggable;
})(this);


