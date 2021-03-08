"use strict";

const request = require('request');

const LOOP_INTERVAL = 10000;

class StreamRaidersServer extends EventEmitter {
    constructor(options = {states}) {
        super();
        this.states = states;
        this.connection = null;
    }

    getState() {
        if( !this.states.streamraiders_connected.value || !this.states.streamraiders_userid.value || !this.states.streamraiders_gameserver.value ) {

            return false;
        }
        const url = `${this.states.streamraiders_gameserver.value}?/cn=getInfoForDeck`;
        request.post(url,{},(err,res,body) => {

        });

    }
}

module.exports = StreamRaidersServer;