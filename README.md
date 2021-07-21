# dnd100

This project displays user generated Dungeons and Dragons random encounter lists found on reddit.

Use https://www.reddit.com/prefs/apps for creating app api keys.

Running with Docker
REACT_APP_CLIENT_ID = Reddit Web App ID
REACT_APP_CLIENT_SECRET = Reddit Web App Secret
REACT_APP_HOME = Redit Web App redirect uri

docker run -d -e "REACT_APP_CLIENT_ID=***********" -e "REACT_APP_CLIENT_SECRET=************" -e "REACT_APP_HOME=https://********" -p 3000:3000 dnd100
