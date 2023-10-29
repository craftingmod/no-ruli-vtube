import { keywordPath, loginRuli, ruli, iconSharePath } from "./constants.mjs"
import { load as loadio } from "cheerio"
import puppeteer from "puppeteer"
import fs from "node:fs/promises"

/**
 * 스티커 목록 받아오기
 * @param {string} token Token
 * @param {string | undefined} keyword Search Keyword 
 */
export async function queryStickers(token, keyword) {
  let page = 1
  
  const keywordExtras = {
    "search_type": "subject",
    "search_key": keyword,
  }
  /**
    * @type {Array<{id: number, name: string}>}
    */
  const stickers = []
  while (true) {
    let currentTime = Date.now()
    const extras = {
      "page": page.toString(),
    }
    /**
     * @type {Record<string, string>}
     */
    const params = (keyword == null) ? extras : {...keywordExtras, ...extras}
    const reqURL = `${iconSharePath}?${new URLSearchParams(params).toString()}`
    console.log(reqURL)
    const response = await fetch(reqURL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
        "Cookie": `s_token=${token};`,
      }
    })

    if (response.status !== 200) {
      throw new Error("Response is not 200!")
    }
    const respHTML = await response.text()

    /**
      * @type {Array<{id: number, name: string}>}
      */
    const currentPageStickers = []

    const $ = loadio(respHTML)
    const elements = $(".board_main > .board_list_table > tbody").children()
    for (const el of elements) {
      // 공지
      if ($(el).attr("class").indexOf("notice") >= 0) {
        continue
      }
      if ($(el).find(".empty_result").length >= 1) {
        break
      }
      const id = Number($(el).find(".id").text().trim())
      const name = $(el).find(".deco").text().trim()
      currentPageStickers.push({
        id,
        name,
      })
    }
    
    if (currentPageStickers.length <= 0) {
      break
    }
    stickers.push(...currentPageStickers)
    page += 1
    if (Date.now() - currentTime <= 200) {
      await sleep(200 - (Date.now() - currentTime))
    }
  }
  return stickers
}

/**
 * 스티커 목록 파싱하기
 * @param {string} token 토큰 
 * @param {number} stickerId 스티커 ID 
 */
export async function parseSticker(token, stickerId) {
  const reqURL = `${iconSharePath}/read/${stickerId}`
  const response = await fetch(reqURL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
      "Cookie": `s_token=${token};`,
    }
  })
  if (response.status !== 200) {
    throw new Error("Response is not 200!")
  }
  /**
   * @type {string[]}
   */
  const sources = []
  const respHTML = await response.text()
  const $ = loadio(respHTML)
  const elements = $("article").find("img")
  for (let i = 0; i < elements.length; i += 1) {
    const source = $(elements[i]).attr("src")
    if (source != null) {
      sources.push(source)
    }
  }
  const videoElements = $("article").find("video")
  for (let i = 0; i < videoElements.length; i += 1) {
    const source = $(videoElements[i]).attr("src")
    if (source != null && source.endsWith("?gif")) {
      sources.push(source.replace(".mp4?gif", ".gif"))
    }
  }
  return sources
}

/**
 * 토큰 얻기
 * @returns token
 */
export async function login() {
  const browser = await puppeteer.launch({
    headless: false,
  })
  const page = await browser.newPage()
  page.setJavaScriptEnabled(true)
  await page.setViewport({width: 1024, height: 1024})
  await page.goto(loginRuli)
  await page.waitForRequest(`${ruli}/`, {timeout: 1000 * 600})
  const cookie = (await page.cookies(ruli)).find((v) => v.name === "s_token")
  await browser.close()
  return cookie?.value
}

/**
 * Sleep ms
 * @param {number} ms milliseconds 
 */
export async function sleep(ms) {
  return new Promise((res, rej) => setTimeout(res, ms))
}

/**
 * 
 * @param {string} fileName 
 * @returns {Promise<string[]>}
 */
export async function readList(fileName) {
  return (await fs.readFile(`../list/${fileName}.txt`, {encoding: "utf8"})).split("\n").filter((v) => v.length > 0)
}