import express from 'express';
const bodyParser = require("body-parser");
const app = express.Router();
const snoowrap = require('snoowrap');
const MarkdownIt = require('markdown-it');
const { URL } = require('url');

const production = process.env.NODE_ENV === 'production'
const redditAPI = !production ? {
	clientSecret: process.env.REACT_APP_CLIENT_SECRET_DEV,
	clientID: process.env.REACT_APP_CLIENT_ID_DEV,
	redirectUri: process.env.REACT_APP_HOME_DEV	
	} : {
	clientSecret: process.env.REACT_APP_CLIENT_SECRET,
	clientID: process.env.REACT_APP_CLIENT_ID,
	redirectUri: process.env.REACT_APP_HOME			
	}
const md = new MarkdownIt()

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/api/v1/reddit/auth_url', (req, res) => {
  let authUrl = snoowrap.getAuthUrl({
    clientId: redditAPI.clientID,
    scope: ['read'],
    redirectUri: redditAPI.redirectUri
  })
	res.send({authUrl: authUrl})
})

// accepts a reddit api code from frontend and returns api key
app.post('/api/v1/reddit/key', (req, res) => {
	var code=req.body.code;
	snoowrap.fromAuthCode({
		code: code,
		userAgent: 'web:com.dynamiccalamity.dnd100:v1.0.0 (by /u/tailgunner_beavis)',
		clientId: redditAPI.clientID,
		clientSecret: redditAPI.clientSecret,
		redirectUri: redditAPI.redirectUri
	}).then(
		r => {res.send({'refreshToken': r.refreshToken})},
		r => {res.send({'redirectUri': redditAPI.redirectUri})}
	)
})

// accepts the reddit api refreshToken and url to import, returns list generated from page contents
app.post('/api/v1/reddit/import_link', (req, res) => {
	var link=req.body.link
	var refreshToken=req.body.refreshToken;
	console.log(link, refreshToken)
  var newLink = importLink(link, redditFromRefreshToken(refreshToken))
  newLink.then(object => res.send(object))
})

// accepts the refreshToken and returns a list of categorized lists links
app.post('/api/v1/reddit/get_lists', (req, res) => {
	var importLists = getLists(req.body.refreshToken)
	importLists.then(list => res.send(list))
})


function getLists(refreshToken){
  let r = redditFromRefreshToken(refreshToken)
  if(!r){ return }
  return(r.getSubmission('73v0ym').selftext.then((text) => md.parse(text, {})).then(tokens => {
          let category = null
          let importLists = tokens.reduce((result, token) => {
            if(token.type === "inline"){ 
              if(token.children && token.children.find(child => child.type === "link_open")){
                let url = token.children.find(child => child.type === "link_open").attrs[0][1]
                let linkTitle = token.children.find(child => child.type === "text").content
                result.push(Object.assign({title: linkTitle, url: url, category: category}, getUrlType(url)))
              } else {
                category = token.content
              }
              
            } return result
          }, [])
          return({importLists: importLists})
        }))    
}

function redditFromRefreshToken(refreshToken) {
  var r = new snoowrap({ 
    userAgent: 'web:com.dynamiccalamity.dnd100:v1.0.0 (by /u/tailgunner_beavis)',
    clientId: redditAPI.clientID,
    clientSecret: redditAPI.clientSecret,
    refreshToken: refreshToken
  })
  return r
}

