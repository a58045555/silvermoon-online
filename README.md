# 銀月大陸 Online

原創類天堂 MMORPG。斜 45 度像素畫面、四職業（騎士、遊俠、法師、黑暗妖精）男女角色、即時多人。

## 功能

- 帳號註冊登入，角色存在伺服器，換手機也能玩
- 同地圖看到其他玩家、一起打怪；怪物、傷害、掉寶、經驗全部由伺服器決定
- 組隊（最多 8 人，經驗依等級分配，人多有加成）
- 玩家交易（裝備與金幣，雙方確認才成交）
- PK 與紅名：村莊是安全區；Lv.10 以上可開 PK；殺無辜者正義值 -1000 變紅名；紅名死亡可能掉裝；打怪可洗回正義值
- 聊天：地圖、全頻、隊伍、血盟、私訊（`/名字 訊息`）
- 血盟：Lv.10、5,000 金幣創立，盟主邀請、公告、盟頻
- 五張地圖：晨霧村、哭泣森林（Lv.1～10）、骸骨荒原（10～18）、熔岩洞窟（18～28）、霜狼雪原（28～38）、月之塔遺跡（38～50）
- 主線任務：第一部「新月之誓」11 章＋第二部「血月之預言」7 章；每日任務 3 個
- 公會試煉（副本）：找米亞報名，依等級進入 5 種地城之一；3 層＋最深處守護者，每層隨機事件（寶藏哥布林、祝福祭壇、寶箱／寶箱怪、精英怪群），限時 15 分鐘，每天 3 次獎勵，記錄最佳通關時間
- 野外隨機精英怪（會放紅圈招式、掉魔法以上裝備）與會逃跑的寶藏哥布林
- 轉職試煉（各職業導師）、冒險者公會委託、20 多個成就與可配戴稱號
- 裝備六階，最高階「月痕」系列只在月之塔遺跡掉落
- 世界事件「灰燼教團入侵」：每天 19:00～23:00 隨機一次，守住晨霧村治癒之泉 10 分鐘，依貢獻發獎勵
- 世界 Boss「卡爾薩殘火」：每週日 21:00，熔岩洞窟，血量 5 倍，血盟傷害排名
- 世界事件「月蝕之夜」：每週六 21:00～21:30（台灣時間）怪物加倍、經驗 ×2、稀有掉寶提高
- 每職業 3 個技能（Lv.1/5/10 解鎖）；五隻 Boss 各有紅圈預警招式、召喚、狂暴
- 寶物掉在地上、依稀有度發光柱；Boss 掉落職業傳說武器
- 轉職（Lv.30）：每職業二選一（聖騎士／狂戰士、神射手／風行者、大魔導士／月之祭司、影舞者／暗殺者），各加 2 個技能
- 傳送師露娜：付費傳送到各地圖入口與 Boss 附近
- 便利功能：一鍵販賣、物品鎖定、整理背包、一鍵換上更好的裝備
- 掛機設定：選擇要打的怪、活動範圍、喝水門檻、技能開關、撿取條件、沒水或背包滿時回村、回村自動補藥水
- 排行榜、在線玩家列表、Boss 擊殺全服公告、+8 以上衝裝公告

## 本機執行

```bash
npm install
npm start            # http://localhost:3000，資料存在 data/dev-db.json
```

設定 `DATABASE_URL` 就會改用 PostgreSQL（第一次啟動會自動建表）。

## 測試

```bash
node tools/test_world.js                   # 伺服器規則測試：PK、紅名、血盟、交易、衝裝
node tools/test_content.js                 # 技能、Boss 機制、地上掉寶、任務
node tools/bots.js ws://localhost:3000/ws 20 30   # 20 個機器人玩 30 秒
```

## 部署

需要一台 24 小時開著的 Node.js 伺服器（WebSocket 長連線）和一個 PostgreSQL 資料庫。

### 免費方案：Render + Neon（適合幾個人）

1. 到 [neon.tech](https://neon.tech) 用 GitHub 登入，建立一個專案，複製連線字串（`postgresql://...`）。
2. 到 [render.com](https://render.com) 用 GitHub 登入 → New → Web Service → 選這個 repo。
3. 設定：Build Command `npm install`，Start Command `npm start`，Instance Type 選 Free。
4. Environment 加上 `DATABASE_URL` = 剛剛的連線字串。
5. 部署完成後打開 Render 給的網址就能玩。

免費方案 15 分鐘沒人連線會休眠，第一個人上線要等 30～60 秒。

### 正式方案：Railway（約每月 5 美金起）

1. 到 [railway.com](https://railway.com) 用 GitHub 登入 → New Project → Deploy from GitHub repo → 選這個 repo。
2. 在同一個專案按 New → Database → PostgreSQL。
3. 到遊戲服務的 Variables 加上 `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`。
4. Settings → Networking → Generate Domain，就有公開網址。

## 結構

```
server/index.js   HTTP 靜態檔 + WebSocket、帳號登入
server/world.js   遊戲世界：地圖、怪物 AI、戰鬥、掉寶、組隊、交易、PK、血盟
server/db.js      PostgreSQL / 本機 JSON 存檔
shared/data.js    伺服器和瀏覽器共用的規則（職業、怪物、裝備、地圖產生）
client/*.js       前端原始碼，執行 python3 tools/build_client.py 產生 public/game.js
public/           網頁、圖片素材（PixelLab）
tools/            測試與建置工具
```
