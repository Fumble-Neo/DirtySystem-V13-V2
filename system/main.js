
import { DirtyActor } from "./documents/dirty-actor.js";
import { DirtyItem } from "./documents/dirty-item.js";
import { DirtyItemSheet } from "./sheets/dirty-item-sheet.js";

import { DirtyActorSheet } from "./sheets/dirty-actor-sheet.js";
import { installCustomLogo } from "./ui/logo.js";

Hooks.once("init", function () {
  Handlebars.registerHelper('eq', (a,b)=>a===b);

  CONFIG.Item.documentClass = DirtyItem;
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("dirty-system", DirtyItemSheet, { makeDefault: true });

  console.log("Dirty System | init v1.1.4");
  CONFIG.Actor.documentClass = DirtyActor;
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("dirty-system", DirtyActorSheet, { makeDefault: true });
});

Hooks.once("ready", installCustomLogo);
