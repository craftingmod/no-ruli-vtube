// ==UserScript==
// @name        Mobile Writer Rollback
// @name:ko     모바일 에디터 위치 롤백
// @encoding    utf-8
// @license     The Unlicense

// @version     2023.09.11.01

// @include      /^https?://m\.ruliweb\.com/community/board/\d+/write$/

// @description Same as title
// @description:ko 제곧네

// @grant       none
// @run-at      document-start
// ==/UserScript==

function main() {
  const app = document.getElementsByClassName("App")[0]

  const seditor = document.getElementsByClassName("seditor")[0]
  const noteEditor = document.getElementsByClassName("note-editor")[0]
  const noteToolbar = document.getElementsByClassName("note-toolbar")[0]
  noteEditor.removeChild(noteToolbar)
  seditor.insertBefore(noteToolbar, seditor.firstChild)

  const noteStatusbar = document.getElementsByClassName("note-statusbar")[0]
  // noteEditor.removeChild(noteStatusbar)

  const iconWrapper = document.getElementsByClassName("common_write_wrapper")[0]
  
  app.removeChild(iconWrapper)
  app.insertBefore(iconWrapper, app.firstChild)
}

window.addEventListener("load", () => main(), {once: true})
