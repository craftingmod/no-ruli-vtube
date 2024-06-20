(() => {
  // fn define
  let running = false
  const removeBtn = document.querySelector("article button[autofocus='1']")
  const progressDOM = document.querySelector("output")
  const confirmMsg = "진짜로 작성 게시글&댓글이 모두 삭제됩니다. 진행하시겠습니까?\n되돌릴 수 없습니다!"
  const isMobile = location.href.indexOf("m.ruliweb.com") >= 0
  const isDebug = false

  const updateCurrent = (str) => {
    progressDOM.textContent = str
  }

  /**
   * Blob export
   * @param {Array<Record<string, unknown>>} objData Object Data
   * @param {string} filename Filename
   */
  const exportData = (objData, filename) => {
    if (objData.length <= 0) {
      return
    }
    let csvText = Object.keys(objData[0]).join(",")
    csvText += "\n"
    for (const obj of objData) {
      csvText += Object.values(obj).map((v) => {
        return String(v)
        .replace(/,/g, ".")
        .replace(/\s+/ig, " ")
      }).join(",")
      csvText += "\n"
    }
    // download
    const blob = new Blob([csvText], {type: "text/csv"})
    const tempElement = document.createElement("a")
    tempElement.href = URL.createObjectURL(blob)
    tempElement.download = `${filename}.csv`
    document.body.appendChild(tempElement)
    tempElement.click()
    document.body.removeChild(tempElement)
  }

  const sleep = async (time) => {
    return new Promise((res, rej) => {
      setTimeout(res, time)
    })
  }

  ///////////////////////////
  /**
   * 
   * @param {string} url URL
   * @returns Document object
   */
  const fetchToDOM = async (url) => {
    const content = await fetch(url)
    if (content.status !== 200) {
      throw new Error("Status is not 200! " + content.status)
    }
    const text = await content.text()
    const parser = new DOMParser()
    return parser.parseFromString(text, "text/html")
  }
  /**
   * 
   * @param {number} page Page number
   * @returns Articles
   */
  const parseArticles = async (page) => {
    const url = `https://${isMobile ? "m" : "bbs"}.ruliweb.com/member/mypage/myarticle?page=${page}`
    const dom = await fetchToDOM(url)
    // console.log(dom)
    const tbody = dom.querySelector("#myarticle > table > .table_body")
    /**
     * @type {Array<{boardName: string, boardId: string, articleAPIId: string, articleRealId: string, title: string}>}
     */
    let articles = []
    for (const el of tbody.children) {
      const boardName = el.querySelector(".board_name")
      const content = el.querySelector(".subject")
      
      const check = el.querySelector(".checkbox")

      if (check != null) {
        const boardHref = boardName.querySelector("a").getAttribute("href")
        const contentHref = content.querySelector("a").getAttribute("href")
  
        articles.push({
          boardName: boardName.textContent.trim(),
          articleAPIId: check.getAttribute("value"),
          articleRealId: contentHref.substring(contentHref.lastIndexOf("/") + 1),
          boardId: boardHref.substring(boardHref.lastIndexOf("/") + 1),
          title: content.textContent.trim(),
        })
      } else {
        continue
      }
    }
    return articles
  }

  /**
   * 
   * @param {number} page Page number
   * @returns Comments
   */
  const parseComments = async (page) => {
    const url = `https://${isMobile ? "m" : "bbs"}.ruliweb.com/member/mypage/mycomment?page=${page}`
    const dom = await fetchToDOM(url)
    // console.log(dom)
    const tbody = dom.querySelector(".text_over_table > .table_body")
    /**
     * @type {Array<{boardName: string, commentId: string, content: string}>}
     */
    let comments = []
    for (const el of tbody.children) {
      const boardName = el.querySelector(".board_name")
      const content = el.querySelector(".comment")
      
      const check = el.querySelector(".checkbox")
      if (check != null) {
        comments.push({
          boardName: boardName.textContent.trim(),
          commentId: check.getAttribute("value"),
          content: content.textContent.trim(),
        })
      } else {
        continue
      }
    }
    return comments
  }

  const removeALLArticles = async () => {
    let removeArticles = []
    let page = 1
    while (true) {
      updateCurrent(`삭제할 게시글들을 수집 중입니다. (현재 ${removeArticles.length}개)`)
      try {
        const articles = await parseArticles(page)
        if (articles.length <= 0) {
          break
        }
        removeArticles.push(...articles)
        page += 1
        if (isDebug && removeArticles.length >= 100) {
          break
        }
        await sleep(300)
      } catch (err) {
        await sleep(2000)
        console.error(err)
      }
    }

    updateCurrent(`게시글 삭제를 시작합니다.`)
    exportData(removeArticles, "게시글_목록")

    const removeURL = `https://api.ruliweb.com/procDeleteMyArticle`
    const totalArticleCounts = removeArticles.length

    while (removeArticles.length > 0) {
      updateCurrent(`게시글을 삭제중입니다. (${totalArticleCounts - removeArticles.length}/${totalArticleCounts})`)

      const subCmt = removeArticles.slice(0, 20)

      if (isDebug) {
        console.log(
          removeArticles.splice(0, 20)
        )
        await sleep(500)
        continue
      }

      const resp = await fetch(removeURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        credentials: "include",
        body: new URLSearchParams({
          "select_list": `[${subCmt.map((v) => `"${v.articleAPIId}"`).join(",")}]`,
        })
      })
      if (resp.status === 200) {
        removeArticles.splice(0, 20)
      } else {
        const errLog = await resp.text()
        updateCurrent(`끄앙 오류입니다: ${errLog}`)
        console.error(errLog)
        await sleep(2000)
      }
      await sleep(200)
    }
    updateCurrent(`게시글 삭제가 완료되었습니다.`)
  }

  const removeALLComments = async () => {
    let removeComments = []
    let page = 1
    while (true) {
      updateCurrent(`삭제할 댓글들을 수집 중입니다. (현재 ${removeComments.length}개)`)
      try {
        const comments = await parseComments(page)
        if (comments.length <= 0) {
          break
        }
        removeComments.push(...comments)
        page += 1
        if (isDebug && removeComments.length >= 100) {
          break
        }
        await sleep(300)
      } catch (err) {
        await sleep(2000)
        console.error(err)
      }
    }

    updateCurrent(`댓글 삭제를 시작합니다.`)
    exportData(removeComments, "댓글_목록")

    const removeURL = `https://api.ruliweb.com/procDeleteMyComment`
    const totalCommentCounts = removeComments.length

    while (removeComments.length > 0) {
      updateCurrent(`댓글을 삭제중입니다. (${totalCommentCounts - removeComments.length}/${totalCommentCounts})`)

      const subCmt = removeComments.slice(0, 20)

      if (isDebug) {
        console.log(
          removeComments.splice(0, 20)
        )
        await sleep(500)
        continue
      }

      const resp = await fetch(removeURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        credentials: "include",
        body: new URLSearchParams({
          "select_list": `[${subCmt.map((v) => `"${v.commentId}"`).join(",")}]`,
        })
      })
      if (resp.status === 200) {
        removeComments.splice(0, 20)
      } else {
        const errLog = await resp.text()
        updateCurrent(`끄앙 오류입니다: ${errLog}`)
        console.error(errLog)
        await sleep(2000)
      }
      await sleep(200)
    }
  }

  const runFn = async () => {
    let wakelock = null

    try {
      wakelock = await navigator.wakeLock.request("screen")
    } catch (err3) {
      console.error(err3)
    }

    // 게시글
    await removeALLArticles()
    // ...
    updateCurrent(`댓글 삭제를 시작합니다.`)
    await sleep(1000)

    // 댓글
    await removeALLComments()
    try {
      if (wakelock != null) {
        await wakelock.release()
        wakelock = null
      }
    } catch (err4) {
      console.error(err4)
    }
    confirm(`클리닝을 완료했습니다! 안녕히 가세요!`)
  }
  
  try {
    removeBtn.addEventListener("click", (ev) => {
      ev.preventDefault()
      try {
        if (running) {
          alert("이미 진행중임다.\n취소를 원할 시 새로고침을 해 주세요.")
          return
        }
        if (confirm(confirmMsg)) {
          running = true
          runFn()
        }
      } catch (err2) {}
    })
  } catch (err) {}
})()