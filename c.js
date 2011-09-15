
(function() {

var hasStorage = !!(localStorage && JSON),
    defaultPallet = '{ "#3126c1": { }, "#c8901e": { }, "#c81e59": { }, "#98c39b": { } }';

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
    var fromHash = tinycolor(window.location.hash);
    if (fromHash.ok) { return fromHash.toHexString(); }
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
    var spec = $("#spec"),
        current = $("#current"),
        u = location,
        pallet = $("#pallet ul");
        
    
    current.bind("keyup change", function() { setCurrentHex($(this).val()); updateSchemes(); });
    $("input[readonly]").click(function() { $(this).focus(); this.select(); });
    
    var backgroundColor = "background-color";
    var borderColor = "border-color";
    
    var hsl = $("#hsl input"),
        hex = $("#hex input"),
        rgb = $("#rgb input"),
        hsv = $("#hsv input"),
        analogous = $("#an"), 
        splitcomplement = $("#sc"), 
        tetrad = $("#tetrad"), 
        mono = $("#mono"),
        shareInput = $("#share input"),
        preview = $("#preview"),
        schemeContainer = $(".schemer");
    
    function change(color) {
        var hexVal = color.toHexString();
        
        preview.css(backgroundColor, hexVal);
        shareInput.css(borderColor, hexVal).val(u + hexVal);
        
        
        hsv.val(color.toHsvString());
        hex.val(hexVal);
        rgb.val(color.toRgbString());
        hsl.val(color.toHslString());
        
        var h = color.toHsv();
        var isContrast = h.s < .3 && h.v > .6;
        $("#preview").toggleClass("has", palletHas(hexVal)).toggleClass("contrast", isContrast);
    }
    
    function getCurrentHex() {
        return spec.spectrum("get").toHexString();
    }
    function setCurrentHex(color, shouldUpdateTextbox) {
       var ok = tinycolor(color).ok;
	   spec.spectrum("set", color);
	   shouldUpdateTextbox && updateTextbox();
	   
	   
       schemeContainer.toggleClass("vhide", !ok);
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
    
       $("#preview").toggleClass("has", palletHas(hex));
	   return false;
	});
	
	$("#pallet").delegate("li", "click", function() {
	   setCurrentHex($(this).attr("title"), true);
	});
	
    $("body").toggleClass("nostorage", !hasStorage);
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
        analogous.html($.map(tinycolor.analogous(tiny), schemeTmpl).join(''));
        splitcomplement.html($.map(tinycolor.splitcomplement(tiny), schemeTmpl).join(''));
        tetrad.html($.map(tinycolor.tetrad(tiny), schemeTmpl).join(''));
        mono.html($.map(tinycolor.monochromatic(tiny), schemeTmpl).join(''));
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
(function(w,f){function P(a,b){var c=s({},A,a);c.callbacks={move:n(c.move,b),change:n(c.change,b),show:n(c.show,b),hide:n(c.hide,b),beforeShow:n(c.beforeShow,b)};return c}function o(a,b){function c(a){if(j.showPallet){var b=[];H={};for(var c=0;c<a.length;c++){var d=tinycolor(a[c]).toHexString();H.hasOwnProperty(d)||(H[d]=b.push(a[c])-1)}t=b.slice(0,j.maxPalletSize);Q.html(p(t,void 0))}}function d(){k.addClass("sp-dragging")}function i(){k.removeClass("sp-dragging")}function h(){q(I.val())}function R(){if(!B&&
x.beforeShow(g())!==!1){S||(S=!0);for(var a=0;a<u.length;a++)u[a].hide();B=!0;f(J).bind("click touchstart",m);f(w).bind("resize",Y);C.addClass("sp-active");k.show();r();n();Z=g();x.show(g())}}function m(){if(B&&!j.flat){B=!1;f(J).unbind("click touchstart",m);f(w).unbind("resize",Y);C.removeClass("sp-active");k.hide();var a=g();t.push(a.toHexString());c(t);$||aa();x.hide(a)}}function q(a){a=tinycolor(a).toHsv();D=a.h/360;K=a.s/100;L=a.v/100;n()}function g(){return tinycolor({h:D,s:K,v:L})}function n(){o();
var a=tinycolor({h:D,s:"1.0",v:"1.0"});M.css("background-color",a.toHexString());a=g().toHexString();ea.css("background-color",a);E&&I.val(a);S&&$&&aa();j.showPallet&&Q.html(p(t,H[a]))}function o(){var a=K*N,b=y-L*y;a=Math.max(-v,Math.min(N-v,a-v));b=Math.max(-v,Math.min(y-v,b-v));ba.css({top:b,left:a});ca.css({top:D*s-A})}function aa(){var a=g();E&&z.val(a.toHexString());x.change(a)}function r(){N=M.width();y=M.height();v=ba.height();T.width();s=T.height();slideHelperHelperHeight=ca.height();j.flat||
k.offset(F(k,da));o()}var j=P(b,a),x=j.callbacks,Y=e(r,100),B=!1,N=0,y=0,v=0,s=0,A=0,D=0,K=0,L=0,t=j.pallet.slice(0),H={},J=a.ownerDocument,fa=J.body,z=f(a),k=f(U,J).addClass(j.theme),M=k.find(".sp-color"),ba=k.find(".sp-drag-helper"),T=k.find(".sp-slide"),ca=k.find(".sp-slide-helper"),I=k.find(".sp-input"),Q=k.find(".sp-pallet-container"),ga=k.find(".sp-cancel"),ha=k.find(".sp-choose"),E=z.is("input"),$=E&&(j.changeOnMove||j.flat),V=E&&!j.flat,C=V?f(G).addClass(j.theme):f([]),da=V?C:z,ea=C.find(".sp-preview"),
W=j.color||E&&z.val(),Z=!1,S=!1;(function(){f.browser.msie&&k.find("*:not(input)").attr("unselectable","on");k.toggleClass("sp-flat",j.flat);k.toggleClass("sp-input-disabled",!j.showInput);k.toggleClass("sp-pallet-disabled",!j.showPallet);V&&z.hide().after(C);j.flat?z.after(k).hide():f(fa).append(k.hide());da.bind("click touchstart",function(a){B?m():R();a.stopPropagation();f(a.target).is("input")||a.preventDefault()});k.click(l);I.change(h);I.keydown(function(a){a.keyCode==13&&h()});ga.click(function(){q(Z);
m()});ha.click(function(){m()});O(T,function(a,b){D=b/s;n();x.move(g())},d,i);O(M,function(a,b){K=a/N;L=(y-b)/y;n();x.move(g())},d,i);W&&(q(W),t.push(W));c(t);j.flat&&R();Q.delegate("span","click",function(){q(f(this).css("background-color"))})})();var X={show:R,hide:m,set:q,get:g};X.id=u.push(X)-1;return X}function F(a,b){var c=a.outerWidth(),d=a.outerHeight();b.outerWidth();var i=b.outerHeight(),h=a[0].ownerDocument,e=h.documentElement.clientWidth+f(h).scrollLeft();h=h.documentElement.clientHeight+
f(h).scrollTop();var m=b.offset();m.top+=i;m.left-=Math.min(m.left,m.left+c>e&&e>c?Math.abs(m.left+c-e):0);m.top-=Math.min(m.top,m.top+d>h&&h>d?Math.abs(d+i-6):6);return m}function l(a){a.stopPropagation()}function n(a,b){var c=Array.prototype.slice,d=c.call(arguments,2);return function(){return a.apply(b,d.concat(c.call(arguments)))}}function O(a,b,c,d){function i(a){a.stopPropagation&&a.stopPropagation();a.preventDefault&&a.preventDefault();a.returnValue=!1}function h(c){if(g){if(p&&!(document.documentMode>=
9)&&!c.button)return e();var d=c.originalEvent.touches,h=Math.max(0,Math.min((d?d[0].pageX:c.pageX)-l.left,o));d=Math.max(0,Math.min((d?d[0].pageY:c.pageY)-l.top,n));r&&i(c);b.apply(a,[h,d])}}function e(){g&&(f(m).unbind(j),d.apply(a,arguments));g=!1}b=b||function(){};c=c||function(){};d=d||function(){};var m=a.ownerDocument||document,g=!1,l={},n=0,o=0,p=f.browser.msie,r="ontouchstart"in w,j={};j.selectstart=i;j.dragstart=i;j[r?"touchmove":"mousemove"]=h;j[r?"touchend":"mouseup"]=e;f(a).bind(r?"touchstart":
"mousedown",function(b){if(!(b.which?b.which==3:b.button==2)&&!g&&c.apply(a,arguments)!==!1)g=!0,n=f(a).height(),o=f(a).width(),l=f(a).offset(),f(m).bind(j),r?i(b):h(b)})}function e(a,b,c){var d;return function(){var i=this,h=arguments,e=function(){d=null;a.apply(i,h)};c&&clearTimeout(d);if(c||!d)d=setTimeout(e,b)}}function s(a){for(var b=Array.prototype.slice.call(arguments,1),c=0;c<b.length;c++){var d=b[c],i;for(i in d)d[i]!==void 0&&(a[i]=d[i])}return a}var A={color:!1,flat:!1,showInput:!1,changeOnMove:!0,
beforeShow:function(){},move:function(){},change:function(){},show:function(){},hide:function(){},showPallet:!1,maxPalletSize:12,theme:"sp-dark",pallet:["white","black"]},u=[],g=typeof f!="undefined",G="<div class='sp-replacer sp-cf'><div class='sp-preview'></div><div class='sp-dd'>&#9660;</div></div>",U=function(){var a="";if(f.browser.msie)for(var b=1;b<9;b++)a+="<div class='sp-ie-"+b+"'></div>";return["<div class='sp-container'><div class='sp-top'><div class='sp-fill'></div><div class='sp-top-inner'><div class='sp-color'><div class='sp-saturation'><div class='sp-value'><div class='sp-drag-helper'></div></div></div></div><div class='sp-slide'><div class='sp-slide-helper'></div>",
a,"</div></div></div><br style='clear:both;' /><div class='sp-pallet-container sp-cf'></div><div class='sp-input-container sp-cf'><input class='sp-input' type='text' spellcheck='false'  /><div><button class='sp-cancel sp-hide-small'>Cancel</button><button class='sp-choose sp-hide-small'>Choose</button><button class='sp-cancel sp-show-small'>X</button><button class='sp-choose sp-show-small'>\u2714</button></div></div></div>"].join("")}(),p=function(a,b){for(var c=[],d=0;d<a.length;d++){var i=d==b?
" class='sp-pallet-active' ":"";c.push('<span style="background-color:'+tinycolor(a[d]).toHexString()+';"'+i+"></span>")}return c.join("")};if(g)f.fn.spectrum=function(a,b){if(typeof a=="string"){if(a=="get")return u[this.eq(0).data("spectrum.id")].get();return this.each(function(){var c=u[f(this).data("spectrum.id")];a=="show"&&c.show();a=="hide"&&c.hide();a=="set"&&c.set(b)})}return this.each(function(){var b=o(this,a);f(this).data("spectrum.id",b.id)})},f.fn.spectrum.processOnLoad=!0,f.fn.spectrum.processOnLoadOpts=
{},f(function(){f.fn.spectrum.processOnLoad&&f("input[type=spectrum]").spectrum(f.fn.spectrum.processOnLoadOpts)});w.spectrum=o})(this,jQuery);
var tinycolor=function(){function w(a){var b={r:255,g:255,b:255},c=!1;typeof a=="string"&&(a=O(a));if(typeof a=="object")if(a.hasOwnProperty("r")&&a.hasOwnProperty("g")&&a.hasOwnProperty("b"))b={r:l(a.r,255)*255,g:l(a.g,255)*255,b:l(a.b,255)*255},c=!0;else if(a.hasOwnProperty("h")&&a.hasOwnProperty("s")&&a.hasOwnProperty("v")){var d=a.h;b=a.s;a=a.v;var i,e,f;d=l(d,360);b=l(b,100);a=l(a,100);c=Math.floor(d*6);var g=d*6-c;d=a*(1-b);var q=a*(1-g*b);b=a*(1-(1-g)*b);switch(c%6){case 0:i=a;e=b;f=d;break;
case 1:i=q;e=a;f=d;break;case 2:i=d;e=a;f=b;break;case 3:i=d;e=q;f=a;break;case 4:i=b;e=d;f=a;break;case 5:i=a,e=d,f=q}b={r:i*255,g:e*255,b:f*255};c=!0}else a.hasOwnProperty("h")&&a.hasOwnProperty("s")&&a.hasOwnProperty("l")&&(b=P(a.h,a.s,a.l),c=!0);return{ok:c,r:Math.min(255,Math.max(b.r,0)),g:Math.min(255,Math.max(b.g,0)),b:Math.min(255,Math.max(b.b,0))}}function f(a,b,c){a=l(a,255);b=l(b,255);c=l(c,255);var d=Math.max(a,b,c),e=Math.min(a,b,c),h,f=(d+e)/2;if(d==e)h=e=0;else{var g=d-e;e=f>0.5?g/
(2-d-e):g/(d+e);switch(d){case a:h=(b-c)/g+(b<c?6:0);break;case b:h=(c-a)/g+2;break;case c:h=(a-b)/g+4}h/=6}return{h:h*360,s:e*100,l:f*100}}function P(a,b,c){function d(a,b,c){c<0&&(c+=1);c>1&&(c-=1);if(c<1/6)return a+(b-a)*6*c;if(c<0.5)return b;if(c<2/3)return a+(b-a)*(2/3-c)*6;return a}a=l(a,360);b=l(b,100);c=l(c,100);if(b==0)c=b=a=c;else{var e=c<0.5?c*(1+b):c+b-c*b,f=2*c-e;c=d(f,e,a+1/3);b=d(f,e,a);a=d(f,e,a-1/3)}return{r:c*255,g:b*255,b:a*255}}function o(a,b,c){a=l(a,255);b=l(b,255);c=l(c,255);
var d=Math.max(a,b,c),e=Math.min(a,b,c),f,g=d-e;if(d==e)f=0;else{switch(d){case a:f=(b-c)/g+(b<c?6:0);break;case b:f=(c-a)/g+2;break;case c:f=(a-b)/g+4}f/=6}return{h:f*360,s:(d==0?0:g/d)*100,v:d*100}}function F(a,b,c){function d(a){return a.length==1?"0"+a:a}return[d(g(a).toString(16)),d(g(b).toString(16)),d(g(c).toString(16))].join("")}function l(a,b){typeof a=="string"&&a.indexOf(".")!=-1&&parseFloat(a)===1&&(a="100%");var c=typeof a==="string"&&a.indexOf("%")!=-1;a=Math.min(b,Math.max(0,parseFloat(a)));
c&&(a*=b/100);if(Math.abs(a-b)<1.0E-6)return 1;else if(a>=1)return a%b/parseFloat(b);return a}function n(a){return Math.min(1,Math.max(0,a))}function O(a){a=a.replace(s,"").replace(A,"").toLowerCase();G[a]&&(a=G[a]);if(a=="transparent")return{r:0,g:0,b:0,a:0};var b;if(b=p.rgb.exec(a))return{r:b[1],g:b[2],b:b[3]};if(b=p.hsl.exec(a))return{h:b[1],s:b[2],l:b[3]};if(b=p.hsv.exec(a))return{h:b[1],s:b[2],v:b[3]};if(b=p.hex6.exec(a))return{r:parseInt(b[1],16),g:parseInt(b[2],16),b:parseInt(b[3],16)};if(b=
p.hex3.exec(a))return{r:parseInt(b[1]+""+b[1],16),g:parseInt(b[2]+""+b[2],16),b:parseInt(b[3]+""+b[3],16)};return!1}var e=function(a,b){if(typeof a=="object"&&a.hasOwnProperty("_tc_id"))return a;if(typeof a=="object"&&(!b||!b.skipRatio))for(var c in a)a[c]===1&&(a[c]="1.0");c=w(a);var d=c.r,e=c.g,h=c.b;return{ok:c.ok,_tc_id:u++,toHsv:function(){return o(d,e,h)},toHsvString:function(){var a=o(d,e,h);return"hsv("+g(a.h)+", "+g(a.s)+"%, "+g(a.v)+"%)"},toHsl:function(){return f(d,e,h)},toHslString:function(){var a=
f(d,e,h);return"hsl("+g(a.h)+", "+g(a.s)+"%, "+g(a.l)+"%)"},toHex:function(){return F(d,e,h)},toHexString:function(){return"#"+F(d,e,h)},toRgb:function(){return{r:g(d),g:g(e),b:g(h)}},toRgbString:function(){return"rgb("+g(d)+", "+g(e)+", "+g(h)+")"},toName:function(){return U[F(d,h,e)]||!1}}};e.version="0.4.2";var s=/^[\s,#]+/,A=/\s+$/,u=0,g=Math.round;e.equals=function(a,b){return e(a).toHex()==e(b).toHex()};e.desaturate=function(a,b){var c=e(a).toHsl();c.s-=(b||10)/100;c.s=n(c.s);return e(c)};e.saturate=
function(a,b){var c=e(a).toHsl();c.s+=(b||10)/100;c.s=n(c.s);return e(c)};e.greyscale=function(a){return e.desaturate(a,100)};e.lighten=function(a,b){var c=e(a).toHsl();c.l+=(b||10)/100;c.l=n(c.l);return e(c)};e.darken=function(a,b){var c=e(a).toHsl();c.l-=(b||10)/100;c.l=n(c.l);return e(c)};e.triad=function(a){return e.tetrad(a).slice(0,3)};e.tetrad=function(a){a=e(a).toRgb();return[e({r:a.r,g:a.g,b:a.b}),e({r:a.b,g:a.r,b:a.g}),e({r:a.g,g:a.b,b:a.r}),e({r:a.r,g:a.b,b:a.r})]};e.splitcomplement=function(a){var b=
e(a).toHsv();return[e(a),e({h:(b.h+72)%360,s:b.s,v:b.v}),e({h:(b.h+216)%360,s:b.s,v:b.v})]};e.analogous=function(a,b,c){b=b||6;c=c||30;var d=e(a).toHsv();c=360/c;a=[e(a)];for(d.h=(d.h-(c*b>>1)+720)%360;--b;)d.h=(d.h+c)%360,a.push(e(d));return a};e.monochromatic=function(a,b){b=b||6;for(var c=e(a).toHsv(),d=[];b--;)d.push(e(c)),c.v+=0.2,c.v%=1;return d};e.readable=function(a,b){var c=e(a).toRgb(),d=e(b).toRgb();return(d.r-c.r)*(d.r-c.r)+(d.g-c.g)*(d.g-c.g)+(d.b-c.b)*(d.b-c.b)>10404};var G=e.names=
{aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",
darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",
green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",
lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",
orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",
springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},U=function(a){var b={},c;for(c in a)a.hasOwnProperty(c)&&(b[a[c]]=c);return b}(G),p={rgb:RegExp("rgb[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),hsl:RegExp("hsl[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
hsv:RegExp("hsv[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),hex3:/^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/};return e}();
