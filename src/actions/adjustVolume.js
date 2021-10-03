module.exports = {
    name: 'streamraiders_volume',
    run: (data, touchPortalClient, streamRaidersClient, streamRaidersServer ) => {
        const type = data.streamraiders_volume_type === 'Music' ? 'setmusic' : 'setsfx';
        const dir = data.streamraiders_volume_control === 'Decrease' ? 'down' : 'up';
        const volume = (parseFloat(data.streamraiders_volume_value) / 100).toFixed(2);

        //setmusic|${dir}|${volume};
        streamRaidersClient.sendMessage(`${type}|${dir}|${volume}`);
    },
    updateState: (pieces,states,setState) => {
        const state = pieces[0] === 'setmusic' ? 'streamraiders_music_audio_volume' : 'streamraiders_sfx_audio_volume';
        const newVolume = (parseFloat(pieces[1]) * 100).toFixed(0);

        setState(state,newVolume);
    },
    states: {
        streamraiders_music_audio_volume: { value: 0, updated: false, connector: {id:'streamraiders_volume_connector', data:[{id: 'streamraiders_volume_type_connector', value: 'Music'} ]}},
        streamraiders_sfx_audio_volume: { value: 0, updated: false, connector: {id:'streamraiders_volume_connector', data:[{id:'streamraiders_volume_type_connector', value:'SFX'} ]}}
    }
}