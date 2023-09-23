const fs = require('fs');

console.log('postbuild: Copying package.json to info.json...');
fs.copyFileSync('./package.json', './src/info.json');

if (fs.existsSync('dist')) {
    console.log('postbuild: Cleaning dist folder...');
    fs.rmSync('dist', { recursive: true });
}

console.log('postbuild: Done!');
