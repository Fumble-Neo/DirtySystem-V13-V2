
import { inlineSelect } from "../apps/dialogs.js";
import { tensionFromD6, rollD } from "../rolls/index.js";

function buildTags({headerBonus, persistentPenalty, tension}){
  const tags = [];
  if (headerBonus) tags.push(`<span class="tag bonus">➕ Bonus ${headerBonus>=0?'+':''}${headerBonus}</span>`);
  if (persistentPenalty) tags.push(`<span class="tag injury">🩸 Malus ${persistentPenalty}</span>`);
  if (tension) tags.push(`<span class="tag tension">⚡ Tension ${tension>=0?'+':''}${tension}</span>`);
  return tags.join(' ');
}

export class DirtyActorSheet extends ActorSheet {
  static get defaultOptions(){
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes:["dirty-system","sheet","actor"],
      template:"systems/dirty-system/templates/actors/actor-sheet.hbs",
      width: 720, height: 820,
      tabs:[{ navSelector: ".tabs", contentSelector: ".tab-panels", initial: "skills" }]
    });
  }
  getData(o){ const d=super.getData(o); d.system=this.actor.system; return d; }

  activateListeners(html){
    html.on('drop', (ev)=>this._onDrop(ev));
    html.on('click', '.item-create', (ev)=>this._createItem(ev));
    html.on('click', '.item-edit', (ev)=>this._editItem(ev));
    html.on('click', '.item-delete', (ev)=>this._deleteItem(ev));
    html.on('change', '.item-equip', (ev)=>this._equipItem(ev));

    super.activateListeners(html);
    html.find(".portrait-container").on("click", (ev)=>this._onEditImage(ev));
    html.find(".memo-increase").on("click", (ev)=>{ const id=ev.currentTarget.dataset.target; const $i=html.find('#'+id); $i.val(Number($i.val()||0)+1).trigger("change"); });
    html.find(".memo-decrease").on("click", (ev)=>{ const id=ev.currentTarget.dataset.target; const $i=html.find('#'+id); $i.val(Math.max(Number($i.val()||0)-1,0)).trigger("change"); });

    html.find('#roll-blessure').on('click', ()=>this._rollBlessure());
    html.find('#roll-effroi').on('click', ()=>this._rollEffroi());

    html.find('#clear-penalty').on('click', async ()=>{
      await this.actor.setFlag("dirty-system","penalty",0);
      this._refreshPenaltyBadge(html);
      ui.notifications?.info("Malus retiré.");
    });

    this._refreshPenaltyBadge(html);

    html.find(".stat-name").on("click", (ev)=>this._rollAttribute(ev));
  }

  async _updateObject(e, formData){ return await this.object.update(formData); }

  _onEditImage(e){
    const fp=new FilePicker({ type:"image", current:this.actor.img||"", callback:path=>this.actor.update({img:path}), top:this.position.top+40, left:this.position.left+10 });
    fp.browse();
  }

  _computeHeaderBonus(html){
    let sum=0; html.find('.bonus-checkbox:checked').each((i,el)=>{ sum+=parseInt(el.dataset.modifier)||0; }); return sum;
  }

  async _rollAttribute(ev){
    const html = this.element;
    const $s=$(ev.currentTarget).closest(".stat-item");
    const attr=$s.data("attr");
    const base=Number($s.find(".stat-value").val()||0);
    const memo=Number($s.find(".stat-memo").val()||0);

    const val = await inlineSelect(html[0], { title:"Choisir la difficulté", options:{
      "Facile (4)":4, "Eng Distance (5)":5, "Moyen (6)":6, "Difficile (8)":8, "Très difficile (10)":10
    }});
    if (val==null) return;
    const difficulty = Number(val);

    const r=await rollD("1d6");
    const t=tensionFromD6(r.total);
    const headerBonus=this._computeHeaderBonus(html);
    const persistentPenalty=Number(await this.actor.getFlag("dirty-system","penalty"))||0;
    const total=base+memo+headerBonus+persistentPenalty+t;
    const ok=total>=difficulty;

    const tags = buildTags({headerBonus, persistentPenalty, tension:t});
    const formula = `Base ${base} ${headerBonus?'+ '+headerBonus:''} ${t? (t>=0?'+ ':'')+t : ''} ${persistentPenalty? ' '+persistentPenalty : ''} ${memo? '+ '+memo : ''} + Dé ${r.total}`.replace(/\s+/g,' ').trim();

    const card = `<div class="dirty-roll-card">
      <div class="drc-head">🎯 Défi : ${attr.toString().toUpperCase()} (${difficulty})</div>
      <div class="drc-sep"></div>
      <div class="drc-line">${tags || '<span class="tag">Aucun modificateur</span>'}</div>
      <div class="drc-sep"></div>
      <div class="drc-result ${ok?'success':'failure'}">🎲 Jet : ${r.total} → <strong>TOTAL : ${total}</strong></div>
      <div class="drc-formula">(${formula})</div>
    </div>`;

    ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor:this.actor}), content: card, rolls:[r] });
  }

  async _rollBlessure(){
    const html = this.element;
    const val = await inlineSelect(html[0], { title:"Sélection de Blessure", options:{
      "Poings":"1d6","Gourdin":"2d6, Choc","Couteau / petit calibre":"2d6, Létal","Hache / gros calibre":"3d6, Létal"
    }});
    if (val==null) return;
    await this._damageLike(val, "Effet critique / Crise selon l’arme.");
  }

  async _rollEffroi(){
    const html = this.element;
    const val = await inlineSelect(html[0], { title:"Vision Effroyable", options:{
      "Cadavre":"1d6","Mutilations / hallucinations":"2d6","Souffrance extrême":"3d6","Horreur cosmique":"4d6"
    }});
    if (val==null) return;
    await this._damageLike(val, "Crise potentielle selon la table d'effroi.");
  }

  async _damageLike(choice, extra){
    const html = this.element;
    const formula=choice.split(',')[0].trim();
    const r=await rollD(formula);
    const results=r.dice[0].results.map(x=>x.result);
    const max=Math.max(...results);
    const hasDouble=results.some((v,i,a)=>a.indexOf(v)!=i);

    const penalty=(max<=5)?-1:-3;
    await this.actor.setFlag("dirty-system","penalty",penalty);
    this._refreshPenaltyBadge(html);

    const msg=(max<=5)?"Malus -1 à tous les Défis jusqu’à la fin de la scène.":"Malus -3 à tous les Défis jusqu’à soin.";

    const card = `<div class="dirty-roll-card">
      <div class="drc-head">🩸 Blessure</div>
      <div class="drc-sep"></div>
      <div class="drc-line"><span class="tag injury">🩸 Malus ${penalty}</span>${hasDouble?'<span class="tag tension">⚡ Effet critique</span>':''}</div>
      <div class="drc-sep"></div>
      <div class="drc-result ${penalty===-3?'failure':'success'}">🎲 Jet : ${r.result} → <strong>Max : ${max}</strong></div>
      <div class="drc-formula">${msg}</div>
    </div>`;

    ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor:this.actor}), content: card, rolls:[r] });
  }

  async _refreshPenaltyBadge(html){
    const p = Number(await this.actor.getFlag("dirty-system","penalty")) || 0;
    html.find('.penalty-value').text(p);
  }
}



