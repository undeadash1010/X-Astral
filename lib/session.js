const { SESSION_ID } = require("../config.js");
const Pastebin = require("pastebin-js");

async function typhoon(str) {
	return Buffer.from(str, "base64").toString("utf-8");
}
async function cleanup() {}
async function connect(id = SESSION_ID, pastebinClient = new Pastebin("bR1GcMw175fegaIFV2PfignYVtF0b_Bl")) {
	try {
		const astral = id.replace(/Session~/gi, "").trim();
		if (astral.length <= 20) {
			let data;
			if (astral.startsWith("https://")) {
				const paste = await pastebinClient.getPaste(astral);
				data = paste.toString();
			} else {
				data = await typhoon(astral);
			}
			if (!data) {
				throw new Error("Invalid session ID");
			}
			const naxor = JSON.parse(data);
			console.log(naxor);
		}
	} catch (err) {
		console.error(err.message);
		await cleanup();
	}
}

module.exports = { connect };
