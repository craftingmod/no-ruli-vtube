// ==UserScript==
// @name         Ruliweb Block Image Responsive Attributes
// @namespace    local.gun
// @version      1.0.3
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

  const STOP_SUBMIT = false;
  const IMAGE_STYLE = "max-width: 100%;";
  const allowedAttributes = new Set(["src"]);

  const stopSubmit = () => {
    // event.preventDefault();
    // event.stopImmediatePropagation();
    alert("테스트 모드: form 제출을 중단했습니다.");
    return false;
  };

  function cleanImageElement(img) {
    [...img.attributes].forEach((attr) => {
      if (!allowedAttributes.has(attr.name.toLowerCase())) {
        img.removeAttribute(attr.name);
      }
    });

    const src = img.getAttribute("src");
    if (src) {
      img.setAttribute("src", src.replace("/img/", "/ori/"));
    }

    img.setAttribute("style", IMAGE_STYLE);
  }

  function cleanHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");

    doc.body.querySelectorAll("img").forEach(cleanImageElement);

    return doc.body.innerHTML;
  }

  function cleanContentValue() {
    document.querySelectorAll("#board_write .content").forEach((content) => {
      if ("value" in content && typeof content.value === "string") {
        content.value = cleanHtml(content.value);
        return;
      }

      if (content.innerHTML) {
        content.innerHTML = cleanHtml(content.innerHTML);
      }
    });
  }

  function cleanImageMetaValue() {
    const contentImageMeta = document.querySelector("#content_image_meta");

    if (contentImageMeta && "value" in contentImageMeta) {
      contentImageMeta.value = "{}";
    }
  }

  function cleanImages() {
    const root = document.querySelector(".board_main_view .App .seditor") || document;

    root.querySelectorAll("img").forEach(cleanImageElement);
    cleanContentValue();
    cleanImageMetaValue();
  }

  window.addEventListener(
    "submit",
    (ev) => {
      cleanImages();
      if (STOP_SUBMIT) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        stopSubmit();
        return undefined;
      }
    },
    true,
  );

  const originalSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function submit() {
    cleanImages();
    if (STOP_SUBMIT) {
      stopSubmit();
      return undefined;
    }
    return originalSubmit.call(this);
  };

  const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
  if (originalRequestSubmit) {
    HTMLFormElement.prototype.requestSubmit = function requestSubmit(...args) {
      cleanImages();
      if (STOP_SUBMIT) {
        stopSubmit();
        return undefined;
      }
      return originalRequestSubmit.apply(this, args);
    };
  }
})();
