import React, { Component } from 'react';
import logo from './dicelogo.png';
import './App.css';
import debounce from 'lodash/debounce';
const classnames = require('classnames');

class App extends Component {

  constructor(props){
    super(props)
    const code = new URL(window.location.href).searchParams.get("code")
    this.state = {
      importLists: JSON.parse(window.localStorage.getItem('importLists')) || [],
      keys: "", highlighted: "",
      dataStore: window.localStorage,
      code: code,
      refreshToken: window.localStorage.getItem('refreshToken')
    }
    this.setHighlighted = debounce(this.setHighlighted, 500)
  }

  componentDidMount(){
    if(this.state.importLists === undefined || this.state.importLists.length === 0) { 
      this.getLists()
    }
    if(this.state.code && !this.state.refreshToken){
      this.getRedditToken()
    }
  }

  getRedditToken(){
    if(!this.state.code && !this.state.refreshToken) {
      fetch("/api/v1/reddit/auth_url")
      .then(res => res.json())
      .then(response => window.location.assign(response.authUrl))
    } else if(this.state.code && !this.state.refreshToken) {
      fetch("/api/v1/reddit/key", {
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        },
        method: "POST",
        body: JSON.stringify({code: this.state.code})      
      }).then(res => {
        if(res.ok) {return res.json()}
        throw new Error(res.statusText)
      })
      .then(response => {
        if(response.refreshToken) {
          this.state.dataStore.setItem('refreshToken', response.refreshToken)
          this.setState({refreshToken: response.refreshToken}, () => this.getLists())
        } else if(response.redirectUri) {
          window.location.assign(response.redirectUri)
        }
      })
      .catch(error => console.error(error));

    }
  }

  getLists(){
    fetch("/api/v1/reddit/get_lists").then(res => res.json()
    ).then(response => this.setState(response, this.state.dataStore.setItem('importLists', JSON.stringify(response.importLists))))
  }

  importLink(link){
    if(!this.state.refreshToken) { this.getRedditToken() }
    fetch("/api/v1/reddit/import_link", {
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      method: "POST",
      body: JSON.stringify({link: link, refreshToken: this.state.refreshToken})
    } ).then(res => res.json()
    ).then(response => {
      let list = response
      let importLists = this.state.importLists
      let index = importLists.findIndex((list) => list.url === link.url)
      importLists[index] = list
      this.setState({importLists: importLists}) 
    })
  }

  showList(index){
    this.setState({displayedList: index}, () => {document.querySelector('.displayed-list').scrollIntoView({ 
                                                  behavior: 'smooth',
                                                  block : 'start'
                                                })})
  }

  scrollToHighlighted(){
    if(document.querySelector('.displayed-list .list-group-item.active')) {
      document.querySelector('.displayed-list .list-group-item.active').scrollIntoView({ 
        behavior: 'smooth' 
      })
    }    
  }

  setHighlighted = () => {
    this.setState({highlighted: this.state.keys, keys: ""})
    this.scrollToHighlighted()
  }

  reroll = () => {
    let roll = Math.floor(Math.random() * Math.floor(99)) + 1
    this.setState({keys: roll}, this.setHighlighted())
  }

  keyHandler(event) {
    if(!this.state.highlighted || this.state.keys !== this.state.highlighted){
      if(event.key.match(/^\d/)) {
        this.setState({keys: this.state.keys + event.key.toString() }, this.setHighlighted())
      }
    }
  }

  render() {

    const categories = this.state.importLists.reduce((result, item) => {
      if(!result.includes(item.category)) {
        result.push(item.category)
      }
      return(result)
    }, [])

    return (
      <div className="App container-fluid" tabIndex="0" onKeyDown={event => this.keyHandler(event)}>
        <header className="App-header row">
          <div className="col-sm-1">
            <img src={logo} className="App-logo" alt="logo" />
          </div>
          <div className="col-sm-11">
            <h1 className="App-title">dnd100</h1>
            <h3 className="App-subtitle">RPG Random Generator using lists from <a href="https://www.reddit.com/r/d100/">r/d100</a></h3>
            <p className="App-description"><a href="https://github.com/tailgunnerbeavis/dnd100">Source code</a></p>
          </div>
        </header>
        <div className="row">
          <div className="col-xl-3 col-sm-6 d100-sidebar" style={{}}>
          {categories.map(category => {
            return(
                <div className="" style={{textAlign: "left", padding: "1em"}} key={category+'div'}>
                <h5>{category}</h5>
                  <ul className="list-group flex-sm-column">
                  {this.state.importLists.filter(list => list.category === category).map((link, id) => {
                      return(
                          <li className="list-group-item" key={category+"li"+id}>
                          <a key={category+"a"+id} href={link.url} target="blank">{link.title}</a>
                          {link.type ? (link.list ? 
                            <i className="material-icons btn btn-primary"  onClick={() => this.showList(this.state.importLists.findIndex((list) => list.url === link.url))}>keyboard_arrow_right</i> : 
                            <i className="material-icons btn btn-outline-primary" onClick={() => this.importLink(link)}>cloud_download</i>) : null}
                          </li>
                        )
                    })}
                  </ul>
                </div>
            )}
          )}
          </div>
          {this.state.displayedList >= 0 ? 
            <div className="col-xl-9 col-sm-6 displayed-list">
              <h1>{this.state.importLists[this.state.displayedList].category} - {this.state.importLists[this.state.displayedList].title}</h1>
                <ol className="list-group" style={{textAlign: "left", lineHeight: "1.5rem"}}>
                  {this.state.importLists[this.state.displayedList].list.map((item, index) => {
                    return(
                      <li id={"index" + index + 1} key={"index" + index + 1} className={classnames("list-group-item", (index + 1) === parseInt(this.state.highlighted, 10) ? "active" : null)}>
                        {index + 1 + ". " + item}
                      </li>
                    )
                  })}
                </ol>
              </div> 
            : null}
        </div>
        <div className="roll" onClick={this.scrollToHighlighted}>
          <h3 className="btn btn-primary"><i className="material-icons" onClick={this.reroll}>replay</i>{this.state.keys || this.state.highlighted}</h3>
        </div>
      </div>
    );
  }
}

export default App;
