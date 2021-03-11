module.exports = {
    name: 'streamraiders_start_battle',
    run: (data, touchPortalClient, streamRaidersClient, streamRaidersServer ) => {
        const message = `startbattle|${data.streamraiders_sb_start_early}|${data.streamraiders_sb_distribute_rewards}|${data.streamraiders_sb_spell_placement_skip}`;
        streamRaidersClient.sendMessage(message);
    },
    updateState: (data,states,setState) => { 

    },
    states: {
       streamraiders_battle_state: { value: null, updated: false }
    }
}