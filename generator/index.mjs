import fs from "node:fs/promises"
import { getCommentIconBlockFilter, getIconListBlockFilter, getKeywordBlockFilter, keywordPath, loginRuli, ruli } from "./constants.mjs"
import { login, parseSticker, queryStickers } from "./utils.mjs"
import puppeteer from "puppeteer"

/**
 * 밴 때릴 키워드들
 */
const banword = (await fs.readFile(keywordPath, {encoding: "utf8"})).split("\n").filter((v) => v.length > 0)

/**
 * 토큰 생성
 */
const stoken = await login()
if (stoken == null) {
  throw new Error("토큰 없음!")
}

/**
 * 필터 출력 생성
 */
let filterOutput = await fs.readFile("./basic.txt", {encoding: "utf8"})
const nowDate = new Date(Date.now())
// 버전
filterOutput += `! Version: ${nowDate.getFullYear()}${(nowDate.getMonth() + 1).toString().padStart(2, "0")}${nowDate.getDate().toString().padStart(2, "0")}_1\n`
filterOutput += `! Generated with script.\n\n`

/**
 * @type {Set<number>}
 */
const stickerHistory = new Set([])
for (const keyword of banword) {
  filterOutput += `\n\n! ########\n`
  filterOutput += `! ${keyword} 차단\n`
  filterOutput += `! ########\n`

  filterOutput += `! # ${keyword} 키워드 차단\n`
  filterOutput += getKeywordBlockFilter(keyword)

  filterOutput += `! # ${keyword} 아이콘 목록 차단\n`
  filterOutput += getIconListBlockFilter(keyword)

  filterOutput += `! # ${keyword} 아이콘 표시 차단\n`
  // 아이콘 목록 불러오기
  const stickers = await queryStickers(stoken, keyword)
  for (const sticker of stickers) {
    if (stickerHistory.has(sticker.id)) {
      filterOutput += `! ## ${sticker.id}는 이미 추가됨\n`
      continue
    }
    stickerHistory.add(sticker.id)
    filterOutput += `! ## ${sticker.id} : ${sticker.name} (키워드: ${keyword})\n`
    filterOutput += getCommentIconBlockFilter(sticker.id)
    // 이미지 블럭 (실험적)
    const images = await parseSticker(stoken, sticker.id)
    for (const image of images) {
      filterOutput += `|${image}\n`
    }
  }
  filterOutput += `! #### ${keyword} END ####\n`
}

// 최종 출력
await fs.writeFile("../aggressive.txt", filterOutput, {encoding: "utf8"})