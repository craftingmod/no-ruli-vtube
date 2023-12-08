import fs from "node:fs/promises"
import { getCommentIconBlockFilter, getIconBlockFilter, getIconListBlockFilter, getKeywordBlockFilter, getKeywordHeadFilter, getKeywordTopBlockFilter, getTuberFilter, iconWhitePath, iconWordPath, keywordPath, loginRuli, ruli } from "./constants.mjs"
import { login, parseSticker, queryStickers, readList, sleep } from "./utils.mjs"
import puppeteer from "puppeteer"

/**
 * 차단할 설정
 */
const totalWord = await readList("totalword")
const banConfig = {
  keyword: [
    ...totalWord,
    ...await readList("keyword"),
  ],
  tuberword: [
    ...await readList("tuberword"),
  ],
  iconword: [
    ...totalWord,
    ...await readList("iconword"),
  ],
  headword: [
    ...await readList("headword"),
  ]
}


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

/**
 * 1. 키워드 차단
 */
for (const keyword of banConfig.keyword) {
  filterOutput += `! # [키워드 차단] ${keyword} 차단\n`
  filterOutput += `! ########\n`
  filterOutput += getKeywordBlockFilter(keyword)
  filterOutput += getKeywordTopBlockFilter(keyword)
  filterOutput += `\n`
}

/**
 * 2. 인방용 키워드 차단
 */
for (const keyword of banConfig.tuberword) {
  filterOutput += `! # [인방텝 키워드 차단] ${keyword} 차단\n`
  filterOutput += `! ########\n`
  filterOutput += getTuberFilter(keyword)
  filterOutput += `\n`
}

/**
 * 아이콘 차단
 */
for (const iconword of banConfig.iconword) {
  filterOutput += `! # [아이콘 차단] ${iconword} 차단\n`
  filterOutput += `! ########\n`

  filterOutput += `! ## ${iconword} 아이콘 목록 차단\n`
  filterOutput += getIconListBlockFilter(iconword)

  filterOutput += `! ## ${iconword} 아이콘 표시 차단\n`
  // 아이콘 목록 불러오기
  const stickers = await queryStickers(stoken, iconword)
  for (const sticker of stickers) {
    if (stickerHistory.has(sticker.id)) {
      filterOutput += `! ### ${sticker.id}는 이미 추가됨\n`
      continue
    }
    stickerHistory.add(sticker.id)
    filterOutput += `! ### ${sticker.id} : ${sticker.name} (키워드: ${iconword})\n`
    filterOutput += getCommentIconBlockFilter(sticker.id)
    filterOutput += getIconBlockFilter(sticker.id)
    // 이미지 블럭 (실험적)
    /*
    const images = await parseSticker(stoken, sticker.id)
    for (const image of images) {
      filterOutput += `|${image}\n`
    }
    */
  }
  filterOutput += `\n`
}

/**
 * 말머리 차단
 */
for (const headword of banConfig.headword) {
  filterOutput += `! # [말머리 차단] ${headword} 차단\n`
  filterOutput += `! ########\n`
  filterOutput += `! ## ${headword} 말머리 차단\n`
  filterOutput += getKeywordHeadFilter(headword)
  filterOutput += `\n`
}

// 최종 출력
await fs.writeFile("../aggressive.txt", filterOutput, {encoding: "utf8"})