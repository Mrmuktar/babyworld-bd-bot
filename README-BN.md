# Baby World BD Premium WhatsApp Order Desk

**Single-admin bot:** আপনার নির্দিষ্ট WhatsApp নম্বরই menu এবং order management ব্যবহার করতে পারবে। এটি Baileys (WhatsApp Web connection) ভিত্তিক unofficial integration; Meta Cloud API নয়।

## ফিচার
- QR pairing, admin-number restriction
- নতুন অর্ডার: নাম, ফোন, ঠিকানা, পণ্য, মোট মূল্য, COD
- All / Pending / Confirmed / Delivered / Cancelled / Return list
- ID/phone/name search
- status update: `1001 confirm` বা `1001 delivered`
- Daily/monthly report
- Persistent JSON storage
- Render health endpoint

## Render-এ deploy (মোবাইল থেকেও)

1. ZIP extract করুন। GitHub-এ একটি নতুন repository বানিয়ে **সব ফাইল ও src folder** আপলোড করুন।
2. Render.com-এ login → **New** → **Web Service** → GitHub repo connect করুন।
3. Build Command: `npm install`; Start Command: `npm start`.
4. Environment Variables যোগ করুন:
   - `ADMIN_NUMBER` = আপনার WhatsApp নম্বর country code সহ, শুধু digit (যেমন `8801XXXXXXXXX`)
   - `DATA_DIR` = `/data`
   - `PORT` = `10000` (Render সাধারণত নিজে PORT সেট করে; কোড PORT পড়ে)
5. Render-এর Web Service → **Disks** → Add Disk:
   - Mount Path: `/data`
   - Size: 1 GB (Render plan অনুযায়ী disk/hosting খরচ হতে পারে)
6. Deploy করুন। Build/deploy logs খুলে QR দেখুন। Render logs-এ QR থাকলে স্ক্রিনে দেখানো QR scan করা সবসময় সম্ভব নাও হতে পারে; Render logs QR display support না করলে pairing-এর জন্য logs থেকে QR output বা dedicated pairing UI দরকার হবে। এই build terminal QR print করে, তাই Render log rendering এ QR ঠিকমতো দেখা যাবে কিনা যাচাই করুন।
7. WhatsApp ফোনে: **Linked devices → Link a device** → Render logs-এর QR scan করুন।
8. Admin number থেকে bot-এ `menu` লিখুন।

## Menu
1 নতুন order; 2 All orders; 3 Pending; 4 Confirmed; 5 Delivered; 6 Cancelled; 7 Return; 8 Search; 9 Update; 10 Daily report; 11 Monthly report; 12 Backup note.

## Status update examples
- `1001 confirm`
- `1001 booked`
- `1001 delivered`
- `1001 cancel`
- `1001 return`

## সতর্কতা
- Baileys unofficial. WhatsApp-এর শর্ত/নীতির সাথে সামঞ্জস্য নিশ্চিত করুন; account restriction হতে পারে। ব্যবহার নিজ দায়িত্বে।
- QR/session ধরে রাখতে Render Persistent Disk আবশ্যক। Render-এর free tier-এ persistent disk/service availability বা billing পরিবর্তিত হতে পারে; deploy-এর আগে Render pricing/plan দেখে নিন।
- Steadfast courier auto-booking এখন সংযুক্ত নয়। API credentials ও API integration ছাড়া booking/parcel tracking করা হচ্ছে না।
- এটি order data সংরক্ষণ করে কিন্তু admin flow-এর কোনো input validation/production hardening পূর্ণাঙ্গ নয়; গুরুত্বপূর্ণ order-এর backup রাখুন।
- QR pairing পেজ `/pair`; QR `/qr` endpoint থেকে দেখায়।
