require('dotenv').config();

const request = require('request');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

const config = {
  destDir: './dest'
};

const currentTemplate = argv.template;

const apiBaseConfig = endpoint => ({
  url: `${process.env.EMAIL_SERVICE_URL}/${endpoint}`,
  headers: {
    Authorization: `Bearer ${process.env.EMAIL_SERVICE_KEY}`,
    'Content-Type': 'application/json'
  }
});

function getCurrentTemplate() {
  return new Promise((resolve, reject) => {
    request.get(
      {
        ...apiBaseConfig('designs')
      },
      function(err, _, body) {
        if (err) {
          return reject(err);
        }

        const data = JSON.parse(body);

        const currentTemplateConfig = data.result.find(({ name }) => name === currentTemplate);

        resolve({
          id: currentTemplateConfig && currentTemplateConfig.id
        });
      }
    );
  });
}

function sendTemplate(data, tplId) {
  return new Promise((resolve, reject) => {
    const tplEndpoint = 'designs';
    const baseEndpoint = tplId ? `${tplEndpoint}/${tplId}` : tplEndpoint;

    request(
      {
        ...apiBaseConfig(baseEndpoint),
        method: tplId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: currentTemplate,
          html_content: data
        })
      },
      function(err, _, body) {
        if (err) {
          return reject(err);
        }

        const bodyData = JSON.parse(body);

        resolve(bodyData);
      }
    );
  });
}

function createTemplate() {
  return new Promise((resolve, reject) => {
    if (!currentTemplate) {
      return 'Error - Template is not defined!';
    }

    const templateFile = `${config.destDir}/${currentTemplate}.html`;

    fs.readFile(
      templateFile,
      {
        encoding: 'utf-8'
      },
      function(err, data) {
        if (err) {
          return reject(err);
        }

        getCurrentTemplate()
          .then(({ id }) => {
            sendTemplate(data, id)
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      }
    );
  });
}

createTemplate()
  .then(console.log)
  .catch(console.log);
