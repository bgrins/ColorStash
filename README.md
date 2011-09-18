Title: ColorStash
Description: 
ColorStash is a tiny web app I built for the <a href='http://10k.aneventapart.com/'>10K Apart contest</a>.  The goal of the contest is to build an application in under 10 Kilobytes.  This includes all HTML, JavaScript, CSS, and images.

From my description in the <a href='#'>10K Apart entry</a>:
<blockquote>
ColorStash lets you pick, convert, save, and share colors and schemes.  Use the custom built colorpicker, permissive text parsing, and color scheme generators. Stash colors in localStorage or share them from the URL.

Responsive: Different layouts for widths < 600px and > 1200px to maximize available space. 

You'll be amazed at how much this does in under 10k!

Read more at http://www.briangrinstead.com/blog/colorstash.  I explain the responsive design decisions and components I built for this project.
</blockquote>

<h3>Responsive</h3>
One of the main goals of the contest this year was that the app had to be "responsive".  It was a cool way to learn about this new trend in web development.  I had to spend extra time thinking about how it should work at different resolutions, but I think the outcome was better for not only those different resolutions, but even the normal one.
<ul>
<li><strong>Less than 600px</strong>: and everything is moved into a vertical line.  Additionally, schemes get vertical layout - otherwise they would be too small (since they are a percentage width).</li>
<li><strong>Greater than 1200px</strong>: everything is moved into one row.  This is to make better use of avaiable horizontal space, and because of a unique problem that the colorpicker presents.  It must keep a 1:1 aspect ratio for the middle area (where you drag around to control saturation and value).  By moving the schemes into the row, the picker only takes up 33% of the width, which helps keep it from becoming way too tall to fit on a widescreen monitor.  
<li><strong>On iPhone / iPad</strong>: The colorpicker hue slider gets wider to make sliding easier with touch events.  Also, the 'pallet' options at the top become wider.  I think it is just harder to tap on a small area than click.  Also, you probably don't need as many saved colors visible in a mobile environment.  Open up the site in an iPhone, and also inside a normal browser scaled down to 480px to see the difference between the two!</li>
<li><strong>Other mobile environments</strong>: Unfortunately, I don't have the resources to test other mobile phones, so I'm not sure if it works... If anyone knows of a good way to test this, please let me know!</li>
</ul>

<h3>Colors</h3>
I am no color expert, but I have been learning!  I wrote a <a href='http://github.com/bgrins/tinycolor'>JavaScript color parsing and conversion library</a> and a <a href='http://github.com/bgrins/spectrum'>JavaScript colorpicker</a> for this contest.  I found a lot of hsv/rgb/hsl/hex conversion algorithms on wikipedia.  The scheme generation functions were mostly from looking at a colorwheel, other parsing libraries, and this <a href='http://dev.opera.com/articles/view/8-colour-theory/'>Opera Color Theory</a> article.  After the contest, I hope to expand these and support other color formats. 

<h3>File Size</h3>
Compressed, crunched, and zipped ColorStash weighs in at 10,013 bytes.  Obviously, this is cutting it close to the 10K limit!

I wrote the first version without worrying about size.  It came it at maybe 20k.  Once I minified the resources, it got down to about 15.  Now it was time to start optimizing code (the fun part)!

I wrote a build task using Rake that would use Closure compiler on the JavaScript, YUI Compressor on the CSS, and pngcrush on the image, send them all to an output directory, zip it up, and tell me the size.  Since I was cutting it so close on the limit, this made size optimizations at the end much easier!

<h3>Browser Support</h3>
I built the <a href=''>JavaScript colorpicker</a> just for this contest.  One of the cool parts about it is that it uses CSS gradients / IE filters instead of images or canvas.  This makes it supported in a wide range of browsers, and very small!

<ul>
<li>Full Support: IE8+, Firefox 3.5+, Chrome, Safari, Opera, works on iPhone</li>
<li>Limited:  IE6/7 (no localStorage)</li>
</ul>
  
<h3>Fonts</h3>
I signed up for Typekit free edition for the contest.  Check out my fonts! <a href='http://typekit.com/colophons/zzr0ftq'>http://typekit.com/colophons/zzr0ftq</a>.  I think having the custom fonts is an easy way to make an app look nicer.  Here is a screenshot of with / without the fonts:

Screenshots: 600x400
  * iPhone
  * Normal
  * Large screen
  