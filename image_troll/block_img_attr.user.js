// ==UserScript==
// @name         Ruliweb Block Image Responsive Attributes
// @namespace    local.gun
// @version      1.0.0
// @description  Prevent Ruliweb editor scripts from injecting problematic responsive image metadata.
// @match        https://*.ruliweb.com/*write*
// @match        https://*.ruliweb.com/*modify*
// @match        https://*.ruliweb.net/*write*
// @match        https://*.ruliweb.net/*modify*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  if (!/(?:write|modify)/i.test(location.href)) {
    return;
  }
  console.log("[UserScript] Block Test")

  const BLOCK_STYLE_SETATTRIBUTE = false;
  const BLOCK_STYLE_PROPERTY_WRITE = false;
  const STOP_FORM_SUBMIT_FOR_TEST = false;

  const blockedImgAttributes = new Set([
    "data-aspect-ratio",
    "data-pc-width",
    "data-pc-height",
    "data-mo-width",
    "data-mo-height",
    "width",
    "height",
  ]);

  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function setAttribute(name, value) {
    const tagName = this.tagName?.toLowerCase();
    const attrName = String(name).toLowerCase();

    console.log(`[UserScript] ${tagName}, ${attrName}`)
    if (tagName === "img") {
      if (blockedImgAttributes.has(attrName)) {
        console.log(`[UserScript] ${attrName} BLOCKED`)
        return;
      }

      if (BLOCK_STYLE_SETATTRIBUTE && attrName === "style") {
        return;
      }
    }

    return originalSetAttribute.call(this, name, value);
  };

  if (STOP_FORM_SUBMIT_FOR_TEST) {
    const stopSubmit = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      alert("테스트 모드: form 제출을 중단했습니다.");
      return false;
    };

    window.addEventListener("submit", stopSubmit, true);

    const originalSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function submit() {
      alert("테스트 모드: form.submit() 호출을 중단했습니다.");
      return undefined;
    };

    const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
    if (originalRequestSubmit) {
      HTMLFormElement.prototype.requestSubmit = function requestSubmit() {
        alert("테스트 모드: form.requestSubmit() 호출을 중단했습니다.");
        return undefined;
      };
    }
  }

  if (BLOCK_STYLE_PROPERTY_WRITE) {
    const styleDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "style");

    if (styleDescriptor?.get) {
      Object.defineProperty(HTMLElement.prototype, "style", {
        configurable: true,
        enumerable: styleDescriptor.enumerable,
        get() {
          const style = styleDescriptor.get?.call(this);

          if (this.tagName?.toLowerCase() !== "img") {
            return style;
          }

          return new Proxy(style, {
            set(target, property, value) {
              if (property === "width" || property === "height") {
                return true;
              }

              target[property] = value;
              return true;
            },
          });
        },
      });
    }
  }
})();
