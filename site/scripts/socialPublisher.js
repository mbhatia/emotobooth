'use strict';

var Twitter = require('twitter');
var GitHubApi = require("github");
var fs = require('fs');
var cp = require('child_process');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

module.exports = {
  SocialPublisher: function(credentials, callback) {
    this.callback = callback;
    this.credentials = credentials;

    this.SCOPES = ['https://www.googleapis.com/auth/drive'];
    this.TOKEN_DIR = __dirname + '/.credentials/';
    this.TOKEN_PATH = this.TOKEN_DIR + 'drive-nodejs-quickstart.json';
    this.auth;

    this.authorize = function(credentials, callback) {
      var clientSecret = credentials.installed.client_secret;
      var clientId = credentials.installed.client_id;
      var redirectUrl = credentials.installed.redirect_uris[0];
      var auth = new googleAuth();
      var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

      // Check if we have previously stored a token.
      fs.readFile(this.TOKEN_PATH, (function(err, token) {
        if (err) {
          this.getNewToken(oauth2Client, callback);
        } else {
          oauth2Client.credentials = JSON.parse(token);
          callback(oauth2Client);
        }
      }).bind(this));
    }

    this.getNewToken = function(oauth2Client, callback) {
      var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: this.SCOPES
      });
      console.log('Authorize this app by visiting this url: ', authUrl);
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question('Enter the code from that page here: ', (function(code) {
        rl.close();
        oauth2Client.getToken(code, (function(err, token) {
          if (err) {
            console.log('Error while trying to retrieve access token', err);
            return;
          }
          oauth2Client.credentials = token;
          this.storeToken(token);
          callback(oauth2Client);
        }).bind(this));
      }).bind(this));
    }

    this.storeToken = function(token) {
      try {
        fs.mkdirSync(this.TOKEN_DIR);
      } catch (err) {
        if (err.code != 'EEXIST') {
          throw err;
        }
      }
      fs.writeFile(this.TOKEN_PATH, JSON.stringify(token));
      console.log('Token stored to ' + this.TOKEN_PATH);
    }
    
    fs.readFile('client_secret.json', (function(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }
      this.authorize(JSON.parse(content), (this.saveAuth).bind(this));
    }).bind(this));

    this.github = new GitHubApi({
      // required
      version: "3.0.0",
      // optional
      debug: false,
      protocol: "https",
      host: "api.github.com", // should be api.github.com for GitHub
      pathPrefix: "", // for some GHEs; none for GitHub
      timeout: 5000,
      headers: {
        "user-agent": "Query-It" // GitHub is happy with a unique user agent
      }
    });

    this.github.authenticate(this.credentials.GITHUB);

    this.twitter = new Twitter(this.credentials.TWITTER);

    this.uploadPhotos = function(id, sessionData) {
      let cmd = 'eval "$(ssh-agent -s)"; ssh-add ~/.ssh/gcpemotobooth; /usr/bin/git clone git@gist.github.com:' + id + "; cd " + id + ";";
      let i = 0;
      for (let key in sessionData) {
        if (sessionData[key].finalPath) {
          cmd += " cp ../" + sessionData[key].finalPathChrome + " ./_photo" + (i++) + ".png;"
        }
      }
      cmd += " /usr/bin/git add .; /usr/bin/git commit -m 'n/a'; /usr/bin/git push; cd ..; rm -rf " + id + ";";
      
      cp.exec(cmd,
        function (error, stdout, stderr) {
          console.log(stdout, stderr);
          if (error !== null) {
            console.log('exec error: ' + error);
          }
        });

      var service = google.drive('v3');
      i = 0;
      let now = (new Date()).getTime();
      for (let key in sessionData) {
        if (sessionData[key].finalPath) {

          service.files.create({
            auth: this.auth,
            uploadType: "multipart",
            resource: {
              name: now + '-' + i + '.png',
              mimeType: 'image/png',
              parents: [this.credentials.DRIVE.folderId]
            },
            media: {
              mimeType: 'image/png',
              body: fs.createReadStream(sessionData[key].finalPathChrome)
            }
          }, function(err, response) {
            if (err) {
              console.log('The API returned an error: ' + err);
              return;
            }
            console.log(response);
          });
        }
      }
    }

    this.saveAuth = function(auth) {
      this.auth = auth;
    }

    this.uploadTweet = function(gistUrl, sessionData) {
      var photoData = fs.readFileSync(
        sessionData[sessionData.highestScoredKey].finalPathChrome);
      this.twitter.post('media/upload', {media: photoData}, function(err, media, response){
        if (!err) {
          var status = {
            status: 'Thanks for visiting the @GCPEmotobooth! See all photos and data from this session → ' + gistUrl,
            media_ids: media.media_id_string
          }

          this.twitter.post('statuses/update', status, function(err, tweet, response){
            if (err) {
              console.log('TWITTER ERROR: ' + JSON.stringify(err, null, '  '));
            } else {
              sessionData.tweetId = tweet.id_str;
              this.callback(sessionData);
            }
          }.bind(this));
        } else {
          console.log('TWITTER ERROR: ' + JSON.stringify(err, null, '  '));
        }
      }.bind(this));
    }

    this.createGist = function(sessionData) {
      let files = {};

      var i = 0;
      for (let key in sessionData) {
        if (sessionData[key].respPath) {
          files['photo' + (i++) + '.json'] = {
            'content': JSON.stringify(JSON.parse(fs.readFileSync(sessionData[key].respPath, {encoding: 'utf8'})), null, '  ')
          }
        }
      }

      this.github.gists.create({
        'description': 'Google I/O photo session',
        'public': false,
        'files': files
      }, (err, res) => {
          console.log('GIST CREATED AT: ' + res.id);
          sessionData.gistId = res.id;
          this.callback(sessionData);
          this.uploadPhotos(res.id, sessionData);
          this.uploadTweet(res.html_url, sessionData);
      });
    }

    this.share = function(sessionData) {
      this.createGist(sessionData);
    }

    this.delete = function(gistId, tweetId) {
      this.github.gists.delete({
        id: gistId
      }, (err, res) => {
        if (err) {
          console.log('GIST ERROR: ' + err);
        }
      });

      this.twitter.post(`statuses/destroy/${tweetId}`, (err, res) => {
        if (err) {
          console.log('TWITTER ERROR: ' + JSON.stringify(err, null, '  '));
        }
      });
    }
  }
};
