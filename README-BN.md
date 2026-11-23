# Baby World BD Functional Order Desk — V6

এই সংস্করণে WhatsApp-এ Admin মেসেজের মাধ্যমে অপশন নম্বর পাঠিয়ে অর্ডার ব্যবস্থাপনার কাজ করা যায়। সাধারণ WhatsApp Web/Baileys-এ স্থায়ী Telegram-style button সব ফোনে নির্ভরযোগ্য নয়, তাই এই সংস্করণে মেনুর সংখ্যা/কমান্ড-ভিত্তিক ব্যবহার রাখা হয়েছে।

## GitHub-এ আপলোড
ZIP Extract করে `package.json`, `render.yaml`, `README-BN.md` এবং `src/index.js` repository root-এ রাখুন (`src/index.js` অবশ্যই src ফোল্ডারে)। ZIP নিজে repository-তে দেবেন না।

## Render Settings
- Build Command: `npm install`
- Start Command: `npm start`

## Environment Variables
- `ADMIN_NUMBER`: Admin WhatsApp নম্বর (880 দিয়ে, +/স্পেস ছাড়া)
- `DATA_DIR`: `/tmp/babyworld-bd-data` (Free পরীক্ষার জন্য; অস্থায়ী)
- `STEADFAST_API_KEY`: Merchant API Key
- `STEADFAST_SECRET_KEY`: Merchant Secret Key
- `STEADFAST_API_URL`: `https://portal.packzy.com/api/v1/create_order`
- `PORT`: ঐচ্ছিক; Render নিজে সরবরাহ করে

Save করে Manual Deploy → Deploy latest commit.

## QR Pairing
Render service URL-এর শেষে `/pair` খুলুন। QR দেখালে WhatsApp → Linked devices → Link a device থেকে scan করুন। `/health` ও `/qr-status` service status দেখায়।

## Admin Menu — WhatsApp থেকে `menu` পাঠান
1. **Add Order:** নাম → ফোন → ঠিকানা → পণ্য/পরিমাণ → মোট → COD; অর্ডার Pending হিসেবে তৈরি হবে।
2. **All Orders:** সব অর্ডার (সাম্প্রতিক ২৫টি)
3. **Pending:** Pending তালিকা
4. **Confirm:** Order ID দিয়ে confirm; confirmation forward-message তৈরি হবে
5. **Steadfast:** Order ID → booking review → `BOOK <ID>` দিয়ে নিশ্চিত; `cancel` দিয়ে বুকিং ধাপ বাতিল
6. **Search:** Order ID, ফোন বা নাম
7. **Edit:** Order ID → 1 নাম / 2 ফোন / 3 ঠিকানা / 4 পণ্য / 5 total / 6 COD / 7 note → নতুন মান
8. **Cancel:** Order ID → `CANCEL <ID>` লিখে নিশ্চিত
9. **Return:** Order ID → `RETURN <ID>` লিখে নিশ্চিত
10. **Report:** আজ ও চলতি মাসের রিপোর্ট
11. **COD হিসাব:** Delivered, Booked, Confirmed, Returned ও মোট COD যোগফল
12. **Backup:** JSON backup file WhatsApp-এ পাঠায়
13. **Activity Log:** সর্বশেষ ২৫টি কার্যক্রম
14. **Delivered:** Delivered তালিকা
15. **Cancelled:** Cancelled তালিকা
16. **Customer Message:** ধরন 1–5 → Order ID দিয়ে মেসেজ তৈরি
17. **Status Update:** যেমন `1001 delivered` লিখে Status পরিবর্তন

অর্ডার তৈরির পর ID ও status সংরক্ষণ হয়। প্রতিটি পরিবর্তন Activity Log-এ রেকর্ড হয়।

## Customer Message
Confirm বা Steadfast booking-এর সময় forward-message তৈরি হয়। এছাড়াও menu option 16 থেকে template type (1–5) ও Order ID দিয়ে আলাদা message তৈরি করা যায়।

## সীমাবদ্ধতা ও নিরাপত্তা
- Free Render-এর `/tmp` অস্থায়ী; restart/deploy হলে WhatsApp session ও order data হারাতে পারে।
- Baileys WhatsApp Web ভিত্তিক, Meta Official Cloud API নয়।
- Steadfast live booking পরীক্ষা করা হয়নি; প্রথমে সতর্কভাবে পরীক্ষা করুন।
- COD হিসাবটি order COD-এর যোগফল, Courier settlement/fees হিসাব নয়।
- Backup export আছে, তবে backup file restore/import এই সংস্করণে নেই।
- শুধুমাত্র `ADMIN_NUMBER`-এ allow করা নম্বর থেকেই bot command ব্যবহার করা যাবে।
