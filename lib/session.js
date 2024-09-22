const fs = require("fs"); // Import the file system module
const path = require("path"); // Import the path module

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
			const outputPath = path.join(__dirname, "../session/creds.json");
			fs.writeFileSync(outputPath, JSON.stringify(naxor, null, 2));
		}
	} catch (err) {
		console.error(err.message);
		await cleanup();
	}
}
module.exports = { connect };