/** 
link object {
	category: "Encounters"
	id: "6zx7m0"
	list: (100) ["Restless night. Do not gain any benefits from the …o determine a party member which this happens to.", "a small rodent wanders through your camp it seems to be begging you for food.", "A PC starts talking in their sleep.", "You hear an owl hooting, but cannot spot its den nearby.", "A ghost appears and asks you for a favor.", "You start to nod off. Roll CON to stay awake.", "You get really hungry. Tomorrows rations are looking delicious", "You get wrapped up in your own thoughts, reflecting upon decisions made in your past.", "You hear a couple chatting and laughing as they walk by in the night.", "You spot some glowing mushrooms just outside of camp.", "A fire starts nearby. The Player can see an orange…ow to the sky and embers permeating into the sky.", "Raccoons (or some other rodent) come in and eat al…so stooled in your favorite spare set of clothes.", "Random player gets stung by scorpion/wasp/mosquito 1 damage.", "Camped out on a sink hole. Roll a d20. On a 17 or …e or other facility. Could also be a simple hole.", "you smell something cooking. There is a nearby gob…the player unless they are particularly careless.", "The night has been particularly cold, there is a r… of the PC's tents in order to stay warm and dry.", "A bird (Or other small animal) shows up at the camp and refuses to leave.", "Slept on a small rock, root or stick. Have a tender spot or sore back for 1d4 hours.", "Spider/scorpion/rodent crawled into boot. Do a per…ng boots on unless they knock the boots out first", "A herd of (fill in random animal) rush toward the campsite. Clearly spooked by something nearby.", "A vicious storm begins to brew in the area. Raging winds and torrential rain begin to fall.", "A nearby fire flickers green for a moment, then subsides. Magic? Perhaps.", "Far off, very far off, someone screams", "Silence. Oppressive silence. Is that a good omen? You hope it is...", "A rumble of thunder. The sky is restless.", "Something lies in the dirt face down. Looks like i…book, or a shoe, or a bounty note ... you decide.", "A predator (appropriate to environment) lurks nearby. It's watching you intently.", "You wet the bed (no damage, you just smell awful the next day)", "A PC has a nightmare and wakes up screaming. Then they go right back to sleep.", "A madman is heard nearby, jabbering: "He is angry, He demands me to please Him!"", "A sleeping party member has bad gas. roll CON or wake up annoyed.", "A small native animal approaches. If the PCs are k…id and casts a detrimental spell. It then leaves.", "Everyone's shoes are filled to the brim with dirt. All Party Members deny doing it.", "A pixie has replaced all your water with wine.", "A pack of wolves is heard howling at the moon near…w minutes later they are heard much farther away.", "A brown bear (or a large creature native to the en…o camp, trying to sniff out the player's rations.", "A foraging party of chaotic evil bipedals (2 orcs …maybe have the player at watch roll intimidation)", "You hear the sounds of a wounded animal in a trap.…, can search for the hunter who placed the trap).", "Two cultists carrying a bonded sacrifice pass near…f freed, the sacrifice will run away immediately.", "Another adventuring party's camp has settled near …ld potentially trade goods with the nearby party.", "A meteor lands nearby", "A group of 1d4 wild boar attempt to eat all your f…. Player on watch can potentially lure them away.", "A solemn procession of hooded figures carrying lanterns pass nearby.", "A friendly giant approaches your camp, asking for directions.", "In the morning, before leaving, you notice a valua… missing. roll WIS to remember where you left it.", "allergens are particularly bad this night, roll CO…Disadvantage on perception for the following day.", "you receive a message through courier or Sending.", "A wizard teleports into your camp, he is very flus…ll reward the PC's if they assist him in some way", "a PC won't stop snoring. other players roll CON or…e on ability checks for 1d4 hours in the morning.", "the party has a group dream and the artifact they …ifact is likely cursed in some way, you decide...", "dream of eating some delicious chicken, only to be awoken by a chicken sitting on them.", "You hear a cry from nearby. Upon investigation you…ropriate creature). The child is hungry and cold.", "a small mammal absconds with [1d4] coins, or a mundane small object in the PCs possession.", "a cursory check shows the PCs' waterskins have som…rendering the water within rancid and undrinkable", "you see a shooting star.", "a group of priests walks past your camp offering t…ir blessing and prayers for a night at your fire.", "A dense fog rolls in and persists through the earl…rning (disadvantage on perception for 1d4 hours).", "A stranger approaches the campsite, making no effo…ill walk away disappointed if the player refuses.", "Succubus appears to the player, and offers a great…sks if they want to be the white or black pieces.", "The night has been particularly hot and humid, all PC's that can sweat wake up sticky and smelly", "The night has been particularly dry, you wake up with cracked, bleeding lips and a dry thirst.", "The night has been particularly wet, the PC's clothes are now all sodden with cold mud.", "You find a pseudo-dragon rummaging around the grou…a real dragon cursed with being very, very small.", "a neglected and beaten mule will wake the party up…ting. Deal with it, and you can go back to sleep.", "During the middle of the rest, a strange goblin ap…ted him off to. He might even give them a reward.", "Crickets chirp incessantly. Their chirping reminds…ou once heard. That song gets stuck in your head.", "the fire dies out. It is pitch dark. (get more woo…rmine what happens while you search for firewood)", "A player accidentally slept on top of their arm. T…has -2 to dex rolls for 1d4 hours in the morning.", "A snake is found coiled near the camp. If approach…s. They act as a healing potion if added to food.", "A puppy, looking to play, wakes the party in the n…morning and leaves a copper for the brave heroes.", "A mysterious stranger comes to the camp and asks t…coffee beans/hard candies when they leave at dawn", "A threatening note is stabbed into a nearby tree with a peculiar knife.", "Kids are hiding nearby throwing pebbles into the camp.", "some mischievous fay/sprite has managed to somehow extend your slumber. You over-sleep by 2d4 hours.", "It is a full moon (DM can initiate something based on this or just leave it like nothing happened)", "You can hear very distant and faint music", "An insect falls into a players mouth while they sleep.", "Random PC awakes to find a trinket beneath their backpack (roll from trinket list).", "As your party awakens (party member with highest p…lutching 1d4 electrum coins + 5d10 silver pieces.", "While packing up, a bird (or bat) does his business on (Random pc) in plain sight of everyone.", "A random pc accidentally slept on a poisonous plan…he environment) and now has a rash for 1d4 hours.", "The night was excessively cold. As a result of the…o unsheath weapons using scabbards for 1d8 hours.", "You meet a group of adventurers coming the other w…ngings. A mischievous NPC is likely at work here.", "Over the course of several hours dozens of large p…s to know why you desecrated a previous location.", "your PCs share tales of their homelands or valiant…ver PC did the best (subjective) job roleplaying.", "Lightning strikes a nearby graveyard (1d8 zombies begin to wander within it).", "A witch casts sleep on the PC on watch. She leaves…, but have a detrimental effect upon being drunk.", "One of the PCs has a lucid dream, the dream begins…id dream. He/she wakes up at the DM's discretion.", "A traveling merchant appears when the party wakes …e forgotten to purchase before leaving the city).", "A group of 1d4 bandits raid the camp at night, all…n is blown and the bandits retreat. I wonder why?", "You get a restful sleep and restore one additional hit die in the morning.", "At the very edge of your vision, you think you see a unicorn passing through.", "There are tremors in the middle of the night. If c…then maybe a tree falls, make a dex saving throw.", "A large piece of fruit falls on [roll for party me…a child's prank or something similar. You decide.", "A random PC catches a cold, disadvantage on ability checks for 4d6 hours.", "A single bard approaches the party and offers them…nd good stories in exchange for a nights company.", "The Sunrise is particularly beautiful. If a party …r is on watch at the time, they gain inspiration.", "An NPC explains you're not allowed to camp here, and demands 2d4 silver from the party.", "A dragon flies overhead. It seems that it did not spot you. Lucky.", "A gemstone falls from the sky. What is it worth, you wonder? And where did it come from?"]
	title: "Long Rest Encounters"
	type: "reddit"
	url: "https://www.reddit.com/r/d100/comments/6zx7m0/d100_long_rest_events/"
} 
**/

