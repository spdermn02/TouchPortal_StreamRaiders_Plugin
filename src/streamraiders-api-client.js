"use strict";

const WebSocketClient = require("websocket").client;
const EventEmitter = require("events");
const btoa = require("btoa");
const atob = require("atob");
const SOCKET_IP = '127.0.0.1';
const SOCKET_PORT = 10042;

class StreamRaidersClient extends EventEmitter {
    constructor(options = {}) {
        super();
        console.log("We are here");
        this.websocket = new WebSocketClient();
        this.connection = null;
    }
    connect(options = {}) {
        let that = this;
        this.websocket.on("connect",(connection) => {
          that.connection = connection;
          that.emit("connected");
          that.connection.on('close',() => {
            that.emit("closed");
          });
          that.connection.on('error',(message) => {
            that.emit("error",message);
          });
          that.connection.on('message',(message) => {
            if( message.type == 'utf8' ) {
                that.emit("message",atob(message.utf8Data));
            }
          });
        });
        this.websocket.connect(`ws://${SOCKET_IP}:${SOCKET_PORT}`);
    }
    sendMessage( message ) {
      console.log("sending message ", message);
      this.connection.sendUTF(btoa(message));
      console.log("done message ", message);
    }
    switchAccounts() {
      this.sendMessage("switchaccounts");
    }
}

module.exports = StreamRaidersClient;