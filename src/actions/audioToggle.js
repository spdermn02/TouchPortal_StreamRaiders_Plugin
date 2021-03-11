module.exports = {
    name: 'streamraiders_audio_toggle',
    run: (data, touchPortalClient, streamRaidersClient, streamRaidersServer ) => {
        console.log(JSON.stringify(data));
      let message = null;
      switch(data.streamraiders_toggle_type) {
          case "Music":
              message = "setmusic|mute";
              break;
          case "SFX":
              message = "setsfx|mute";
              break;
      }

      if( message != null ) {
          streamRaidersClient.sendMessage(message);
      }
    },
    updateState: (pieces, states, setState ) => {
      const state = ( pieces[0] === 'setmusic' ) ? 'streamraiders_music_audio_status' : 'streamraiders_sfx_audio_status';
      setState(state, ( pieces[2] === 'True' ) ? "Off" : "On" );
    },
    states: {
        streamraiders_music_audio_status : { value : null, updated: false},
        streamraiders_sfx_audio_status : { value : null, updated: false}
    }
}