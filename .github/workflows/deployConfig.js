import info from '../../package.json' assert { type: 'json' };

export default {
  tasks: [{
    hostname: process.env.SUB_FTP_HOSTNAME,
    username: process.env.SUB_FTP_USERNAME,
    password: process.env.SUB_FTP_PASSWORD,
    source: './server/dist',
    destination: 'v' + info.version
  }, {
    hostname: process.env.TOP_FTP_HOSTNAME,
    username: process.env.TOP_FTP_USERNAME,
    password: process.env.TOP_FTP_PASSWORD,
    source: './demo',
    destination: '',
    clearDestination: true
  }]
}
