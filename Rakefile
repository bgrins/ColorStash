require 'rubygems'

def minify(files)
  files.each do |file|
    cmd = "java -jar lib/yuicompressor-2.3.1.jar #{file} -o out/#{file}"
    puts cmd
    ret = system(cmd)
    raise "Minification failed for #{file}" if !ret
  end
end

desc "minify"
task :minify => [:minify_css]

desc "minify css"
task :minify_css do
  minify(FileList['*.css'])
end

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
  
  source = File.read 'c.js'
  File.open('out/c.js', 'w+') do |file|
    file.write Closure::Compiler.new.compress(source)
  end
  
  source = File.read 'c.css'
  File.open('out/c.css', 'w+') do |file|
    file.write YUICompressor.compress_css(source)
  end
    
  cp 'index.html', 'out/index.html'
  cp 'colorstash_pdn.png', 'out/colorstash_pdn.png'
  
end