DirtyActorSheet.prototype._createItem = async function(ev){
  ev?.preventDefault?.(); ev?.stopPropagation?.();
  const type = ev?.currentTarget?.dataset?.type || 'gear';
  await this.actor.createEmbeddedDocuments('Item', [{ name: 'Objet', type }]);
  this.render(true);
};

DirtyActorSheet.prototype._editItem = async function(ev){
  ev?.preventDefault?.(); ev?.stopPropagation?.();
  const row = ev.currentTarget.closest('tr'); if(!row) return;
  const id = row.dataset.itemId;
  const it = this.actor.items.get(id); if (it) it.sheet.render(true);
};

DirtyActorSheet.prototype._deleteItem = async function(ev){
  ev?.preventDefault?.(); ev?.stopPropagation?.();
  const row = ev.currentTarget.closest('tr'); if(!row) return;
  const id = row.dataset.itemId; if (!id) return;
  await this.actor.deleteEmbeddedDocuments('Item', [id]);
  this.render(true);
};

DirtyActorSheet.prototype._equipItem = async function(ev){
  ev?.preventDefault?.(); ev?.stopPropagation?.();
  const row = ev.currentTarget.closest('tr'); if(!row) return;
  const id = row.dataset.itemId;
  const it = this.actor.items.get(id);
  if (it) await it.update({'system.equipped': ev.currentTarget.checked});
};

DirtyActorSheet.prototype._onDrop = async function(event){
  event?.preventDefault?.();
  const data = TextEditor.getDragEventData(event);
  try {
    const item = await Item.implementation.fromDropData(data);
    if (!item) return false;
    const toCreate = item.toObject();
    delete toCreate._id;
    await this.actor.createEmbeddedDocuments('Item', [toCreate]);
    this.render(true);
    return true;
  } catch(e){
    console.error(e);
    return false;
  }
};
