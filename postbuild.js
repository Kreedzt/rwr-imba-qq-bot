const fs = require('fs');

const appVersion = process.env.APP_VERSION;

console.log('postbuild: Copying package.json to info.json...');
fs.copyFileSync('./package.json', './src/info.json');

if (appVersion) {
    console.log('postbuild: Updating package version...', appVersion);
    const info = JSON.parse(fs.readFileSync('./src/info.json'));
    info.version = appVersion;
    fs.writeFileSync('./src/info.json', JSON.stringify(info, null, 2));
}

if (fs.existsSync('dist')) {
    console.log('postbuild: Cleaning dist folder...');
    fs.rmSync('dist', { recursive: true });
}

console.log('postbuild: Done!');
