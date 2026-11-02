# 高等地圖：待完成的怪物美術（暫停於 2026-11-03）

已完成並打包：yeti、barbarian、icewraith、frostgiant（frostwolf 用灰牙狼換色）。
gargoyle 若攻擊動作尚未全部完成，需重新執行 build_mob。

尚未完成（PixelLab character id → 還缺的動作）：
- gargoyle  c9c0e0a8-9e65-42f8-b884-94b1f8d129aa  attack 群組 09be5729-6688-404b-a90a-29ae6c0de39c（確認 north-east 完成後重新打包）
- moonknight a0d393bd-90ff-4e07-a243-7b181f139026 walk 群組 8911af41-60f5-4a0d-b69d-6885725e160b（確認 north 完成）；attack 5 方向
- specter    dd01d436-d638-4abe-9e94-26887ea30ab9  walk 5 方向、attack 5 方向
- arcgolem   505b9746-c912-4b75-95d3-4dda36127d92  walk 5 方向、attack 5 方向
- ashpriest  1316741c-5391-4310-970c-446f49b09324  walk 5 方向、attack 5 方向
- frostwitch 3568be7b-268d-43cd-89d8-57b16c773907  walk 群組 ef39ea3b-8ef5-4f79-b360-9d4a64406aae（確認全部完成）；attack 5 方向
- sage       e262b0f4-3694-44e7-a127-b4c17b3a838f  walk 5 方向、attack 5 方向

做法：walk 用 template walking-6-frames，方向 east/south-east/south/north/north-east（西側自動鏡像）；
attack 用 mode v3、frame_count 6、同樣 5 個方向。完成後執行
`python3 tools/build_mob.py <key> <character_id>` 再 `python3 tools/build_client.py`。
沒有美術的怪物會暫時用替代圖顯示，遊戲可以正常運作。
