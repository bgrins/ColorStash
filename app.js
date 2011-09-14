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
    
    var backgroundColor = "background-color";
    var borderColor = "border-color";
    
    var hsl = $("#hsl input"),
        hex = $("#hex input"),
        rgb = $("#rgb input"),
        hsv = $("#hsv input"),
        triad = $("#triad"), 
        tetrad = $("#tetrad"), 
        mono = $("#monochromatic"),
        shareInput = $("#share input"),
        preview = $("#preview");
    
    function change(color) {
        var hexVal = color.toHexString();
        
        preview.css(backgroundColor, hexVal);
        tb.css(borderColor, hexVal);
        shareInput.css(borderColor, hexVal);
        
        
        hsv.val(color.toHsvString());
        hex.val(hexVal);
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


// Spectrum
(function(s,f){function D(e,f){var g=r({},k,e);g.callbacks={move:n(g.move,f),change:n(g.change,f),show:n(g.show,f),hide:n(g.hide,f),beforeShow:n(g.beforeShow,f)};return g}function t(e,o){function g(a){if(j.showPallet){var b=[];E={};for(var c=0;c<a.length;c++){var d=tinycolor(a[c]).toHexString();E.hasOwnProperty(d)||(E[d]=b.push(a[c])-1)}u=b.slice(0,j.maxPalletSize);P.html(F(u,void 0))}}function a(){l.addClass("sp-dragging")}function c(){l.removeClass("sp-dragging")}function b(){q(G.val())}function d(){if(!z&&
w.beforeShow(p())!==!1){Q||(Q=!0);for(var a=0;a<m.length;a++)m[a].hide();z=!0;f(H).bind("click touchstart",h);f(s).bind("resize",Y);A.addClass("sp-active");l.show();k();I();Z=p();w.show(p())}}function h(){if(z&&!j.flat){z=!1;f(H).unbind("click touchstart",h);f(s).unbind("resize",Y);A.removeClass("sp-active");l.hide();var a=p();u.push(a.toHexString());g(u);$||i();w.hide(a)}}function q(a){a=tinycolor(a).toHsv();B=a.h;J=a.s;K=a.v;I()}function p(){return tinycolor({h:B,s:J,v:K})}function I(){aa();var a=
tinycolor({h:B,s:1,v:1});L.css("background-color",a.toHexString());a=p().toHexString();ea.css("background-color",a);C&&G.val(a);Q&&$&&i();j.showPallet&&P.html(F(u,E[a]))}function aa(){var a=J*n,c=x-K*x,a=Math.max(-v,Math.min(n-v,a-v)),c=Math.max(-v,Math.min(x-v,c-v));ba.css({top:c,left:a});ca.css({top:B*r-t})}function i(){var a=p();C&&y.val(a.toHexString());w.change(a)}function k(){n=L.width();x=L.height();v=ba.height();R.width();r=R.height();slideHelperHelperHeight=ca.height();j.flat||l.offset(M(l,
da));aa()}var j=D(o,e),w=j.callbacks,Y=N(k,100),z=!1,n=0,x=0,v=0,r=0,t=0,B=0,J=0,K=0,u=j.pallet.slice(0),E={},H=e.ownerDocument,fa=H.body,y=f(e),l=f(S,H).addClass(j.theme),L=l.find(".sp-color"),ba=l.find(".sp-drag-helper"),R=l.find(".sp-slide"),ca=l.find(".sp-slide-helper"),G=l.find(".sp-input"),P=l.find(".sp-pallet-container"),ga=l.find(".sp-cancel"),ha=l.find(".sp-choose"),C=y.is("input"),$=C&&(j.changeOnMove||j.flat),T=C&&!j.flat,A=T?f(U).addClass(j.theme):f([]),da=T?A:y,ea=A.find(".sp-preview"),
V=j.color||C&&y.val(),Z=!1,Q=!1;(function(){f.browser.msie&&l.find("*:not(input)").attr("unselectable","on");l.toggleClass("sp-flat",j.flat);l.toggleClass("sp-input-disabled",!j.showInput);l.toggleClass("sp-pallet-disabled",!j.showPallet);T&&y.hide().after(A);j.flat?y.after(l).hide():f(fa).append(l.hide());da.bind("click touchstart",function(a){z?h():d();a.stopPropagation();f(a.target).is("input")||a.preventDefault()});l.click(W);G.change(b);G.keydown(function(a){a.keyCode==13&&b()});ga.click(function(){q(Z);
h()});ha.click(function(){h()});O(R,function(a,c){B=c/r;I();w.move(p())},a,c);O(L,function(a,c){J=a/n;K=(x-c)/x;I();w.move(p())},a,c);V&&(q(V),u.push(V));g(u);j.flat&&d();P.delegate("span","click",function(){q(f(this).css("background-color"))})})();var X={show:d,hide:h,set:q,get:p};X.id=m.push(X)-1;return X}function M(e,o){var g=e.outerWidth(),a=e.outerHeight();o.outerWidth();var c=o.outerHeight(),b=e[0].ownerDocument,d=b.documentElement.clientWidth+f(b).scrollLeft(),b=b.documentElement.clientHeight+
f(b).scrollTop(),h=o.offset();h.top+=c;h.left-=Math.min(h.left,h.left+g>d&&d>g?Math.abs(h.left+g-d):0);h.top-=Math.min(h.top,h.top+a>b&&b>a?Math.abs(a+c-6):6);return h}function W(e){e.stopPropagation()}function n(e,f){var g=Array.prototype.slice,a=g.call(arguments,2);return function(){return e.apply(f,a.concat(g.call(arguments)))}}function O(e,o,g,a){function c(a){a.stopPropagation&&a.stopPropagation();a.preventDefault&&a.preventDefault();a.returnValue=!1}function b(a){if(q){if(n&&!(document.documentMode>=
9)&&!a.button)return d();var b=a.originalEvent.touches,h=b?b[0].pageY:a.pageY,b=Math.max(0,Math.min((b?b[0].pageX:a.pageX)-p.left,k)),h=Math.max(0,Math.min(h-p.top,i));m&&c(a);o.apply(e,[b,h])}}function d(){q&&(f(h).unbind(j),a.apply(e,arguments));q=!1}var o=o||function(){},g=g||function(){},a=a||function(){},h=e.ownerDocument||document,q=!1,p={},i=0,k=0,n=f.browser.msie,m="ontouchstart"in s,j={};j.selectstart=c;j.dragstart=c;j[m?"touchmove":"mousemove"]=b;j[m?"touchend":"mouseup"]=d;f(e).bind(m?
"touchstart":"mousedown",function(a){if(!(a.which?a.which==3:a.button==2)&&!q&&g.apply(e,arguments)!==!1)q=!0,i=f(e).height(),k=f(e).width(),p=f(e).offset(),f(h).bind(j),m?c(a):b(a)})}function N(e,f,g){var a;return function(){var c=this,b=arguments,d=function(){a=null;e.apply(c,b)};g&&clearTimeout(a);if(g||!a)a=setTimeout(d,f)}}function r(e){for(var f=Array.prototype.slice.call(arguments,1),g=0;g<f.length;g++){var a=f[g],c;for(c in a)a[c]!==void 0&&(e[c]=a[c])}return e}var k={color:!1,flat:!1,showInput:!1,
changeOnMove:!0,beforeShow:function(){},move:function(){},change:function(){},show:function(){},hide:function(){},showPallet:!1,maxPalletSize:12,theme:"sp-dark",pallet:["white","black"]},m=[],i=typeof f!="undefined",U="<div class='sp-replacer sp-cf'><div class='sp-preview'></div><div class='sp-dd'>&#9660;</div></div>",S=function(){var e="";if(f.browser.msie)for(var i=1;i<9;i++)e+="<div class='sp-ie-"+i+"'></div>";return["<div class='sp-container'><div class='sp-top'><div class='sp-fill'></div><div class='sp-top-inner'><div class='sp-color'><div class='sp-saturation'><div class='sp-value'><div class='sp-drag-helper'></div></div></div></div><div class='sp-slide'><div class='sp-slide-helper'></div>",
e,"</div></div></div><br style='clear:both;' /><div class='sp-pallet-container sp-cf'></div><div class='sp-input-container sp-cf'><input class='sp-input' type='text' spellcheck='false'  /><div><button class='sp-cancel sp-hide-small'>Cancel</button><button class='sp-choose sp-hide-small'>Choose</button><button class='sp-cancel sp-show-small'>X</button><button class='sp-choose sp-show-small'>\u2714</button></div></div></div>"].join("")}(),F=function(e,f){for(var g=[],a=0;a<e.length;a++){var c=a==f?
" class='sp-pallet-active' ":"";g.push('<span style="background-color:'+tinycolor(e[a]).toHexString()+';"'+c+"></span>")}return g.join("")};if(i)f.fn.spectrum=function(e,i){return typeof e=="string"?e=="get"?m[this.eq(0).data("spectrum.id")].get():this.each(function(){var g=m[f(this).data("spectrum.id")];e=="show"&&g.show();e=="hide"&&g.hide();e=="set"&&g.set(i)}):this.each(function(){var g=t(this,e);f(this).data("spectrum.id",g.id)})},f.fn.spectrum.processOnLoad=!0,f.fn.spectrum.processOnLoadOpts=
{},f(function(){f.fn.spectrum.processOnLoad&&f("input[type=spectrum]").spectrum(f.fn.spectrum.processOnLoadOpts)});s.spectrum=t})(this,jQuery);
var tinycolor=function(){var s,f,D,t,M;function W(a){var c={r:255,g:255,b:255},b=!1;if(typeof a=="string")if(a=a.replace(U,"").replace(S,"").toLowerCase(),o[a]&&(a=o[a]),a=="transparent")a={r:0,g:0,b:0,a:0};else var d,a=(d=s.exec(a))?{r:d[1],g:d[2],b:d[3]}:(d=f.exec(a))?{h:d[1],s:d[2],l:d[3]}:(d=D.exec(a))?{h:d[1],s:d[2],v:d[3]}:(d=t.exec(a))?{r:parseInt(d[1],16),g:parseInt(d[2],16),b:parseInt(d[3],16)}:(d=M.exec(a))?{r:parseInt(d[1]+""+d[1],16),g:parseInt(d[2]+""+d[2],16),b:parseInt(d[3]+""+d[3],
16)}:!1;if(typeof a=="object")if(a.hasOwnProperty("r")&&a.hasOwnProperty("g")&&a.hasOwnProperty("b"))c={r:k(a.r,255)*255,g:k(a.g,255)*255,b:k(a.b,255)*255},b=!0;else if(a.hasOwnProperty("h")&&a.hasOwnProperty("s")&&a.hasOwnProperty("v")){d=a.h;var c=a.s,a=a.v,h,e,g;d=k(d,360);var c=k(c,100),a=k(a,100),b=Math.floor(d*6),i=d*6-b;d=a*(1-c);var m=a*(1-i*c),c=a*(1-(1-i)*c);switch(b%6){case 0:h=a;e=c;g=d;break;case 1:h=m;e=a;g=d;break;case 2:h=d;e=a;g=c;break;case 3:h=d;e=m;g=a;break;case 4:h=c;e=d;g=a;
break;case 5:h=a,e=d,g=m}c={r:h*255,g:e*255,b:g*255};b=!0}else a.hasOwnProperty("h")&&a.hasOwnProperty("s")&&a.hasOwnProperty("l")&&(c=O(a.h,a.s,a.l),b=!0);return{ok:b,r:Math.min(255,Math.max(c.r,0)),g:Math.min(255,Math.max(c.g,0)),b:Math.min(255,Math.max(c.b,0))}}function n(a,c,b){var a=k(a,255),c=k(c,255),b=k(b,255),d=Math.max(a,c,b),h=Math.min(a,c,b),e,f=(d+h)/2;if(d==h)e=h=0;else{var g=d-h,h=f>0.5?g/(2-d-h):g/(d+h);switch(d){case a:e=(c-b)/g+(c<b?6:0);break;case c:e=(b-a)/g+2;break;case b:e=(a-
c)/g+4}e/=6}return{h:e,s:h,l:f}}function O(a,c,b){function d(a,c,b){b<0&&(b+=1);b>1&&(b-=1);return b<1/6?a+(c-a)*6*b:b<0.5?c:b<2/3?a+(c-a)*(2/3-b)*6:a}a=k(a,360);c=k(c,100);b=k(b,100);if(c==0)b=c=a=b;else var e=b<0.5?b*(1+c):b+c-b*c,f=2*b-e,b=d(f,e,a+1/3),c=d(f,e,a),a=d(f,e,a-1/3);return{r:b*255,g:c*255,b:a*255}}function N(a,c,b){var a=k(a,255),c=k(c,255),b=k(b,255),d=Math.max(a,c,b),e=Math.min(a,c,b),f,g=d-e;if(d==e)f=0;else{switch(d){case a:f=(c-b)/g+(c<b?6:0);break;case c:f=(b-a)/g+2;break;case b:f=
(a-c)/g+4}f/=6}return{h:f,s:d==0?0:g/d,v:d}}function r(a,c,b){function d(a){return a.length==1?"0"+a:a}return[d(e(a).toString(16)),d(e(c).toString(16)),d(e(b).toString(16))].join("")}function k(a,c){var b=typeof a==="string"&&a.indexOf("%")!=-1,a=Math.min(c,Math.max(0,parseFloat(a)));b&&(a*=c/100);if(Math.abs(a-c)<1.0E-6)return 1;else if(a>1)return a%c/parseFloat(c);return a}function m(a){return Math.min(1,Math.max(0,a))}var i=function(a){if(typeof a=="object"&&a.hasOwnProperty("_tc_id"))return a;
var a=W(a),c=a.r,b=a.g,d=a.b;return{ok:a.ok,_tc_id:F++,toHsv:function(){return N(c,b,d)},toHsvString:function(){var a=N(c,b,d);return"hsv("+Math.round(a.h*360)+", "+Math.round(a.s*100)+"%, "+Math.round(a.v*100)+"%)"},toHsl:function(){return n(c,b,d)},toHslString:function(){var a=n(c,b,d);return"hsl("+Math.round(a.h*360)+", "+Math.round(a.s*100)+"%, "+Math.round(a.l*100)+"%)"},toHex:function(){return r(c,b,d)},toHexString:function(){return"#"+r(c,b,d)},toRgb:function(){return{r:e(c),g:e(b),b:e(d)}},
toRgbString:function(){return"rgb("+e(c)+", "+e(b)+", "+e(d)+")"},toName:function(){return g[r(c,d,b)]||!1}}};i.version="0.4";var U=/^[\s,#]+/,S=/\s+$/,F=0,e=Math.round;i.equals=function(a,c){return i(a).toHex()==i(c).toHex()};i.desaturate=function(a,c){var b=tinycolor(a).toHsl();b.s-=(c||10)/100;b.s=m(b.s);return tinycolor(b)};i.saturate=function(a,c){var b=tinycolor(a).toHsl();b.s+=(c||10)/100;b.s=m(b.s);return tinycolor(b)};i.greyscale=function(a){return i.desaturate(a,100)};i.lighten=function(a,
c){var b=tinycolor(a).toHsl();b.l+=(c||10)/100;b.l=m(b.l);return tinycolor(b)};i.darken=function(a,c){var b=tinycolor(a).toHsl();b.l-=(c||10)/100;b.l=m(b.l);return tinycolor(b)};i.triad=function(a){a=tinycolor(a).toRgb();return[tinycolor({r:a.r,g:a.g,b:a.b}),tinycolor({r:a.b,g:a.r,b:a.g}),tinycolor({r:a.g,g:a.b,b:a.r})]};i.tetrad=function(a){a=tinycolor(a).toRgb();return[tinycolor({r:a.r,g:a.g,b:a.b}),tinycolor({r:a.b,g:a.r,b:a.g}),tinycolor({r:a.g,g:a.b,b:a.r}),tinycolor({r:a.r,g:a.b,b:a.r})]};i.monochromatic=
function(a,c){for(var c=c||6,b=tinycolor(a).toHsv(),d=[];c--;)d.push(tinycolor(b)),b.v+=0.2,b.v%=1;return d};i.readable=function(a,c){var b=tinycolor(a).toRgb(),d=tinycolor(c).toRgb();return(d.r-b.r)*(d.r-b.r)+(d.g-b.g)*(d.g-b.g)+(d.b-b.b)*(d.b-b.b)>10404};var o=i.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"00ffff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000000",blanchedalmond:"ffebcd",blue:"0000ff",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",cadetblue:"5f9ea0",
chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"00ffff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",
dimgray:"696969",dodgerblue:"1e90ff",feldspar:"d19275",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"ff00ff",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",grey:"808080",green:"008000",greenyellow:"adff2f",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",
lightgoldenrodyellow:"fafad2",lightgrey:"d3d3d3",lightgreen:"90ee90",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslateblue:"8470ff",lightslategray:"778899",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"00ff00",limegreen:"32cd32",linen:"faf0e6",magenta:"ff00ff",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370d8",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",
mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"d87093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"ff0000",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",
salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",violetred:"d02090",wheat:"f5deb3",white:"ffffff",whitesmoke:"f5f5f5",yellow:"ffff00",yellowgreen:"9acd32"},g=function(a){var c={},b;for(b in a)a.hasOwnProperty(b)&&(c[a[b]]=b);return c}(o);s=RegExp("rgb[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?");
f=RegExp("hsl[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?");D=RegExp("hsv[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?");M=/^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/;t=/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/;return i}();