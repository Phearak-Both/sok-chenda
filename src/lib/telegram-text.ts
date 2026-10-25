/**
 * Wording of the Telegram bot and the price form that opens inside it. Both are for the shop
 * owner only and are in Khmer only. Bot messages use Telegram HTML: only <b> is used.
 */
export const telegramText = {
  hello: "សួស្ដី!",
  welcome: "ចុច <b>{button}</b> ខាងក្រោម ឬប៊ូតុង <b>{menu}</b> ក្បែរប្រអប់សារ ដើម្បីប្ដូរតម្លៃមាស។",
  notAllowed:
    "បូតនេះសម្រាប់ម្ចាស់ហាង សុខ ចិន្ដា។\nលេខសម្គាល់ Telegram របស់អ្នកគឺ <b>{id}</b>។ ដើម្បីប្រើបាន សូមបញ្ចូលលេខនេះក្នុង TELEGRAM_OWNER_IDS នៃការកំណត់គេហទំព័រ។",
  noForm: "ទម្រង់តម្លៃមិនទាន់ដំណើរការទេ៖ SITE_URL ក្នុងការកំណត់គេហទំព័រត្រូវជាអាសយដ្ឋាន https://។",
  updateButton: "💰 ប្ដូរតម្លៃមាស",
  menuButton: "💰 តម្លៃមាស",
  row: "<b>{metal}</b>៖ លក់ចេញ {sell} · ទិញចូល {buy}",
  published: "✅ បានផ្សព្វផ្សាយ។ គេហទំព័របង្ហាញ៖\n\n{rows}",
  form: {
    title: "តម្លៃមាស",
    perUnit: "ក្នុង {unit}",
    sell: "លក់ចេញ",
    buy: "ទិញចូល",
    publish: "ផ្សព្វផ្សាយ",
    publishing: "កំពុងផ្សព្វផ្សាយ…",
    published: "បានផ្សព្វផ្សាយ ✓",
    changed: "បានកែ {n}",
    undo: "មិនធ្វើវិញ",
    invalid: "សូមពិនិត្យតម្លៃដែលបានសម្គាល់៖ លេខប៉ុណ្ណោះ ឧ. 488 ឬ 307.5។",
    failed: "មិនអាចផ្សព្វផ្សាយបានទេ។ សូមព្យាយាមម្ដងទៀត។",
    notAllowed: "មានតែម្ចាស់ហាងប៉ុណ្ណោះដែលអាចប្ដូរតម្លៃនៅទីនេះ។ លេខសម្គាល់ Telegram របស់អ្នកគឺ {id}។",
    outsideTelegram: "សូមបើកទម្រង់នេះពីបូត សុខ ចិន្ដា ក្នុង Telegram។",
    // Shown when opened from the old button under the message box, which Telegram gives no sign-in.
    oldButton: "ប៊ូតុងនេះលែងប្រើបានហើយ។ សូមបិទទម្រង់នេះ ផ្ញើ /start ទៅបូត រួចចុច «💰 ប្ដូរតម្លៃមាស» ក្នុងសាររបស់បូត ឬប៊ូតុង «💰 តម្លៃមាស» ក្បែរប្រអប់សារ។",
    lastUpdated: "ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ {date}",
  },
};

export type PriceFormText = typeof telegramText.form;
