"use strict";

import { getConfigurations } from "./services.js";

window.onload = () => {
  const copyLink = document.querySelector("#copyLink");
  copyLink.onclick = () => {
    let input = document.body.appendChild(document.createElement("input"));
    input.value = window.location.href;
    input.focus();
    input.select();
    document.execCommand("copy");
    input.parentNode.removeChild(input);
    console.log("URL Copied: " + window.location);
    alert("URL Copied: " + window.location);
  };

  getConfigurations();

  const splash = document.querySelector("#splash-screen");
  setTimeout(() => {
    splash.classList.add("hidden");
  }, 500);
};
