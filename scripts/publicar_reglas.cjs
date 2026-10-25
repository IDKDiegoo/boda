const { GoogleAuth } = require("/Users/idk/ARAINv3/node_modules/google-auth-library");
const fs = require("fs");
(async () => {
  const c = await new GoogleAuth({ keyFile:"/Users/idk/ARAINv3/bot/firebase-service-account.json", scopes:["https://www.googleapis.com/auth/cloud-platform"] }).getClient();
  const P = "projects/arain-database", R = "https://firebaserules.googleapis.com/v1";
  for (const [archivo, release] of [["firestore.rules", "cloud.firestore"], ["storage.rules", "firebase.storage/arain-database.firebasestorage.app"]]) {
    const rs = (await c.request({ method:"POST", url:`${R}/${P}/rulesets`, data:{ source:{ files:[{ name:archivo, content:fs.readFileSync("/Users/idk/ARAINv3/"+archivo,"utf8") }] } } })).data;
    await c.request({ method:"PATCH", url:`${R}/${P}/releases/${release}`, data:{ release:{ name:`${P}/releases/${release}`, rulesetName:rs.name } } });
    console.log("publicado", release, rs.name);
  }
})().catch(e => console.error("ERR", e.response?.status, JSON.stringify(e.response?.data||e.message).slice(0,500)));
