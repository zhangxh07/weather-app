
const { program } = require('commander');
const WeatherCLI = require('./cli');
const WeatherWebServer = require('./webserver');


program.
    name('weather-app').
    description('天气查询应用').
    version('1.0.0');

program
  .command('cli')
  .description('启动命令行版本')
  .action(() => {
    const cli = new WeatherCLI();
    cli.start();
  });

program
  .command('web')
  .description('启动Web服务器版本')
  .action(() => {
    const server = new WeatherWebServer();
    server.start();
  });

program
  .command('version')
  .description('显示版本信息')
  .action(() => {
    console.log('天气查询应用 v1.0.0');
  });

program.parse();