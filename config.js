require("dotenv").config();

module.exports = {
	VERSION: require("./package.json").version,
	OWNER: process.env.OWNER || "Its You😂",
	DEEPAI_KEY: "7f831cb9-aa30-4270-bfa6-0a5d4d03afac",
	DL_API: "https://x-astral.apbiz.xyz/",
	//MONGODB_URL: process.env.MONGODB_URL || 'mongodb+srv://z:z@cluster0.sy21r5d.mongodb.net/?retryWrites=true&w=majority',
	PREFIX: process.env.PREFIX || "!",
	PACKNAME: process.env.PACKNAME || "Astrial❤️",
	AUTHOR_PACK: process.env.AUTHOR_PACK || "Naxor❤️",
	antilink: {},
	SESSION_ID: process.env.SESSION_ID || "Session~sQd5f0e5",
	MODE: process.env.MODE || "private", // public
	MODS: process.env.MODS ? JSON.parse(process.env.MODS) : ["27686881509@s.whatsapp.net"],
};
