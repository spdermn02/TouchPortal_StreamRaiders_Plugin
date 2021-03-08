const TP = require("touchportal-api");
const SRApiClient = require("./streamraiders-api-client");
const SRApiServer = require("./streamraiders-api-client");

const app_monitor = {
  "darwin": "com.streamcaptain.streamraiders",
  "win32": "StreamRaiders.exe"
};

const pluginId = "Touch Portal Stream Raiders";
const TPClient = new TP.Client();
const SRClient = new SRApiClient();
const SRServer = new SRApiServer();

const settings = {
    'Battle Timer Type': 'Minutes Only', //Seconds Only, Minutes and Seconds
};

const states = {
    streamraiders_connected : { value: false, updated: false },
    streamraiders_userid : { value: undefined, updated: false },
    streamraiders_gameserver : { value: undefined, updated: false },
    streamraiders_account_type : { value:'Captain', updated: false }, //Viewer
    streamraiders_battle_timer : { value:'0', updated: false },
    streamraiders_battle_timer_image: { value:'', updated: false },
    streamraiders_unit_count : { value:'0', updated:false },
    streamraiders_music_audio_status: { value:'On', updated: false }, // Off
    streamraiders_sfx_audio_status: { value:'On', updated: false }, //Off
    streamraiders_music_audio_volume: { value:'0', updated: false }, // 0 - 100
    streamraiders_sfx_audio_volume: { value:'0', updated: false } //0 - 100
};

const updateTouchPortalStates = () => {
    let statesToUpdate = [];
    for( const state in states ) {
        if( states[state].updated ) {
            statesToUpdate.push({ id: state, value: states[state].value });
            states[state].updated = false;
        }
    }

    if( statesToUpdate.length > 0 ) {
      TPClient.stateUpdateMany( statesToUpdate );
    }
}

const setState = (state, value ) => {
    if( states[state] ) {
        if( states[state].value != value ) {
            states[state].value = value;
            states[state].updated = true;
        }
    }
    else {
        logIt("ERROR", 'attempted setState for',state,'but it is not defined');
    }
}

SRClient.on("connected", () => {
    //Switch between Viewer and Captain
    //responds with "switchaccounts|type" as message
    // Type is "Viewer" or "Captain"
    //SRClient.switchAccounts();

    
});
SRClient.on("message", (message) => {
    logIt("DEBUG",JSON.stringify(message));
    const pieces = message.split("|");
    if( pieces[0] == 'switchaccounts' ) {
        setState('streamraiders_account_type', pieces[1]);
    }
    else if( pieces[0] == 'getinfo' ) {
        setState('streamraiders_userid', pieces[1]);
        setState('streamraiders_gameserver', pieces[2]);
    }
    else if( pieces[0] == 'getstate' ) {
        //getstate|Captain|0.5|False|0.5|False|
        //type|account type|music level %|Music Mute|SFX Level %|SFX Mute
        setState('streamraiders_account_type', pieces[1]);
        setState('streamraiders_music_volume', pieces[1]);
        setState('streamraiders_account_type', pieces[1]);
        setState('streamraiders_account_type', pieces[1]);
        setState('streamraiders_account_type', pieces[1]);
    }

    updateTouchPortalStates();
});
SRClient.on("error", (message) => {
    logIt('ERROR',JSON.stringify(message));
});
SRClient.on("close", () => {
    logIt('INFO',"Stream Raiders socket closing");
});
SRClient.connect();

TPClient.on("Settings", (data) => {
  data.forEach( (setting) => {
    let key = Object.keys(setting)[0];
    settings[key] = setting[key];
    logIt("DEBUG","Settings: Setting received for |"+key+"|");
  });
});

TPClient.on("Info", (data) => {
    //okay now validate from monitor of app if it's running, else just sit and wait for monitor to emite running event
    logIt("DEBUG",JSON.stringify(data));

    //is Stream Raiders running
    //if not recheck ever so often and when it is fire the connection to the websocket
});

function logIt() {
    var curTime = new Date().toISOString();
    var message = [...arguments];
    var type = message.shift();
    console.log(curTime,":",pluginId,":"+type+":",message.join(" "));
}

TPClient.connect({pluginId})