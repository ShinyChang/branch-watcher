require('dotenv').config();
const http = require('http');
const fetch = require('node-fetch');

http
  .createServer((req, res) => {
    let data = [];
    req.on('data', chunk => {
      data.push(chunk);
    });
    req.on('end', () => {
      if (req.headers['x-github-event'] === 'push') {
        const json = JSON.parse(data.join(''));
        const {
          ref,
          after,
          repository: { full_name }
        } = json;
        const branch = ref.replace('refs/heads/', '');
        if (branch === process.env.BRANCH_NAME) {
          notifySlack({ repo: full_name, branch, commit: after });
        }
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write('OK!');
      res.end();
    });
  })
  .listen(process.env.PORT || 8080);

const notifySlack = ({ commit, repo, branch }) =>
  fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: JSON.stringify({
      channel: process.env.SLACK_WEBHOOK_CHANNEL,
      username: `bot`,
      text: `${repo}/${branch}#${commit}`
    })
  });
