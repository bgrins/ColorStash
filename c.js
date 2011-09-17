
$.fn.tc = $.fn.toggleClass;
$.fn.rc = $.fn.removeClass;
$.fn.ac = $.fn.addClass;

$(function() {

var win = window,
    tinycolor = win.tinycolor,
    localStorage = win.localStorage,
    JSON = win.JSON,
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
    schemeContainer = $(".scheme");

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
    $(".scheme li").rc("active");
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
   $(".scheme li").rc("active");
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
/*
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
(function(C,e){function S(d,k){var g=e.extend({},w,d);g.callbacks={move:p(g.move,k),change:p(g.change,k),show:p(g.show,k),hide:p(g.hide,k),beforeShow:p(g.beforeShow,k)};return g}function s(v,k){function g(a){if(T){var b=[];K={};for(var c=0;c<a.length;c++){var j=tinycolor(a[c]).toHexString();K.hasOwnProperty(j)||(K[j]=b.push(a[c])-1)}x=b.slice(0,o.maxPalletSize);U.html(q(x,void 0))}}function h(){l.addClass($)}function a(){l.removeClass($)}function b(){t(L.val())}function c(){if(!s&&p.beforeShow(f())!==
!1){V||(V=!0);for(var a=0;a<y.length;a++)y[a].hide();s=!0;e(M).bind("click touchstart",j);e(C).bind("resize",u);G.addClass("sp-active");l.show();aa();z();ba=f();p.show(f())}}function j(){if(s&&!A){s=!1;e(M).unbind("click touchstart",j);e(C).unbind("resize",u);G.removeClass("sp-active");l.hide();var a=f();x.push(a.toHexString());g(x);ca||N();p.hide(a)}}function t(a){a=tinycolor(a).toHsv();H=a.h;O=a.s;P=a.v;z()}function f(){return tinycolor({h:H,s:O,v:P})}function z(){m();var a=tinycolor({h:H,s:"1.0",
v:"1.0"});Q.css("background-color",a.toHexString());a=f().toHexString();ga.css("background-color",a);I&&L.val(a);V&&ca&&N();T&&U.html(q(x,K[a]))}function m(){var a=O*R,b=D-P*D;a=Math.max(-B,Math.min(R-B,a-B));b=Math.max(-B,Math.min(D-B,b-B));da.css({top:b,left:a});ea.css({top:H*w-ha})}function N(){var a=f();I&&E.val(a.toHexString());p.change(a)}function aa(){R=Q.width();D=Q.height();B=da.height();W.width();w=W.height();slideHelperHelperHeight=ea.height();A||l.offset(J(l,fa));m()}var o=S(k,v),A=o.flat,
T=o.showPallet,F=o.theme,p=o.callbacks,u=X(aa,10),s=!1,R=0,D=0,B=0,w=0,ha=0,H=0,O=0,P=0,x=o.pallet.slice(0),$="sp-dragging",K={},M=v.ownerDocument,ia=M.body,E=e(v),l=e(r,M).addClass(F),Q=l.find(".sp-color"),da=l.find(".sp-drag-helper"),W=l.find(".sp-hue"),ea=l.find(".sp-slider"),L=l.find(".sp-input"),U=l.find(".sp-pallet"),ja=l.find(".sp-cancel"),ka=l.find(".sp-choose"),I=E.is("input"),ca=I&&(o.changeOnMove||A),Y=I&&!A,G=Y?e(i).addClass(F):e([]),fa=Y?G:E,ga=G.find(".sp-preview"),Z=o.color||I&&E.val(),
ba=!1,V=!1;(function(){e.browser.msie&&l.find("*:not(input)").attr("unselectable","on");l.toggleClass("sp-flat",A);l.toggleClass("sp-input-disabled",!o.showInput);l.toggleClass("sp-pallet-disabled",!T);Y&&E.hide().after(G);A?E.after(l).hide():e(ia).append(l.hide());fa.bind("click touchstart",function(a){s?j():c();a.stopPropagation();e(a.target).is("input")||a.preventDefault()});l.click(n);L.change(b);L.keydown(function(a){a.keyCode==13&&b()});ja.click(function(){t(ba);j()});ka.click(function(){j()});
d(W,function(a,b){H=b/w;z();p.move(f())},h,a);d(Q,function(a,b){O=a/R;P=(D-b)/D;z();p.move(f())},h,a);Z&&(t(Z),x.push(Z));g(x);A&&c();U.delegate("span","click",function(){t(e(this).css("background-color"))})})();F={show:c,hide:j,set:t,get:f};F.id=y.push(F)-1;return F}function J(d,k){var g=d.outerWidth(),h=d.outerHeight();k.outerWidth();var a=k.outerHeight(),b=d[0].ownerDocument,c=b.documentElement,j=c.clientWidth+e(b).scrollLeft();b=c.clientHeight+e(b).scrollTop();c=k.offset();c.top+=a;c.left-=Math.min(c.left,
c.left+g>j&&j>g?Math.abs(c.left+g-j):0);c.top-=Math.min(c.top,c.top+h>b&&b>h?Math.abs(h+a-6):6);return c}function n(d){d.stopPropagation()}function p(d,e){var g=Array.prototype.slice,h=g.call(arguments,2);return function(){return d.apply(e,h.concat(g.call(arguments)))}}function d(d,k,g,h){function a(a){a.stopPropagation&&a.stopPropagation();a.preventDefault&&a.preventDefault();a.returnValue=!1}function b(b){if(t){if(N&&!(document.documentMode>=9)&&!b.button)return c();var j=b.originalEvent.touches,
e=Math.max(0,Math.min((j?j[0].pageX:b.pageX)-f.left,m));j=Math.max(0,Math.min((j?j[0].pageY:b.pageY)-f.top,z));i&&a(b);k.apply(d,[e,j])}}function c(){t&&(e(j).unbind(o),h.apply(d,arguments));t=!1}k=k||function(){};g=g||function(){};h=h||function(){};var j=d.ownerDocument||document,t=!1,f={},z=0,m=0,N=e.browser.msie,i="ontouchstart"in C,o={};o.selectstart=a;o.dragstart=a;o[i?"touchmove":"mousemove"]=b;o[i?"touchend":"mouseup"]=c;e(d).bind(i?"touchstart":"mousedown",function(c){if(!(c.which?c.which==
3:c.button==2)&&!t&&g.apply(d,arguments)!==!1)t=!0,z=e(d).height(),m=e(d).width(),f=e(d).offset(),e(j).bind(o),i?a(c):b(c)})}function X(d,e,g){var h;return function(){var a=this,b=arguments,c=function(){h=null;d.apply(a,b)};g&&clearTimeout(h);if(g||!h)h=setTimeout(c,e)}}var w={color:!1,flat:!1,showInput:!1,changeOnMove:!0,beforeShow:function(){},move:function(){},change:function(){},show:function(){},hide:function(){},showPallet:!1,maxPalletSize:12,theme:"sp-dark",pallet:["white","black"]},y=[],u=
typeof e!="undefined",i="<div class='sp-replacer sp-cf'><div class='sp-preview'></div><div class='sp-dd'>&#9660;</div></div>",r=function(){var d="";if(e.browser.msie)for(var k=1;k<9;k++)d+="<div class='sp-ie-"+k+"'></div>";return["<div class='sp-container'><div class='sp-top'><div class='sp-fill'></div><div class='sp-top-inner'><div class='sp-color'><div class='sp-sat'><div class='sp-val'><div class='sp-drag-helper'></div></div></div></div><div class='sp-hue'><div class='sp-slider'></div>",d,"</div></div></div><br style='clear:both;' /><div class='sp-pallet sp-cf'></div><div class='sp-input-container sp-cf'><input class='sp-input' type='text' spellcheck='false'  /><div><button class='sp-cancel sp-hide-small'>Cancel</button><button class='sp-choose sp-hide-small'>Choose</button><button class='sp-cancel sp-show-small'>X</button><button class='sp-choose sp-show-small'>\u2714</button></div></div></div>"].join("")}(),
q=function(d,e){for(var g=[],h=0;h<d.length;h++){var a=h==e?" class='sp-pallet-active' ":"";g.push('<span style="background-color:'+tinycolor(d[h]).toHexString()+';"'+a+"></span>")}return g.join("")};if(u)e.fn.spectrum=function(d,i){if(typeof d=="string"){if(d=="get")return y[this.eq(0).data("spectrum.id")].get();return this.each(function(){var g=y[e(this).data("spectrum.id")];d=="show"&&g.show();d=="hide"&&g.hide();d=="set"&&g.set(i)})}return this.each(function(){var g=s(this,d);e(this).data("spectrum.id",
g.id)})},e.fn.spectrum.processOnLoad=!0,e.fn.spectrum.processOnLoadOpts={},e(function(){e.fn.spectrum.processOnLoad&&e("input[type=spectrum]").spectrum(e.fn.spectrum.processOnLoadOpts)});C.spectrum=s})(this,jQuery);
var tinycolor=function(){function C(a){var b={r:255,g:255,b:255},c=1,j=!1;typeof a=="string"&&(a=p(a));if(typeof a=="object"){if(a.hasOwnProperty("r")&&a.hasOwnProperty("g")&&a.hasOwnProperty("b"))b={r:n(a.r,255)*255,g:n(a.g,255)*255,b:n(a.b,255)*255},j=!0;else if(a.hasOwnProperty("h")&&a.hasOwnProperty("s")&&a.hasOwnProperty("v")){var d=a.h,f=a.s;b=a.v;var e,m,g;d=n(d,360);f=n(f,100);b=n(b,100);j=u.floor(d*6);var h=d*6-j;d=b*(1-f);var i=b*(1-h*f);f=b*(1-(1-h)*f);switch(j%6){case 0:e=b;m=f;g=d;break;
case 1:e=i;m=b;g=d;break;case 2:e=d;m=b;g=f;break;case 3:e=d;m=i;g=b;break;case 4:e=f;m=d;g=b;break;case 5:e=b,m=d,g=i}b={r:e*255,g:m*255,b:g*255};j=!0}else a.hasOwnProperty("h")&&a.hasOwnProperty("s")&&a.hasOwnProperty("l")&&(b=S(a.h,a.s,a.l),j=!0);a.hasOwnProperty("a")&&(c=n(a.a,1))}return{ok:j,r:r(255,q(b.r,0)),g:r(255,q(b.g,0)),b:r(255,q(b.b,0)),a:c}}function e(a,b,c){a=n(a,255);b=n(b,255);c=n(c,255);var d=q(a,b,c),e=r(a,b,c),f,g=(d+e)/2;if(d==e)f=e=0;else{var m=d-e;e=g>0.5?m/(2-d-e):m/(d+e);
switch(d){case a:f=(b-c)/m+(b<c?6:0);break;case b:f=(c-a)/m+2;break;case c:f=(a-b)/m+4}f/=6}return{h:f,s:e,l:g}}function S(a,b,c){function d(a,b,c){c<0&&(c+=1);c>1&&(c-=1);if(c<1/6)return a+(b-a)*6*c;if(c<0.5)return b;if(c<2/3)return a+(b-a)*(2/3-c)*6;return a}a=n(a,360);b=n(b,100);c=n(c,100);if(b==0)c=b=a=c;else{var e=c<0.5?c*(1+b):c+b-c*b,f=2*c-e;c=d(f,e,a+1/3);b=d(f,e,a);a=d(f,e,a-1/3)}return{r:c*255,g:b*255,b:a*255}}function s(a,b,c){a=n(a,255);b=n(b,255);c=n(c,255);var d=q(a,b,c),e=r(a,b,c),
f,g=d-e;if(d==e)f=0;else{switch(d){case a:f=(b-c)/g+(b<c?6:0);break;case b:f=(c-a)/g+2;break;case c:f=(a-b)/g+4}f/=6}return{h:f,s:d==0?0:g/d,v:d}}function J(a,b,c){function d(a){return a.length==1?"0"+a:a}return[d(i(a).toString(16)),d(i(b).toString(16)),d(i(c).toString(16))].join("")}function n(a,b){typeof a=="string"&&a.indexOf(".")!=-1&&v(a)===1&&(a="100%");var c=typeof a==="string"&&a.indexOf("%")!=-1;a=r(b,q(0,v(a)));c&&(a*=b/100);if(u.abs(a-b)<1.0E-6)return 1;else if(a>=1)return a%b/v(b);return a}
function p(a){a=a.replace(X,"").replace(w,"").toLowerCase();k[a]&&(a=k[a]);if(a=="transparent")return{r:0,g:0,b:0,a:0};var b;if(b=h.rgb.exec(a))return{r:b[1],g:b[2],b:b[3]};if(b=h.rgba.exec(a))return{r:b[1],g:b[2],b:b[3],a:b[4]};if(b=h.hsl.exec(a))return{h:b[1],s:b[2],l:b[3]};if(b=h.hsla.exec(a))return{h:b[1],s:b[2],l:b[3],a:b[4]};if(b=h.hsv.exec(a))return{h:b[1],s:b[2],v:b[3]};if(b=h.hex6.exec(a))return{r:parseInt(b[1],16),g:parseInt(b[2],16),b:parseInt(b[3],16)};if(b=h.hex3.exec(a))return{r:parseInt(b[1]+
""+b[1],16),g:parseInt(b[2]+""+b[2],16),b:parseInt(b[3]+""+b[3],16)};return!1}var d=function(a,b){if(typeof a=="object"&&a.hasOwnProperty("_tc_id"))return a;if(typeof a=="object"&&(!b||!b.skipRatio))for(var c in a)a[c]===1&&(a[c]="1.0");c=C(a);var d=c.r,h=c.g,f=c.b,k=c.a;return{ok:c.ok,_tc_id:y++,alpha:k,toHsv:function(){return s(d,h,f)},toHsvString:function(){var a=s(d,h,f),b=i(a.h*360),c=i(a.s*100);a=i(a.v*100);return"hsv("+b+", "+c+"%, "+a+"%)"},toHsl:function(){return e(d,h,f)},toHslString:function(){var a=
e(d,h,f),b=i(a.h*360),c=i(a.s*100);a=i(a.l*100);return k==1?"hsl("+b+", "+c+"%, "+a+"%)":"hsla("+b+", "+c+"%, "+a+"%, "+k+")"},toHex:function(){return J(d,h,f)},toHexString:function(){return"#"+J(d,h,f)},toRgb:function(){return{r:i(d),g:i(h),b:i(f)}},toRgbString:function(){return k==1?"rgb("+i(d)+", "+i(h)+", "+i(f)+")":"rgba("+i(d)+", "+i(h)+", "+i(f)+", "+k+")"},toName:function(){return g[J(d,f,h)]||!1}}};d.version="0.4.3";var X=/^[\s,#]+/,w=/\s+$/,y=0,u=Math,i=u.round,r=u.min,q=u.max,v=parseFloat;
d.equals=function(a,b){return d(a).toHex()==d(b).toHex()};d.desaturate=function(a,b){var c=d(a).toHsl();c.s-=(b||10)/100;c.s=r(1,q(0,c.s));return d(c)};d.saturate=function(a,b){var c=d(a).toHsl();c.s+=(b||10)/100;c.s=r(1,q(0,c.s));return d(c)};d.greyscale=function(a){return d.desaturate(a,100)};d.lighten=function(a,b){var c=d(a).toHsl();c.l+=(b||10)/100;c.l=r(1,q(0,c.l));return d(c)};d.darken=function(a,b){var c=d(a).toHsl();c.l-=(b||10)/100;c.l=r(1,q(0,c.l));return d(c)};d.triad=function(a){return d.tetrad(a).slice(0,
3)};d.tetrad=function(a){a=d(a).toRgb();return[d({r:a.r,g:a.g,b:a.b}),d({r:a.b,g:a.r,b:a.g}),d({r:a.g,g:a.b,b:a.r}),d({r:a.r,g:a.b,b:a.r})]};d.splitcomplement=function(a){var b=d(a).toHsv({expand:!0}),c=b.h*360;return[d(a),d({h:(c+72)%360,s:b.s,v:b.v}),d({h:(c+216)%360,s:b.s,v:b.v})]};d.analogous=function(a,b,c){b=b||6;c=c||30;var e=d(a).toHsv();c=360/c;a=[d(a)];e.h*=360;for(e.h=(e.h-(c*b>>1)+720)%360;--b;)e.h=(e.h+c)%360,a.push(d(e));return a};d.monochromatic=function(a,b){b=b||6;for(var c=d(a).toHsv(),
e=[];b--;)e.push(d(c)),c.v+=0.2,c.v%=1;return e};d.readable=function(a,b){var c=d(a).toRgb(),e=d(b).toRgb();return(e.r-c.r)*(e.r-c.r)+(e.g-c.g)*(e.g-c.g)+(e.b-c.b)*(e.b-c.b)>10404};var k=d.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",
cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",
dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",
lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",
midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",
sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},g=function(a){var b={},c;for(c in a)a.hasOwnProperty(c)&&(b[a[c]]=c);return b}(k),h={rgb:RegExp("rgb[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
rgba:RegExp("rgba[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),hsl:RegExp("hsl[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),hsla:RegExp("hsla[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
hsv:RegExp("hsv[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),hex3:/^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/};return d}();

