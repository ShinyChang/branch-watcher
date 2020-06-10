require("dotenv").config();
const http = require("http");
const fetch = require("node-fetch");

http
  .createServer((req, res) => {
    let data = [];
    req.on("data", (chunk) => {
      data.push(chunk);
    });
    req.on("end", () => {
      if (req.headers["x-github-event"] === "push") {
        const json = JSON.parse(data.join(""));
        const {
          ref,
          head_commit,
          repository: { name },
        } = json;
        const branch = ref.replace("refs/heads/", "");
        if (branch === process.env.BRANCH_NAME) {
          notifySlack({ repo: name, branch, commit: head_commit });
        }
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write("OK!");
      res.end();
    });
  })
  .listen(process.env.PORT || 8080);

const notifySlack = ({ commit, repo, branch }) =>
  fetch(process.env.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: JSON.stringify({
      channel: process.env.SLACK_WEBHOOK_CHANNEL,
      username: `bot`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<${commit.url}|${commit.message.split('\n')[0]}>`,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Repo:*\n${repo}`,
            },
            {
              type: "mrkdwn",
              text: `*Branch:*\n${branch}`,
            },
            {
              type: "mrkdwn",
              text: `*Hash:*\n${commit.id}`,
            },
            {
              type: "mrkdwn",
              text: `*Author:*\n${commit.author.name}`,
            },
          ],
        },
      ],
    }),
  });
