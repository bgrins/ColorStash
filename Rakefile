require 'rubygems'

desc "rebuild the spectrum.js files for distribution"
task :build do
  begin
    require 'closure-compiler'
  rescue LoadError
    puts "closure-compiler not found.\nInstall it by running 'gem install closure-compiler"
    exit
  end
  
  begin
    require 'yuicompressor'
  rescue LoadError
    puts "yuicompressor not found.\nInstall it by running 'gem install yuicompressor"
    exit
  end
  
  system('rm out/*')
  
  source = File.read 'c.js'
  File.open('out/c.js', 'w+') do |file|
    #file.write YUICompressor.compress_js(source)
    file.write Closure::Compiler.new.compress(source)
  end
  
  source = File.read 'c.css'
  File.open('out/c.css', 'w+') do |file|
    file.write YUICompressor.compress_css(source)
  end
    
  cp 'index.html', 'out/index.html'
  #cp 'stacheonly.png', 'out/c.png' 
  
  system('pngcrush -reduce -brute stacheonly.png out/stacheonly.png')
  system('tar --exclude=".*" -pvczf out.tar.gz out')
  system('ls -l out.tar.gz')
end

