
$.fn.tc = $.fn.toggleClass;
$.fn.rc = $.fn.removeClass;
$.fn.ac = $.fn.addClass;

$(function() {

var win = window,
    tinycolor = win.tinycolor,
    localStorage = win.localStorage,
    hasStorage = !!(localStorage && JSON),
    defaultPallet = '{ "#3126c1": { }, "#c8901e": { }, "#c81e59": { } }',
    colorStorageName = "colors",
    lastColorName = "lastColor",
    BACKGROUND_COLOR = "background-color",
    BORDER_COLOR = "border-color",
    LOCATION = location,
    spec = $("#spec"),
    current = $("#current"),
    pallet = $("#pa"),
    hsl = $("#hsl input"),
    hex = $("#hex input"),
    rgb = $("#rgb input"),
    hsv = $("#hsv input"),
    analogous = $("#an"), 
    splitcomplement = $("#sc"), 
    tetrad = $("#tetrad"), 
    mono = $("#mono"),
    modifications = $("#mod"),
    shareInput = $("#share input"),
    preview = $("#preview"),
    schemeContainer = $(".schemer");

current.bind("keyup change", function() { setCurrentHex($(this).val()); updateSchemes(); });
$("input[readonly]").click(function() { $(this).focus(); this.select(); });

function change(color) {
    var hexVal = color.toHexString();
    var hsvVal = color.toHsv();
    
    preview.css(BACKGROUND_COLOR, hexVal).
        tc("has", palletHas(hexVal)).
        tc("contrast", hsvVal.s < .3 && hsvVal.v > .6);
    redrawPallet(hexVal);
    shareInput.css(BORDER_COLOR, hexVal).
        val(LOCATION + hexVal);
    
    hsv.val(color.toHsvString());
    hex.val(hexVal);
    rgb.val(color.toRgbString());
    hsl.val(color.toHslString());
}

function getCurrentHex() {
    return spec.spectrum("get").toHexString();
}
function setCurrentHex(color, shouldUpdateTextbox) {
   var ok = tinycolor(color).ok;
   spec.spectrum("set", color);
   shouldUpdateTextbox && updateTextbox();
   schemeContainer.tc("vhide", !ok);
   return ok;
}

function updateTextbox(color) {
    current.val((color || spec.spectrum("get")).toHexString());
}

function updatePartial(color) {
    var tiny = color || spec.spectrum("get");
    preview.rc("fromScheme");
    $(".schemer li").rc("active");
    updateTextbox(tiny);
    updateSchemes(tiny);
}

spec.spectrum({
    color: getLastColor(),
    flat: true,
    showInput: false,
    change: change,
    move: updatePartial,
    show: updatePartial
});

redrawPallet(getCurrentHex());

preview.find("button").click(function() {
   var hex = getCurrentHex();
   this.id == "add" && palletAdd(hex);
   this.id == "rm" && palletRemove(hex);
   this.id == "rl" && updatePartial();

   preview.tc("has", palletHas(hex));
   return false;
});

pallet.delegate("li", "click", function() {
   setCurrentHex(this.title, true);
});

$("body").tc("ns", !hasStorage);

win.onhashchange = function() {
    setCurrentHex(getLastColor(), true);
}
win.onunload = function() {
    setLastColor(getCurrentHex()); 
}
	
// Only keep the scheme color if they click on it
// Wait to update schemes until they press add
var stored;
schemeContainer.hover(
   function() { stored = getCurrentHex(); }, 
   function() { setCurrentHex(stored, true); }
);

schemeContainer.delegate("li", "click", function() {
   setCurrentHex(this.title, true);
   $(".schemer li").rc("active");
   $(this).ac("active");
   stored = getCurrentHex();
   preview.ac("fromScheme");
});

function schemeTmpl(e) {
    var hex = e.toHexString();
    return '<li style="background:'+hex+'" title="'+hex+'" />'
}
function updateSchemes(tiny) {
    var tiny = tiny || spec.spectrum("get");
    var mods = [
        tiny,
        tinycolor.desaturate(tiny, 20), tinycolor.saturate(tiny, 20), 
        tinycolor.lighten(tiny, 20), tinycolor.darken(tiny, 20)
    ];
    modifications.html($.map(mods, schemeTmpl).join(''));
    analogous.html($.map(tinycolor.analogous(tiny, 5), schemeTmpl).join(''));
    splitcomplement.html($.map(tinycolor.splitcomplement(tiny), schemeTmpl).join(''));
    tetrad.html($.map(tinycolor.tetrad(tiny), schemeTmpl).join(''));
    mono.html($.map(tinycolor.monochromatic(tiny, 5), schemeTmpl).join(''));
}
    
function getPallet() {
    if (!hasStorage) { "" }
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
    var fromHash = tinycolor(LOCATION.hash);
    if (fromHash.ok) { return fromHash.toHexString(); }
    return (hasStorage && localStorage[lastColorName]) || "ddf";
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
/*
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

  function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
        
            if (!f.type.match('image.*')) {
                continue;
            }
            
            var reader = new FileReader();
            
            // Closure to capture the file information.
            reader.onload = (function(theFile) {
              return function(e) {
              
                var img = new Image(); 
                img.onload = function() {
                    console.log("ere");
                    var c = getThumbnail(img, $("#files").width(), $("#files").height());
                    $("#files").show();
                    $("#files div").empty().append(c);
                }
                img.src =  e.target.result;
              };
            })(f);
            
            reader.readAsDataURL(f);
            break;
        }
        
        return false;
            
  }

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
  }


  // Setup the dnd listeners.
  var dropZone = $("body");

  dropZone.bind("dragover", false);
  dropZone[0].addEventListener('drop', handleFileSelect, false);
      
    $("#files span").click(function() {
        $("#files").hide();
    })
  //document.getElementById('files').addEventListener('change', handleFileSelect, false);
	
}*/

});

// Spectrum: The No Hassle Colorpicker
// https://github.com/bgrins/spectrum
// Author: Brian Grinstead
// License: MIT
// Requires: jQuery, spectrum.css
(function(z,f){function Q(d,f){var e=w({},E,d);e.callbacks={move:q(e.move,f),change:q(e.change,f),show:q(e.show,f),hide:q(e.hide,f),beforeShow:q(e.beforeShow,f)};return e}function p(v,o){function e(a){if(j.showPallet){var b=[];K={};for(var c=0;c<a.length;c++){var m=tinycolor(a[c]).toHexString();K.hasOwnProperty(m)||(K[m]=b.push(a[c])-1)}x=b.slice(0,j.maxPalletSize);R.html(A(x,void 0))}}function a(){k.ac("sp-dragging")}function b(){k.rc("sp-dragging")}function c(){t(L.val())}function m(){if(!q&&
B.beforeShow(l())!==!1){S||(S=!0);for(var a=0;a<u.length;a++)u[a].hide();q=!0;f(M).bind("click touchstart",h);f(z).bind("resize",Y);F.ac("sp-active");k.show();Z();n();$=l();B.show(l())}}function h(){if(q&&!j.flat){q=!1;f(M).unbind("click touchstart",h);f(z).unbind("resize",Y);F.rc("sp-active");k.hide();var a=l();x.push(a.toHexString());e(x);aa||g();B.hide(a)}}function t(a){a=tinycolor(a).toHsv();G=a.h;N=a.s;O=a.v;n()}function l(){return tinycolor({h:G,s:N,v:O})}function n(){H();var a=
tinycolor({h:G,s:"1.0",v:"1.0"});P.css("background-color",a.toHexString());a=l().toHexString();ea.css("background-color",a);I&&L.val(a);S&&aa&&g();j.showPallet&&R.html(A(x,K[a]))}function H(){var a=N*p,b=C-O*C;a=Math.max(-y,Math.min(p-y,a-y));b=Math.max(-y,Math.min(C-y,b-y));ba.css({top:b,left:a});ca.css({top:G*w-E})}function g(){var a=l();I&&D.val(a.toHexString());B.change(a)}function Z(){p=P.width();C=P.height();y=ba.height();T.width();w=T.height();slideHelperHelperHeight=ca.height();j.flat||k.offset(J(k,
da));H()}var j=Q(o,v),B=j.callbacks,Y=U(Z,100),q=!1,p=0,C=0,y=0,w=0,E=0,G=0,N=0,O=0,x=j.pallet.slice(0),K={},M=v.ownerDocument,fa=M.body,D=f(v),k=f(r,M).ac(j.theme),P=k.find(".sp-color"),ba=k.find(".sp-drag-helper"),T=k.find(".sp-slide"),ca=k.find(".sp-slide-helper"),L=k.find(".sp-input"),R=k.find(".sp-pallet-container"),ga=k.find(".sp-cancel"),ha=k.find(".sp-choose"),I=D.is("input"),aa=I&&(j.changeOnMove||j.flat),V=I&&!j.flat,F=V?f(s).ac(j.theme):f([]),da=V?F:D,ea=F.find(".sp-preview"),
W=j.color||I&&D.val(),$=!1,S=!1;(function(){f.browser.msie&&k.find("*:not(input)").attr("unselectable","on");k.tc("sp-flat",j.flat);k.tc("sp-input-disabled",!j.showInput);k.tc("sp-pallet-disabled",!j.showPallet);V&&D.hide().after(F);j.flat?D.after(k).hide():f(fa).append(k.hide());da.bind("click touchstart",function(a){q?h():m();a.stopPropagation();f(a.target).is("input")||a.preventDefault()});k.click(i);L.change(c);L.keydown(function(a){a.keyCode==13&&c()});ga.click(function(){t($);
h()});ha.click(function(){h()});d(T,function(a,b){G=b/w;n();B.move(l())},a,b);d(P,function(a,b){N=a/p;O=(C-b)/C;n();B.move(l())},a,b);W&&(t(W),x.push(W));e(x);j.flat&&m();R.delegate("span","click",function(){t(f(this).css("background-color"))})})();var X={show:m,hide:h,set:t,get:l};X.id=u.push(X)-1;return X}function J(d,o){var e=d.outerWidth(),a=d.outerHeight();o.outerWidth();var b=o.outerHeight(),c=d[0].ownerDocument,m=c.documentElement.clientWidth+f(c).scrollLeft();c=c.documentElement.clientHeight+
f(c).scrollTop();var h=o.offset();h.top+=b;h.left-=Math.min(h.left,h.left+e>m&&m>e?Math.abs(h.left+e-m):0);h.top-=Math.min(h.top,h.top+a>c&&c>a?Math.abs(a+b-6):6);return h}function i(d){d.stopPropagation()}function q(d,f){var e=Array.prototype.slice,a=e.call(arguments,2);return function(){return d.apply(f,a.concat(e.call(arguments)))}}function d(d,o,e,a){function b(a){a.stopPropagation&&a.stopPropagation();a.preventDefault&&a.preventDefault();a.returnValue=!1}function c(a){if(t){if(g&&!(document.documentMode>=
9)&&!a.button)return m();var c=a.originalEvent.touches,h=Math.max(0,Math.min((c?c[0].pageX:a.pageX)-l.left,H));c=Math.max(0,Math.min((c?c[0].pageY:a.pageY)-l.top,n));i&&b(a);o.apply(d,[h,c])}}function m(){t&&(f(h).unbind(j),a.apply(d,arguments));t=!1}o=o||function(){};e=e||function(){};a=a||function(){};var h=d.ownerDocument||document,t=!1,l={},n=0,H=0,g=f.browser.msie,i="ontouchstart"in z,j={};j.selectstart=b;j.dragstart=b;j[i?"touchmove":"mousemove"]=c;j[i?"touchend":"mouseup"]=m;f(d).bind(i?"touchstart":
"mousedown",function(a){if(!(a.which?a.which==3:a.button==2)&&!t&&e.apply(d,arguments)!==!1)t=!0,n=f(d).height(),H=f(d).width(),l=f(d).offset(),f(h).bind(j),i?b(a):c(a)})}function U(d,f,e){var a;return function(){var b=this,c=arguments,m=function(){a=null;d.apply(b,c)};e&&clearTimeout(a);if(e||!a)a=setTimeout(m,f)}}function w(d){for(var f=Array.prototype.slice.call(arguments,1),e=0;e<f.length;e++){var a=f[e],b;for(b in a)a[b]!==void 0&&(d[b]=a[b])}return d}var E={color:!1,flat:!1,showInput:!1,changeOnMove:!0,
beforeShow:function(){},move:function(){},change:function(){},show:function(){},hide:function(){},showPallet:!1,maxPalletSize:12,theme:"sp-dark",pallet:["white","black"]},u=[],g=typeof f!="undefined",s="<div class='sp-replacer sp-cf'><div class='sp-preview'></div><div class='sp-dd'>&#9660;</div></div>",r=function(){var d="";if(f.browser.msie)for(var g=1;g<9;g++)d+="<div class='sp-ie-"+g+"'></div>";return["<div class='sp-container'><div class='sp-top'><div class='sp-fill'></div><div class='sp-top-inner'><div class='sp-color'><div class='sp-saturation'><div class='sp-value'><div class='sp-drag-helper'></div></div></div></div><div class='sp-slide'><div class='sp-slide-helper'></div>",
d,"</div></div></div><br style='clear:both;' /><div class='sp-pallet-container sp-cf'></div><div class='sp-input-container sp-cf'><input class='sp-input' type='text' spellcheck='false'  /><div><button class='sp-cancel sp-hide-small'>Cancel</button><button class='sp-choose sp-hide-small'>Choose</button><button class='sp-cancel sp-show-small'>X</button><button class='sp-choose sp-show-small'>\u2714</button></div></div></div>"].join("")}(),A=function(d,f){for(var e=[],a=0;a<d.length;a++){var b=a==f?
" class='sp-pallet-active' ":"";e.push('<span style="background-color:'+tinycolor(d[a]).toHexString()+';"'+b+"></span>")}return e.join("")};if(g)f.fn.spectrum=function(d,g){if(typeof d=="string"){if(d=="get")return u[this.eq(0).data("spectrum.id")].get();return this.each(function(){var e=u[f(this).data("spectrum.id")];d=="show"&&e.show();d=="hide"&&e.hide();d=="set"&&e.set(g)})}return this.each(function(){var e=p(this,d);f(this).data("spectrum.id",e.id)})},f.fn.spectrum.processOnLoad=!0,f.fn.spectrum.processOnLoadOpts=
{},f(function(){f.fn.spectrum.processOnLoad&&f("input[type=spectrum]").spectrum(f.fn.spectrum.processOnLoadOpts)});z.spectrum=p})(this,jQuery);
var tinycolor=function(){function z(a){var b={r:255,g:255,b:255},c=1,d=!1;typeof a=="string"&&(a=q(a));if(typeof a=="object"){if(a.hasOwnProperty("r")&&a.hasOwnProperty("g")&&a.hasOwnProperty("b"))b={r:i(a.r,255)*255,g:i(a.g,255)*255,b:i(a.b,255)*255},d=!0;else if(a.hasOwnProperty("h")&&a.hasOwnProperty("s")&&a.hasOwnProperty("v")){var h=a.h,f=a.s;b=a.v;var e,n,g;h=i(h,360);f=i(f,100);b=i(b,100);d=u.floor(h*6);var o=h*6-d;h=b*(1-f);var p=b*(1-o*f);f=b*(1-(1-o)*f);switch(d%6){case 0:e=b;n=f;g=h;break;
case 1:e=p;n=b;g=h;break;case 2:e=h;n=b;g=f;break;case 3:e=h;n=p;g=b;break;case 4:e=f;n=h;g=b;break;case 5:e=b,n=h,g=p}b={r:e*255,g:n*255,b:g*255};d=!0}else a.hasOwnProperty("h")&&a.hasOwnProperty("s")&&a.hasOwnProperty("l")&&(b=Q(a.h,a.s,a.l),d=!0);a.hasOwnProperty("a")&&(c=i(a.a,1))}return{ok:d,r:s(255,r(b.r,0)),g:s(255,r(b.g,0)),b:s(255,r(b.b,0)),a:c}}function f(a,b,c){a=i(a,255);b=i(b,255);c=i(c,255);var d=r(a,b,c),h=s(a,b,c),f,e=(d+h)/2;if(d==h)f=h=0;else{var g=d-h;h=e>0.5?g/(2-d-h):g/(d+h);
switch(d){case a:f=(b-c)/g+(b<c?6:0);break;case b:f=(c-a)/g+2;break;case c:f=(a-b)/g+4}f/=6}return{h:f,s:h,l:e}}function Q(a,b,c){function d(a,b,c){c<0&&(c+=1);c>1&&(c-=1);if(c<1/6)return a+(b-a)*6*c;if(c<0.5)return b;if(c<2/3)return a+(b-a)*(2/3-c)*6;return a}a=i(a,360);b=i(b,100);c=i(c,100);if(b==0)c=b=a=c;else{var f=c<0.5?c*(1+b):c+b-c*b,e=2*c-f;c=d(e,f,a+1/3);b=d(e,f,a);a=d(e,f,a-1/3)}return{r:c*255,g:b*255,b:a*255}}function p(a,b,c){a=i(a,255);b=i(b,255);c=i(c,255);var d=r(a,b,c),f=s(a,b,c),
e,g=d-f;if(d==f)e=0;else{switch(d){case a:e=(b-c)/g+(b<c?6:0);break;case b:e=(c-a)/g+2;break;case c:e=(a-b)/g+4}e/=6}return{h:e,s:d==0?0:g/d,v:d}}function J(a,b,c){function d(a){return a.length==1?"0"+a:a}return[d(g(a).toString(16)),d(g(b).toString(16)),d(g(c).toString(16))].join("")}function i(a,b){typeof a=="string"&&a.indexOf(".")!=-1&&A(a)===1&&(a="100%");var c=typeof a==="string"&&a.indexOf("%")!=-1;a=s(b,r(0,A(a)));c&&(a*=b/100);if(u.abs(a-b)<1.0E-6)return 1;else if(a>=1)return a%b/A(b);return a}
function q(a){a=a.replace(U,"").replace(w,"").toLowerCase();v[a]&&(a=v[a]);if(a=="transparent")return{r:0,g:0,b:0,a:0};var b;if(b=e.rgb.exec(a))return{r:b[1],g:b[2],b:b[3]};if(b=e.rgba.exec(a))return{r:b[1],g:b[2],b:b[3],a:b[4]};if(b=e.hsl.exec(a))return{h:b[1],s:b[2],l:b[3]};if(b=e.hsla.exec(a))return{h:b[1],s:b[2],l:b[3],a:b[4]};if(b=e.hsv.exec(a))return{h:b[1],s:b[2],v:b[3]};if(b=e.hex6.exec(a))return{r:parseInt(b[1],16),g:parseInt(b[2],16),b:parseInt(b[3],16)};if(b=e.hex3.exec(a))return{r:parseInt(b[1]+
""+b[1],16),g:parseInt(b[2]+""+b[2],16),b:parseInt(b[3]+""+b[3],16)};return!1}var d=function(a,b){if(typeof a=="object"&&a.hasOwnProperty("_tc_id"))return a;if(typeof a=="object"&&(!b||!b.skipRatio))for(var c in a)a[c]===1&&(a[c]="1.0");c=z(a);var d=c.r,e=c.g,i=c.b,l=c.a;return{ok:c.ok,_tc_id:E++,alpha:l,toHsv:function(){return p(d,e,i)},toHsvString:function(){var a=p(d,e,i),b=g(a.h*360),c=g(a.s*100);a=g(a.v*100);return"hsv("+b+", "+c+"%, "+a+"%)"},toHsl:function(){return f(d,e,i)},toHslString:function(){var a=
f(d,e,i),b=g(a.h*360),c=g(a.s*100);a=g(a.l*100);return l==1?"hsl("+b+", "+c+"%, "+a+"%)":"hsla("+b+", "+c+"%, "+a+"%, "+l+")"},toHex:function(){return J(d,e,i)},toHexString:function(){return"#"+J(d,e,i)},toRgb:function(){return{r:g(d),g:g(e),b:g(i)}},toRgbString:function(){return l==1?"rgb("+g(d)+", "+g(e)+", "+g(i)+")":"rgba("+g(d)+", "+g(e)+", "+g(i)+", "+l+")"},toName:function(){return o[J(d,i,e)]||!1}}};d.version="0.4.3";var U=/^[\s,#]+/,w=/\s+$/,E=0,u=Math,g=u.round,s=u.min,r=u.max,A=parseFloat;
d.equals=function(a,b){return d(a).toHex()==d(b).toHex()};d.desaturate=function(a,b){var c=d(a).toHsl();c.s-=(b||10)/100;c.s=s(1,r(0,c.s));return d(c)};d.saturate=function(a,b){var c=d(a).toHsl();c.s+=(b||10)/100;c.s=s(1,r(0,c.s));return d(c)};d.greyscale=function(a){return d.desaturate(a,100)};d.lighten=function(a,b){var c=d(a).toHsl();c.l+=(b||10)/100;c.l=s(1,r(0,c.l));return d(c)};d.darken=function(a,b){var c=d(a).toHsl();c.l-=(b||10)/100;c.l=s(1,r(0,c.l));return d(c)};d.triad=function(a){return d.tetrad(a).slice(0,
3)};d.tetrad=function(a){a=d(a).toRgb();return[d({r:a.r,g:a.g,b:a.b}),d({r:a.b,g:a.r,b:a.g}),d({r:a.g,g:a.b,b:a.r}),d({r:a.r,g:a.b,b:a.r})]};d.splitcomplement=function(a){var b=d(a).toHsv({expand:!0}),c=b.h*360;return[d(a),d({h:(c+72)%360,s:b.s,v:b.v}),d({h:(c+216)%360,s:b.s,v:b.v})]};d.analogous=function(a,b,c){b=b||6;c=c||30;var e=d(a).toHsv();c=360/c;a=[d(a)];e.h*=360;for(e.h=(e.h-(c*b>>1)+720)%360;--b;)e.h=(e.h+c)%360,a.push(d(e));return a};d.monochromatic=function(a,b){b=b||6;for(var c=d(a).toHsv(),
e=[];b--;)e.push(d(c)),c.v+=0.2,c.v%=1;return e};d.readable=function(a,b){var c=d(a).toRgb(),e=d(b).toRgb();return(e.r-c.r)*(e.r-c.r)+(e.g-c.g)*(e.g-c.g)+(e.b-c.b)*(e.b-c.b)>10404};var v=d.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",
cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",
dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",
lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",
midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",
sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},o=function(a){var b={},c;for(c in a)a.hasOwnProperty(c)&&(b[a[c]]=c);return b}(v),e={rgb:RegExp("rgb[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
rgba:RegExp("rgba[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),hsl:RegExp("hsl[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),hsla:RegExp("hsla[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
hsv:RegExp("hsv[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),hex3:/^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/};return d}();
