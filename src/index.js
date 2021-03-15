const TP = require('touchportal-api');
const fs = require('fs');
const path = require('path');
const ProcessWatcher = require(path.join(__dirname,"/process_watcher"));
const platform = require('process').platform;
const SRApiClient = require(path.join(__dirname,"/streamraiders-api-client"));
const SRApiServer = require(path.join(__dirname,"/streamraiders-api-server"));

let streamRaidersRunning = false;

const app_monitor = {
  "darwin": "com.streamcaptain.streamraiders",
  "win32": "StreamRaiders.exe"
};

const pluginId = "Touch Portal Stream Raiders";

const battleStates =  {
    empty: 0,
    waitingForNewRaid: 1,
    unitOnCooldown: 2,
    unitAvailable: 3,
    placementPeriod: 4,
    placementPeriodEnding: 5,
    waitingForCaptainToStart: 6,
    battleStarted: 7,
    battleRewards: 8,
    battleEnded: 9,
    unknown: 10
}
const battleStateArray = [
    'Empty',
    'Waiting for New Raid',
    'Unit On Cooldown',
    'Unit Available',
    'Unit Placement Period',
    'Unit Placement Ending',
    'Waiting for Captain to Start',
    'Battle Started',
    'Battle Rewards',
    'Battle Ended',
    'UNKNOWN'
];

const settings = { };

let states = {
    streamraiders_connected : { value: false, updated: false },
    streamraiders_userid : { value: undefined, updated: false },
    streamraiders_gameserver : { value: undefined, updated: false },
    streamraiders_battle_timer_minutes : { value: '00', updated: false },
    streamraiders_battle_timer_seconds : { value: '00', updated: false },
    streamraiders_battle_timer_image: { value:'', updated: false },
    streamraiders_placement_timeleft : { value: undefined, updated: false },
    streamraiders_unit_count : { value:'0', updated:false }
};

let actions = new Map();

const TPClient = new TP.Client();
const SRClient = new SRApiClient();
const SRServer = new SRApiServer({states});
const procWatcher = new ProcessWatcher();

// Load Actions here
const files = fs.readdirSync(path.join(__dirname,"/actions/"));
const jsFiles = files.filter(f => f.split(".").pop() === 'js' );
if( jsFiles.length <= 0 ) {
  logIt("WARNING", "No action files found");
}
else {
  jsFiles.forEach((jsFile) => {
    const action = require(path.join(__dirname,'/actions/')+jsFile);
    actions.set(action.name,action);
    if( action.states !== undefined ) {
        states = {...states, ...action['states']};
    }
  });
}

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

// Stream Raiders
let battleTimerLoop = null;
SRServer.on("response",(data) => {
  // { raidState: 1, timeLeft: 0, placementCount: 1 } 
  //   battleState    time,       unitsCount
  setState('streamraiders_placement_timeleft',data.timeLeft);
  setState('streamraiders_unit_count',data.placementCount);
  setState('streamraiders_battle_state',battleStateArray[data.raidState]);

  // { raidState: 4, timeLeft: 1800, placementCount: 0 } 
  if( data.raidState != battleStates.placementPeriod ){
      resetTimer();
  }
  if( parseInt(data.timeLeft) > 0 && battleTimerLoop == null ) {
      logIt("INFO", "Start Battle Counter");
      // build battle timer to loop every second based off 
      let timerLoop = 1000;
      battleTimerLoop = setInterval(function() {
        if( data.raidState != battleStates.placementPeriod) {
           resetTimer();
           return;
        }
        let timeLeft = states.streamraiders_placement_timeleft.value;
        setState('streamraiders_placement_timeleft',timeLeft - timerLoop / 1000);
        calcTimer();
      }, timerLoop);
  }
  else if( ( parseInt(data.timeLeft) <= 0 || data.raidState !== battleStates.placementPeriod )&& battleTimerLoop !== null) {
      logIt("INFO", "Stop Battle counteR");
      resetTimer();
  }

  updateTouchPortalStates();
});

calcTimer = () => {
   let timeLeft = states.streamraiders_placement_timeleft.value;
   let minutes = Math.floor(timeLeft / 60);
   let seconds = Math.floor(timeLeft - minutes * 60);
   setState('streamraiders_battle_timer_seconds',String(seconds).padStart(2,"0"));
   setState('streamraiders_battle_timer_minutes',String(minutes).padStart(2,"0"));
   updateTouchPortalStates();
};

resetTimer = () => {
   clearInterval(battleTimerLoop)
   battleTimerLoop = null;
   setState('streamraiders_battle_timer_seconds','00');
   setState('streamraiders_battle_timer_minutes','00');
};

