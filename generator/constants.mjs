export const keywordPath = "../list/keyword.txt"

export const ruli = "https://bbs.ruliweb.com"
export const loginRuli = "https://user.ruliweb.com/member/login"

export const iconSharePath = `${ruli}/community/board/98`

/**
 * 
 * @param {string} keyword 
 * @returns filter
 */
export function getKeywordBlockFilter(keyword) {
  return `bbs.ruliweb.com#?#.board_main > .board_list_table > tbody > tr:has(.deco:contains(${keyword}))\n` +
  `m.ruliweb.com#?#.board_main > .board_list_table > tbody > tr:has(.deco:contains(${keyword}))\n`
}
/**
 * 
 * @param {string} keyword 
 */
export function getIconListBlockFilter(keyword) {
  return `bbs.ruliweb.com##.icon_data_show_target[title*='${keyword}']\n` +
  `m.ruliweb.com##.icon_data_show_target[title*='${keyword}']\n`
}

/**
 * 
 * @param {number | string} iconId 
 */
export function getCommentIconBlockFilter(iconId) {
  return `bbs.ruliweb.com#?#.comment > .text_wrapper > .inline_block:has(.comment_icon_page_link[href^="/community/board/98/read/${iconId}"])\n` +
  `m.ruliweb.com#?#.comment > .text_wrapper > .inline_block:has(.comment_icon_page_link[href^="/community/board/98/read/${iconId}"])\n`
}