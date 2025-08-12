
export class DirtyItemSheet extends ItemSheet {
  static get defaultOptions(){
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['dirty-system','sheet','item'],
      width: 420, height: 360,
      template: 'systems/dirty-system/templates/items/item-sheet.hbs'
    });
  }
  getData(options){ const data=super.getData(options); data.system=this.item.system; return data; }
}
