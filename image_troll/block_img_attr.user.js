// ==UserScript==
// @name         Ruliweb Block Image Responsive Attributes
// @namespace    local.gun
// @version      1.0.1
// @description  Prevent Ruliweb editor scripts from injecting problematic responsive image metadata.
// @match        https://*.ruliweb.com/*write*
// @match        https://*.ruliweb.com/*modify*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  if (!/(?:write|modify)/i.test(location.href)) {
    return;
  }

  const STOP_SUBMIT = false

  const stopSubmit = () => {
    // event.preventDefault();
    // event.stopImmediatePropagation();
    alert("테스트 모드: form 제출을 중단했습니다.");
    return false;
  };

  function cleanImages() {
    const root = document.querySelector(".board_main_view .App .seditor") || document;
    const allowedAttributes = new Set(["src"]);

    root.querySelectorAll("img").forEach((img) => {
      [...img.attributes].forEach((attr) => {
        if (!allowedAttributes.has(attr.name.toLowerCase())) {
          img.removeAttribute(attr.name);
        }
      });
      img.setAttribute("style", "max-width: 100%; border: 1px solid black;")
    });
  }

  window.addEventListener(
    "submit",
    (ev) => {
      cleanImages();
      if (STOP_SUBMIT) {
        stopSubmit()
        return undefined
      }
    },
    true,
  );

  const originalSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function submit() {
    cleanImages();
    if (STOP_SUBMIT) {
      stopSubmit()
      return undefined
    }
    return originalSubmit.call(this);
  };

  const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
  if (originalRequestSubmit) {
    HTMLFormElement.prototype.requestSubmit = function requestSubmit(...args) {
      cleanImages();
      if (STOP_SUBMIT) {
        stopSubmit()
        return undefined
      }
      return originalRequestSubmit.apply(this, args);
    };
  }
})();
