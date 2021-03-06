const TP = require("touchportal-api");
const SR = require("./streamraiders-api");

const pluginId = "Touch Portal Stream Raiders";
const TPClient = new TP.Client();
const SRClient = new SR.Client();


SRClient.on("connected", () => {
    console.log("woohoo");

    //Switch between Viewer and Captain
    //responds with "switchaccounts|type" as message
    // Type is "Viewer" or "Captain"
    SRClient.switchAccounts();

    
});
SRClient.on("message", (message) => {
    console.log(JSON.stringify(message));
});
SRClient.on("error", (message) => {
    console.log("error",JSON.stringify(message));
});
SRClient.on("close", () => {
    console.log("Closing");
});
SRClient.connect();

//TPClient.connect({pluginId})
