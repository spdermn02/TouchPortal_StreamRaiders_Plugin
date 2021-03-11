module.exports = {
  name: 'streamraiders_switch_accounts',
  run: (data, touchPortalClient, streamRaidersClient, streamRaidersServer ) => {
    const message = `switchaccounts`;
    streamRaidersClient.sendMessage(message);
  },
  updateState : (pieces,states,setState) => {
    setState('streamraiders_account_type', pieces[1]);
  },
  states: {
    streamraiders_account_type : { value:'Captain', updated: false }, //Viewer
  }
}