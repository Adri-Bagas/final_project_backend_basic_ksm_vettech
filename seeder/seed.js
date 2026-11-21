import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Series } from "../models/Series.js";
import { Tag } from "../models/Tag.js";
import { Waifu } from "../models/Waifu.js";

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    await Promise.all([
      User.deleteMany({}),
      Series.deleteMany({}),
      Tag.deleteMany({}),
      Waifu.deleteMany({}),
    ]);

    const password = await bcrypt.hash("password123", 10);

    const [kintoki, ainz] = await User.create([
      {
        username: "sakata_gintoki",
        email: "sakata@yorozuya.jp",
        password,
        slug: "sakata-kintoki",
      },
      {
        username: "Momonga",
        email: "saturosuzuki@yahoo.co.jp",
        password,
        slug: "momonga",
      },
    ]);

    const [fsn, fgo, fz, extra] = await Series.create([
      { title: "Fate/stay night", slug: "fatestaynight", type: "game" },
      { title: "Fate/Grand Order", slug: "fategrandorder", type: "game" },
      { title: "Fate/Zero", slug: "fatezero", type: "anime" },
      { title: "Fate/EXTRA", slug: "fateextra", type: "game" },
    ]);

    const tagDefs = [
      { slug: "tsundere", label: "Tsundere", aliases: ["tsundere", "tsun"] },
      { slug: "twintail", label: "Twintail", aliases: ["twintail", "twintails"] },
      { slug: "saberface", label: "Saberface", aliases: ["saberface", "saber"] },
      { slug: "king", label: "King", aliases: ["king", "royalty"] },
      { slug: "kuudere", label: "Kuudere", aliases: ["kuudere"] },
      { slug: "kouhai", label: "Kouhai", aliases: ["kouhai"] },
      { slug: "umu", label: "Umu", aliases: ["umu", "emperor"] },
      { slug: "whitehair", label: "White Hair", aliases: ["whitehair", "silverhair"] },
    ];
    await Tag.insertMany(tagDefs);

    const Waifus = await Waifu.create([
      {
        name: "Artoria Pendragon",
        series_id: fsn._id,
        series: fsn.title,
        tags: ["saberface", "king"],
        media: [
          { url: "/images/artoria.webp", type: "image" },
          { url: "/videos/artoria-excalibur.mp4", type: "video" },
        ],
        claims_count: 0,
        created_by: kintoki._id,
      },
      {
        name: "Rin Tohsaka",
        series_id: fsn._id,
        series: fsn.title,
        tags: ["tsundere", "twintail"],
        media: [
          { url: "/images/rin.webp", type: "image" },
          { url: "/images/rin-defenseless.webp", type: "image" },
          { url: "/videos/rin-gandr.mp4", type: "video" },
        ],
        claims_count: 0,
        created_by: kintoki._id,
      },
      {
        name: "Sakura Matou",
        series_id: fsn._id,
        series: fsn.title,
        tags: ["kouhai"],
        media: [{ url: "/images/sakura.webp", type: "image" }],
        claims_count: 0,
        created_by: kintoki._id,
      },
      {
        name: "Archer (EMIYA)",
        series_id: fsn._id,
        series: fsn.title,
        tags: ["whitehair"],
        media: [
          { url: "/images/emiya.webp", type: "image" },
          { url: "/videos/emiya-ubw.mp4", type: "video" },
        ],
        claims_count: 0,
        created_by: ainz._id,
      },
      {
        name: "Mash Kyrielight",
        series_id: fgo._id,
        series: fgo.title,
        tags: ["kouhai"],
        media: [
          { url: "/images/mash.webp", type: "image" },
          { url: "/videos/mash-lord-camelot.mp4", type: "video" },
        ],
        claims_count: 0,
        created_by: kintoki._id,
      },
      {
        name: "Jeanne d'Arc (Alter)",
        series_id: fgo._id,
        series: fgo.title,
        tags: ["tsundere", "saberface", "whitehair"],
        media: [
          { url: "/images/jalter.webp", type: "image" },
          { url: "/videos/jalter-np.mp4", type: "video" },
        ],
        claims_count: 0,
        created_by: ainz._id,
      },
      {
        name: "Morgan le Fay",
        series_id: fgo._id,
        series: fgo.title,
        tags: ["saberface", "king", "kuudere", "whitehair"],
        media: [
          { url: "/images/morgan.webp", type: "image" },
          { url: "/images/morgan-winter-queen.webp", type: "image" },
        ],
        claims_count: 0,
        created_by: ainz._id,
      },
      {
        name: "Gilgamesh",
        series_id: fz._id,
        series: fz.title,
        tags: ["king"],
        media: [
          { url: "/images/gilgamesh.webp", type: "image" },
          { url: "/videos/gilgamesh-ea.mp4", type: "video" },
        ],
        claims_count: 0,
        created_by: ainz._id,
      },
      {
        name: "Nero Claudius",
        series_id: extra._id,
        series: extra.title,
        tags: ["saberface", "king", "umu"],
        media: [
          { url: "/images/nero.webp", type: "image" },
          { url: "/videos/nero-umu.mp4", type: "video" },
        ],
        claims_count: 0,
        created_by: kintoki._id,
      },
      {
        name: "Tamamo-no-Mae",
        series_id: extra._id,
        series: extra.title,
        tags: [],
        media: [{ url: "/images/tamamo.webp", type: "image" }],
        claims_count: 0,
        created_by: ainz._id,
      },
    ]);

    const byName = Object.fromEntries(Waifus.map((c) => [c.name, c]));

    const counts = {};
    for (const c of Waifus) {
      for (const slug of c.tags) {
        counts[slug] = (counts[slug] || 0) + 1;
      }
    }
    await Promise.all(
      Object.entries(counts).map(([slug, count]) =>
        Tag.updateOne({ slug }, { $set: { usage_count: count } })
      )
    );

    const toListItem = (char, note) => ({
      waifu_id: char._id,
      note,
    });

    kintoki.list = [
      toListItem(byName["Artoria Pendragon"], "Saber best girl"),
      toListItem(byName["Rin Tohsaka"], "yes indeed, i am a masochist"),
      toListItem(byName["Mash Kyrielight"], "Best kouhai"),
      toListItem(byName["Nero Claudius"], "Umu!"),
    ];
    await kintoki.save();

    ainz.list = [
      toListItem(byName["Archer (EMIYA)"], `
      ꧁༒☬ 𝕴 𝖆𝖒 𝖙𝖍𝖊 𝖇𝖔𝖓𝖊 𝖔𝖋 𝖒𝖞 𝖘𝖜𝖔𝖗𝖉 ☬༒꧂
      ✦・┈・┈・┈・†・┈・┈・┈・✦
      𝔖𝔱𝔢𝔢𝔩 𝔦𝔰 𝔪𝔶 𝔟𝔬𝔡𝔶, 𝔞𝔫𝔡 𝔣𝔦𝔯𝔢 𝔦𝔰 𝔪𝔶 𝔟𝔩𝔬𝔬𝔡... 🔥🩸
      𝕴 𝖍𝖆𝖛𝖊 𝖈𝖗𝖊𝖆𝖙𝖊𝖉 𝖔𝖛𝖊𝖗 𝖆 𝖙𝖍𝖔𝖚𝖘𝖆𝖓𝖉 𝖇𝖑𝖆𝖉𝖊𝖘 ⚔️✨
      𝔘𝔫𝔨𝔫𝔬𝔴𝔫 𝔱𝔬 𝔇𝔢𝔞𝔱𝔥, 𝔫𝔬𝔯 𝔨𝔫𝔬𝔴𝔫 𝔱𝔬 𝔏𝔦𝔣𝔢... ☠️🥀
      𝕳𝖆𝖛𝖊 𝖜𝖎𝖙𝖍𝖘𝖙𝖔𝖔𝖉 𝖕𝖆𝖎𝖓 𝖙𝖔 𝖈𝖗𝖊𝖆𝖙𝖊 𝖒𝖆𝖓𝖞 𝖜𝖊𝖆𝖕𝖔𝖓𝖘... ⛓️💔
      𝔜𝔢𝔱, 𝔱𝔥𝔬𝔰𝔢 𝔥𝔞𝔫𝔡𝔰 𝔴𝔦𝔩𝔩 𝔫𝔢𝔳𝔢𝔯 𝔥𝔬𝔩𝔡 𝔞𝔫𝔶𝔱𝔥𝔦𝔫𝔤. 🖐️🌑
      𝕾𝖔 𝖆𝖘 𝕴 𝖕𝖗𝖆𝖞—
      【 𝖀𝕹𝕷𝕴𝕸𝕴𝕿𝕰𝕯 𝕭𝕷𝕬𝕯𝕰 𝖂𝕺𝕽𝕶𝕾 】 🗡️⚡🌌`),
      toListItem(byName["Artoria Pendragon"], "Me Likey Vanilla Ice Cream"),
      toListItem(byName["Jeanne d'Arc (Alter)"], "Peak mommy with issues"),
    ];
    await ainz.save();

    const claimCounts = {};
    for (const user of [kintoki, ainz]) {
      for (const item of user.list) {
        const key = String(item.waifu_id);
        claimCounts[key] = (claimCounts[key] || 0) + 1;
      }
    }
    await Promise.all(
      Object.entries(claimCounts).map(([id, count]) =>
        Waifu.updateOne({ _id: id }, { $set: { claims_count: count } })
      )
    );

    console.log("Seed complete!");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
