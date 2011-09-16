
(function() {

var localStorage = window.localStorage,
    hasStorage = !!(localStorage && JSON),
    defaultPallet = '{ "#3126c1": { }, "#c8901e": { }, "#c81e59": { }, "#98c39b": { } }',
    colorStorageName = "colors",
    lastColorName = "lastColor",
    BACKGROUND_COLOR = "background-color",
    BORDER_COLOR = "border-color",
    URL = location;

$.fn.tc = $.fn.toggleClass;
    
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
    var fromHash = tinycolor(window.location.hash);
    if (fromHash.ok) { return fromHash.toHexString(); }
    return (hasStorage && localStorage[lastColorName]) || "ddf";
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
    var spec = $("#spec"),
        current = $("#current"),
        pallet = $("#pallet ul");
        
    
    current.bind("keyup change", function() { setCurrentHex($(this).val()); updateSchemes(); });
    $("input[readonly]").click(function() { $(this).focus(); this.select(); });
    
    
    var hsl = $("#hsl input"),
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
    
    function change(color) {
        var hexVal = color.toHexString();
        var hsvVal = color.toHsv();
        
        preview.css(BACKGROUND_COLOR, hexVal).
            tc("has", palletHas(hexVal)).
            tc("contrast", hsvVal.s < .3 && hsvVal.v > .6);
            
        shareInput.css(BORDER_COLOR, hexVal).
            val(URL + hexVal);
        
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
	   $("#preview").removeClass("fromScheme");
	   $(".schemer li").removeClass("active");
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
	
	preview.find("button").click(function() {
	   var hex = getCurrentHex();
	   this.id == "add" && palletAdd(hex);
	   this.id == "rm" && palletRemove(hex);
	   this.id == "rl" && updatePartial();
    
       preview.tc("has", palletHas(hex));
	   return false;
	});
	
	$("#pallet").delegate("li", "click", function() {
	   setCurrentHex($(this).attr("title"), true);
	});
	
    $("body").tc("nostorage", !hasStorage);
    redrawPallet();
    
    window.onhashchange = function() {
        setCurrentHex(getLastColor(), true);
    }
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
	   if (false && $(".schemer li.active").length == 0) {
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
});

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

})();
// Spectrum: The No Hassle Colorpicker
// https://github.com/bgrins/spectrum
// Author: Brian Grinstead
// License: MIT
// Requires: jQuery, spectrum.css
(function(z,f){function Q(d,f){var e=w({},E,d);e.callbacks={move:l(e.move,f),change:l(e.change,f),show:l(e.show,f),hide:l(e.hide,f),beforeShow:l(e.beforeShow,f)};return e}function t(v,r){function e(a){if(i.showPallet){var b=[];J={};for(var c=0;c<a.length;c++){var n=tinycolor(a[c]).toHexString();J.hasOwnProperty(n)||(J[n]=b.push(a[c])-1)}x=b.slice(0,i.maxPalletSize);R.html(A(x,void 0))}}function a(){j.addClass("sp-dragging")}function b(){j.removeClass("sp-dragging")}function c(){k(K.val())}function n(){if(!l&&
B.beforeShow(o())!==!1){S||(S=!0);for(var a=0;a<s.length;a++)s[a].hide();l=!0;f(L).bind("click touchstart",h);f(z).bind("resize",Y);F.addClass("sp-active");j.show();Z();M();$=o();B.show(o())}}function h(){if(l&&!i.flat){l=!1;f(L).unbind("click touchstart",h);f(z).unbind("resize",Y);F.removeClass("sp-active");j.hide();var a=o();x.push(a.toHexString());e(x);aa||g();B.hide(a)}}function k(a){a=tinycolor(a).toHsv();G=a.h/360;N=a.s/100;O=a.v/100;M()}function o(){return tinycolor({h:G,s:N,v:O})}function M(){u();
var a=tinycolor({h:G,s:"1.0",v:"1.0"});P.css("background-color",a.toHexString());a=o().toHexString();ea.css("background-color",a);H&&K.val(a);S&&aa&&g();i.showPallet&&R.html(A(x,J[a]))}function u(){var a=N*t,b=C-O*C;a=Math.max(-y,Math.min(t-y,a-y));b=Math.max(-y,Math.min(C-y,b-y));ba.css({top:b,left:a});ca.css({top:G*w-E})}function g(){var a=o();H&&D.val(a.toHexString());B.change(a)}function Z(){t=P.width();C=P.height();y=ba.height();T.width();w=T.height();slideHelperHelperHeight=ca.height();i.flat||
j.offset(I(j,da));u()}var i=Q(r,v),B=i.callbacks,Y=U(Z,100),l=!1,t=0,C=0,y=0,w=0,E=0,G=0,N=0,O=0,x=i.pallet.slice(0),J={},L=v.ownerDocument,fa=L.body,D=f(v),j=f(p,L).addClass(i.theme),P=j.find(".sp-color"),ba=j.find(".sp-drag-helper"),T=j.find(".sp-slide"),ca=j.find(".sp-slide-helper"),K=j.find(".sp-input"),R=j.find(".sp-pallet-container"),ga=j.find(".sp-cancel"),ha=j.find(".sp-choose"),H=D.is("input"),aa=H&&(i.changeOnMove||i.flat),V=H&&!i.flat,F=V?f(q).addClass(i.theme):f([]),da=V?F:D,ea=F.find(".sp-preview"),
W=i.color||H&&D.val(),$=!1,S=!1;(function(){f.browser.msie&&j.find("*:not(input)").attr("unselectable","on");j.toggleClass("sp-flat",i.flat);j.toggleClass("sp-input-disabled",!i.showInput);j.toggleClass("sp-pallet-disabled",!i.showPallet);V&&D.hide().after(F);i.flat?D.after(j).hide():f(fa).append(j.hide());da.bind("click touchstart",function(a){l?h():n();a.stopPropagation();f(a.target).is("input")||a.preventDefault()});j.click(m);K.change(c);K.keydown(function(a){a.keyCode==13&&c()});ga.click(function(){k($);
h()});ha.click(function(){h()});d(T,function(a,b){G=b/w;M();B.move(o())},a,b);d(P,function(a,b){N=a/t;O=(C-b)/C;M();B.move(o())},a,b);W&&(k(W),x.push(W));e(x);i.flat&&n();R.delegate("span","click",function(){k(f(this).css("background-color"))})})();var X={show:n,hide:h,set:k,get:o};X.id=s.push(X)-1;return X}function I(d,r){var e=d.outerWidth(),a=d.outerHeight();r.outerWidth();var b=r.outerHeight(),c=d[0].ownerDocument,n=c.documentElement.clientWidth+f(c).scrollLeft();c=c.documentElement.clientHeight+
f(c).scrollTop();var h=r.offset();h.top+=b;h.left-=Math.min(h.left,h.left+e>n&&n>e?Math.abs(h.left+e-n):0);h.top-=Math.min(h.top,h.top+a>c&&c>a?Math.abs(a+b-6):6);return h}function m(d){d.stopPropagation()}function l(d,f){var e=Array.prototype.slice,a=e.call(arguments,2);return function(){return d.apply(f,a.concat(e.call(arguments)))}}function d(d,r,e,a){function b(a){a.stopPropagation&&a.stopPropagation();a.preventDefault&&a.preventDefault();a.returnValue=!1}function c(a){if(k){if(m&&!(document.documentMode>=
9)&&!a.button)return n();var c=a.originalEvent.touches,h=Math.max(0,Math.min((c?c[0].pageX:a.pageX)-o.left,u));c=Math.max(0,Math.min((c?c[0].pageY:a.pageY)-o.top,g));l&&b(a);r.apply(d,[h,c])}}function n(){k&&(f(h).unbind(i),a.apply(d,arguments));k=!1}r=r||function(){};e=e||function(){};a=a||function(){};var h=d.ownerDocument||document,k=!1,o={},g=0,u=0,m=f.browser.msie,l="ontouchstart"in z,i={};i.selectstart=b;i.dragstart=b;i[l?"touchmove":"mousemove"]=c;i[l?"touchend":"mouseup"]=n;f(d).bind(l?"touchstart":
"mousedown",function(a){if(!(a.which?a.which==3:a.button==2)&&!k&&e.apply(d,arguments)!==!1)k=!0,g=f(d).height(),u=f(d).width(),o=f(d).offset(),f(h).bind(i),l?b(a):c(a)})}function U(d,f,e){var a;return function(){var b=this,c=arguments,n=function(){a=null;d.apply(b,c)};e&&clearTimeout(a);if(e||!a)a=setTimeout(n,f)}}function w(d){for(var f=Array.prototype.slice.call(arguments,1),e=0;e<f.length;e++){var a=f[e],b;for(b in a)a[b]!==void 0&&(d[b]=a[b])}return d}var E={color:!1,flat:!1,showInput:!1,changeOnMove:!0,
beforeShow:function(){},move:function(){},change:function(){},show:function(){},hide:function(){},showPallet:!1,maxPalletSize:12,theme:"sp-dark",pallet:["white","black"]},s=[],g=typeof f!="undefined",q="<div class='sp-replacer sp-cf'><div class='sp-preview'></div><div class='sp-dd'>&#9660;</div></div>",p=function(){var d="";if(f.browser.msie)for(var g=1;g<9;g++)d+="<div class='sp-ie-"+g+"'></div>";return["<div class='sp-container'><div class='sp-top'><div class='sp-fill'></div><div class='sp-top-inner'><div class='sp-color'><div class='sp-saturation'><div class='sp-value'><div class='sp-drag-helper'></div></div></div></div><div class='sp-slide'><div class='sp-slide-helper'></div>",
d,"</div></div></div><br style='clear:both;' /><div class='sp-pallet-container sp-cf'></div><div class='sp-input-container sp-cf'><input class='sp-input' type='text' spellcheck='false'  /><div><button class='sp-cancel sp-hide-small'>Cancel</button><button class='sp-choose sp-hide-small'>Choose</button><button class='sp-cancel sp-show-small'>X</button><button class='sp-choose sp-show-small'>\u2714</button></div></div></div>"].join("")}(),A=function(d,f){for(var e=[],a=0;a<d.length;a++){var b=a==f?
" class='sp-pallet-active' ":"";e.push('<span style="background-color:'+tinycolor(d[a]).toHexString()+';"'+b+"></span>")}return e.join("")};if(g)f.fn.spectrum=function(d,g){if(typeof d=="string"){if(d=="get")return s[this.eq(0).data("spectrum.id")].get();return this.each(function(){var e=s[f(this).data("spectrum.id")];d=="show"&&e.show();d=="hide"&&e.hide();d=="set"&&e.set(g)})}return this.each(function(){var e=t(this,d);f(this).data("spectrum.id",e.id)})},f.fn.spectrum.processOnLoad=!0,f.fn.spectrum.processOnLoadOpts=
{},f(function(){f.fn.spectrum.processOnLoad&&f("input[type=spectrum]").spectrum(f.fn.spectrum.processOnLoadOpts)});z.spectrum=t})(this,jQuery);
var tinycolor=function(){function z(a){var b={r:255,g:255,b:255},c=!1;typeof a=="string"&&(a=l(a));if(typeof a=="object")if(a.hasOwnProperty("r")&&a.hasOwnProperty("g")&&a.hasOwnProperty("b"))b={r:m(a.r,255)*255,g:m(a.g,255)*255,b:m(a.b,255)*255},c=!0;else if(a.hasOwnProperty("h")&&a.hasOwnProperty("s")&&a.hasOwnProperty("v")){var d=a.h;b=a.s;a=a.v;var h,f,e;d=m(d,360);b=m(b,100);a=m(a,100);c=s.floor(d*6);var g=d*6-c;d=a*(1-b);var u=a*(1-g*b);b=a*(1-(1-g)*b);switch(c%6){case 0:h=a;f=b;e=d;break;case 1:h=
u;f=a;e=d;break;case 2:h=d;f=a;e=b;break;case 3:h=d;f=u;e=a;break;case 4:h=b;f=d;e=a;break;case 5:h=a,f=d,e=u}b={r:h*255,g:f*255,b:e*255};c=!0}else a.hasOwnProperty("h")&&a.hasOwnProperty("s")&&a.hasOwnProperty("l")&&(b=Q(a.h,a.s,a.l),c=!0);return{ok:c,r:q(255,p(b.r,0)),g:q(255,p(b.g,0)),b:q(255,p(b.b,0))}}function f(a,b,c){a=m(a,255);b=m(b,255);c=m(c,255);var d=p(a,b,c),h=q(a,b,c),f,e=(d+h)/2;if(d==h)f=h=0;else{var g=d-h;h=e>0.5?g/(2-d-h):g/(d+h);switch(d){case a:f=(b-c)/g+(b<c?6:0);break;case b:f=
(c-a)/g+2;break;case c:f=(a-b)/g+4}f/=6}return{h:f*360,s:h*100,l:e*100}}function Q(a,b,c){function d(a,b,c){c<0&&(c+=1);c>1&&(c-=1);if(c<1/6)return a+(b-a)*6*c;if(c<0.5)return b;if(c<2/3)return a+(b-a)*(2/3-c)*6;return a}a=m(a,360);b=m(b,100);c=m(c,100);if(b==0)c=b=a=c;else{var f=c<0.5?c*(1+b):c+b-c*b,e=2*c-f;c=d(e,f,a+1/3);b=d(e,f,a);a=d(e,f,a-1/3)}return{r:c*255,g:b*255,b:a*255}}function t(a,b,c){a=m(a,255);b=m(b,255);c=m(c,255);var d=p(a,b,c),f=q(a,b,c),e,g=d-f;if(d==f)e=0;else{switch(d){case a:e=
(b-c)/g+(b<c?6:0);break;case b:e=(c-a)/g+2;break;case c:e=(a-b)/g+4}e/=6}return{h:e*360,s:(d==0?0:g/d)*100,v:d*100}}function I(a,b,c){function d(a){return a.length==1?"0"+a:a}return[d(g(a).toString(16)),d(g(b).toString(16)),d(g(c).toString(16))].join("")}function m(a,b){typeof a=="string"&&a.indexOf(".")!=-1&&A(a)===1&&(a="100%");var c=typeof a==="string"&&a.indexOf("%")!=-1;a=q(b,p(0,A(a)));c&&(a*=b/100);if(s.abs(a-b)<1.0E-6)return 1;else if(a>=1)return a%b/A(b);return a}function l(a){a=a.replace(U,
"").replace(w,"").toLowerCase();v[a]&&(a=v[a]);if(a=="transparent")return{r:0,g:0,b:0,a:0};var b;if(b=e.rgb.exec(a))return{r:b[1],g:b[2],b:b[3]};if(b=e.hsl.exec(a))return{h:b[1],s:b[2],l:b[3]};if(b=e.hsv.exec(a))return{h:b[1],s:b[2],v:b[3]};if(b=e.hex6.exec(a))return{r:parseInt(b[1],16),g:parseInt(b[2],16),b:parseInt(b[3],16)};if(b=e.hex3.exec(a))return{r:parseInt(b[1]+""+b[1],16),g:parseInt(b[2]+""+b[2],16),b:parseInt(b[3]+""+b[3],16)};return!1}var d=function(a,b){if(typeof a=="object"&&a.hasOwnProperty("_tc_id"))return a;
if(typeof a=="object"&&(!b||!b.skipRatio))for(var c in a)a[c]===1&&(a[c]="1.0");c=z(a);var d=c.r,e=c.g,k=c.b;return{ok:c.ok,_tc_id:E++,toHsv:function(){return t(d,e,k)},toHsvString:function(){var a=t(d,e,k);return"hsv("+g(a.h)+", "+g(a.s)+"%, "+g(a.v)+"%)"},toHsl:function(){return f(d,e,k)},toHslString:function(){var a=f(d,e,k);return"hsl("+g(a.h)+", "+g(a.s)+"%, "+g(a.l)+"%)"},toHex:function(){return I(d,e,k)},toHexString:function(){return"#"+I(d,e,k)},toRgb:function(){return{r:g(d),g:g(e),b:g(k)}},
toRgbString:function(){return"rgb("+g(d)+", "+g(e)+", "+g(k)+")"},toName:function(){return r[I(d,k,e)]||!1}}};d.version="0.4.2";var U=/^[\s,#]+/,w=/\s+$/,E=0,s=Math,g=s.round,q=s.min,p=s.max,A=parseFloat;d.equals=function(a,b){return d(a).toHex()==d(b).toHex()};d.desaturate=function(a,b){var c=d(a).toHsl();c.s-=b||10;c.s=q(1,p(0,c.s/100));return d(c)};d.saturate=function(a,b){var c=d(a).toHsl();c.s+=b||10;c.s=q(1,p(0,c.s/100));return d(c)};d.greyscale=function(a){return d.desaturate(a,100)};d.lighten=
function(a,b){var c=d(a).toHsl();c.l+=b||10;c.l=q(1,p(0,c.l/100));return d(c)};d.darken=function(a,b){var c=d(a).toHsl();c.l-=b||10;c.l=q(1,p(0,c.l/100));return d(c)};d.triad=function(a){return d.tetrad(a).slice(0,3)};d.tetrad=function(a){a=d(a).toRgb();return[d({r:a.r,g:a.g,b:a.b}),d({r:a.b,g:a.r,b:a.g}),d({r:a.g,g:a.b,b:a.r}),d({r:a.r,g:a.b,b:a.r})]};d.splitcomplement=function(a){var b=d(a).toHsv();return[d(a),d({h:(b.h+72)%360,s:b.s,v:b.v}),d({h:(b.h+216)%360,s:b.s,v:b.v})]};d.analogous=function(a,
b,c){b=b||6;c=c||30;var e=d(a).toHsv();c=360/c;a=[d(a)];for(e.h=(e.h-(c*b>>1)+720)%360;--b;)e.h=(e.h+c)%360,a.push(d(e));return a};d.monochromatic=function(a,b){b=b||6;for(var c=d(a).toHsv(),e=[];b--;)e.push(d(c)),c.v+=0.2,c.v%=1;return e};d.readable=function(a,b){var c=d(a).toRgb(),e=d(b).toRgb();return(e.r-c.r)*(e.r-c.r)+(e.g-c.g)*(e.g-c.g)+(e.b-c.b)*(e.b-c.b)>10404};var v=d.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",
black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",
darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",
ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",
mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",
papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",
wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},r=function(a){var b={},c;for(c in a)a.hasOwnProperty(c)&&(b[a[c]]=c);return b}(v),e={rgb:RegExp("rgb[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),hsl:RegExp("hsl[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
hsv:RegExp("hsv[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),hex3:/^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/};return d}();