// take link object return link object with imported array in link.list
function importLink(link, r){
  let table_open, table_body, ordered_list, list = null
  // console.log(callback)
  console.log(r.refreshToken)
  console.log(link.id)
  return( r.getSubmission(link.id).selftext.then((text) => md.parse(text, {})).then(tokens => {
    table_open = tokens.findIndex(token => token.type === "table_open")
    table_body = tokens.findIndex(token => token.type === "tbody_open")
    ordered_list = tokens.findIndex(token => token.type === "ordered_list_open")
    if(table_open > 0 && table_body > 0) { //this is a reddit table
      console.log("found table")
      list = tokens.reduce((result, token, index) => {
        if(index > table_body){
          if(token.type === "inline" && token.content.length > 3) {
            result.push(token.content)
          }
        }
        return(result)
      }, [])
    }
    if(table_open < 0 && ordered_list < 0) { //this is a text list assume the first character is a number
      console.log("no table regular text")
      list = tokens.reduce((result, token) => {
        if(token.type === "inline" && token.content.match(/^\d+/gm)){
          result.push(token.content.replace(/^\d+[ -.]*/, ""))
        }
        return(result)
      }, [])
    }
    if(table_open < 0 && ordered_list >= 0) { //this is an ordered list
      console.log("no table ordered list")
      list = tokens.reduce((result, token, index) => {
        if(token.type === "inline" && index > ordered_list){
          result.push(token.content)
        }
        return(result)
      }, [])
    }
    return( Object.assign(link, {list: list}) )     
  }))

}

function getUrlType(url){
  let checkUrl = new URL(url)
  let type, id = null
  switch(checkUrl.host){
    case "www.reddit.com":
      type = 'reddit'
      id = checkUrl.pathname.split('/')[4]
      break
    default:
      break
  }
  
  return({type: type, id: id})
}

module.exports = app;