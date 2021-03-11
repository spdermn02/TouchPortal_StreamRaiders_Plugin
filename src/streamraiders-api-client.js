"use strict";

const WebSocketClient = require("websocket").client;
const EventEmitter = require("events");
const btoa = require("btoa");
const atob = require("atob");
const SOCKET_IP = '127.0.0.1';
const SOCKET_PORT = 10042;

const LOOP_INTERVAL = 10000;

class StreamRaidersClient extends EventEmitter {
    constructor(options = {}) {
        super();
        this.websocket = null;
        this.connection = null;
        this.loop = null;
    }
    connect(options = {}) {
        let that = this;
        this.websocket = new WebSocketClient();
        this.websocket.on("connect",(connection) => {
          that.connection = connection;
          that.emit("connected");
          that.connection.on('close',() => {
            that.emit("close");
            if( that.loop !== null ) { clearInterval(that.loop);}
            that.loop = null;
          });
          that.connection.on('error',(message) => {
            that.emit("error",message);
            if( that.loop !== null ) { clearInterval(that.loop);}
            that.loop = null;
          });
          that.connection.on('message',(message) => {
            if( message.type == 'utf8' ) {
                that.emit("message",atob(message.utf8Data));
            }
          });

          that.sendMessage("getinfo");
          that.loopGetState();
        });
        this.websocket.connect(`ws://${SOCKET_IP}:${SOCKET_PORT}`);
    }
    sendMessage( message ) {
      this.connection.sendUTF(btoa(message));
    }
    loopGetState() {
      let that = this;
      this.loop = setInterval(function() { 
        that.getState();
      }, LOOP_INTERVAL);
      this.getState();
    }
    getState() {
      this.sendMessage('getstate');
    }
}

module.exports = StreamRaidersClient;