SRServer.on("error",(data) => {
    logIt("ERROR",data);
    SRServer.disconnect();
    setTimeout(function() {
        SRServer.connect();
    },1000);
});

SRClient.on("connected", () => {
    setState('streamraiders_connected',true);
});
SRClient.on("message", (message) => {
    const pieces = message.split("|");
    if( pieces[0] == 'switchaccounts' ) {
        actions.get('streamraiders_switch_accounts').updateState(pieces,states,setState);
    }
    else if( pieces[0] == 'getinfo' ) {
        setState('streamraiders_userid', pieces[1]);
        setState('streamraiders_gameserver', pieces[2]);
        setTimeout(function() {
          SRServer.connect();
        },1000);
    }
    else if( pieces[0] == 'getstate' ) {
        //getstate|Captain|0.5|False|0.5|False|
        //type|account type|music level %|Music Mute|SFX Level %|SFX Mute
        actions.get('streamraiders_switch_accounts').updateState(['switchaccount',pieces[1]],states,setState);
        actions.get('streamraiders_volume').updateState(['setmusic',pieces[2],pieces[3]],states,setState);
        actions.get('streamraiders_audio_toggle').updateState(['setmusic',pieces[2],pieces[3]],states,setState);
        actions.get('streamraiders_volume').updateState(['setsfx',pieces[4],pieces[5]],states,setState);
        actions.get('streamraiders_audio_toggle').updateState(['setsfx',pieces[4],pieces[5]],states,setState);
    }
    else if( pieces[0] === 'setmusic' || pieces[0] === 'setsfx' ) {
        actions.get('streamraiders_volume').updateState(pieces,states,setState);
        actions.get('streamraiders_audio_toggle').updateState(pieces,states,setState);
    }
    else if( pieces[0] === 'startbattle' ) {
        //"startbattle|success"
        logIt("INFO",'startbattle message:',message);

    }

    updateTouchPortalStates();
});
SRClient.on("error", (message) => {
    logIt('ERROR',JSON.stringify(message));
    setState('streamraiders_connected',false);
    SRServer.disconnect();
});
SRClient.on("close", () => {
    if( runningConnection ) {
        return;
    }
    logIt('INFO',"Stream Raiders socket closing");
    setState('streamraiders_connected',false);
    SRServer.disconnect();
    setTimeout(function() {
        logIt('WARN', "Attempting Reconnect to Stream Raiders");
        SRClient.connect();
    }, 2000);
});
// End Stream Raiders

// Process Watcher
procWatcher.on('processRunning', (processName) => {
    runningConnection = true;
    streamRaidersRunning = true;
    // Lets shutdown the connection so we can re-establish it
    SRServer.disconnect();
    SRClient.disconnect();
    setTimeout(function() {
        logIt('INFO', "Stream Raiders is running, attempting to Connect");
        SRClient.connect();
        runningConnection = false;
    }, 5000);
});
procWatcher.on('processTerminated', (processName) => {
    logIt('WARN',`${processName} not detected as running`);
    if( !streamRaidersRunning ) {
        // We already did this once, don't need to keep repeating it
        return;
    }
    logIt('WARN',`Terminating active connections to Stream Raiders`);
    streamRaidersRunning = false;
    SRServer.disconnect();
    SRClient.disconnect();
    setState('streamraiders_connected',false);
    updateTouchPortalStates();
});
// End Process Watcher

// Touch Portal Client Setup
TPClient.on("Settings", (data) => {
  if( data ) {
    data.forEach( (setting) => {
      let key = Object.keys(setting)[0];
      settings[key] = setting[key];
    });
  }
});

TPClient.on("Info", (data) => {
    //TP Is connected now
    //Start Process Watcher for this platform
    logIt('INFO',`Starting process watcher for ${app_monitor[platform]}`);
    procWatcher.watch(app_monitor[platform]);
});

TPClient.on("Action", (message) => {
    const action = message.actionId;
    if( actions.has(action) ) {
        logIt("INFO",`calling action ${action}`);
        let data = {};
        message.data.forEach((elm) => {
            data[elm.id] = elm.value;
        });
        actions.get(action).run(data,TPClient,SRClient,SRServer);
    }
    else {
        logIt("ERROR",`Unknown action called ${action}`);
    }
});

function logIt() {
    var curTime = new Date().toISOString();
    var message = [...arguments];
    var type = message.shift();
    console.log(curTime,":",pluginId,":"+type+":",message.join(" "));
}

TPClient.connect({pluginId})
// End Touch Portal Client Settings
