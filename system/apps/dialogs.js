
export function inlineSelect(sheetElement, {title, options, defaultValue=null}){
  return new Promise(resolve=>{
    const overlay = document.createElement('div');
    overlay.className = 'inline-modal';
    const panel = document.createElement('div');
    panel.className = 'inline-panel';
    panel.innerHTML = `<h3>${title}</h3>
      <div class="row">
        <select class="inline-select">
          ${Object.entries(options).map(([k,v])=>`<option value="${v}">${k}</option>`).join("")}
        </select>
      </div>
      <div class="inline-actions">
        <button class="inline-cancel">Annuler</button>
        <button class="inline-ok">OK</button>
      </div>`;
    overlay.appendChild(panel);
    sheetElement.append(overlay);

    const sel = panel.querySelector('.inline-select');
    if (defaultValue!=null) sel.value = defaultValue;

    function close(v){ overlay.remove(); resolve(v); }
    panel.querySelector('.inline-cancel').addEventListener('click', ()=>close(null));
    panel.querySelector('.inline-ok').addEventListener('click', ()=>close(sel.value));
  });
}
