export function installCustomLogo() {
 
  const el = document.querySelector("#logo");
  if (el) el.style.display = "none";

  
  if (document.querySelector("#custom-logo")) return;

  const img = document.createElement("img");
  img.id = "custom-logo";
  img.src = "systems/dirty-system/assets/img/cropped-DCC_logo.png";

 
  img.style.pointerEvents = "none";


  img.style.position = "absolute";
  img.style.top = "10px";
  img.style.left = "10px";
  img.style.width = "42px";
  img.style.height = "auto";
  img.style.zIndex = "1"; 


  const ui = document.querySelector("#ui-top-left") || document.querySelector("#ui-left") || document.body;
  ui.appendChild(img);
}
