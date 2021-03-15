"use strict";

const EventEmitter = require("events");
const axios = require('axios');
const qs = require('qs');

const LOOP_INTERVAL = 10000;
const PORT = 443;

class StreamRaidersServer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.states = options.states;
    this.connection = null;
    this.loop = null;
  }
  connect() {
    let that = this;
    this.loop = setInterval(function(){
      that.getState();
    },10000);
    this.getState();
  }
  disconnect(){
    clearInterval(this.loop);
    this.loop = null;
  }
  getState() {
    let that = this;
    if( !this.states.streamraiders_connected.value || !this.states.streamraiders_userid.value || !this.states.streamraiders_gameserver.value ) {
      return false;
    }
    const options = {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      method: 'POST',
      data: qs.stringify({ command: 'getInfoForDeck', userId: this.states.streamraiders_userid.value }),
      url: `${this.states.streamraiders_gameserver.value}?/cn=getInfoForDeck`, 
    };
    axios(options)
    .then(res => {
     //{ raidState: 1, timeLeft: 0, placementCount: 1 }
      that.emit('response',res.data);
    })
    .catch(error => {
      that.emit('error',error);
    });
  }
}

module.exports = StreamRaidersServer;