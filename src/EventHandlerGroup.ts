abstract class EventHandlerGroup extends EventHandler {

  protected processObject(baseBook: Bkper.Book, connectedBook: Bkper.Book, event: bkper.Event): string {
    let connectedCode = Service_.getBaseCode(connectedBook);
    let group = event.data.object as bkper.Group;

    if (connectedCode != null && connectedCode != '') {

      let name = event.data.previousAttributes['name'] ? event.data.previousAttributes['name'] : group.name;

      let connectedGroup = connectedBook.getGroup(name);
      if (connectedGroup) {
        return this.connectedGroupFound(baseBook, connectedBook, group, connectedGroup);
      } else {
        return this.connectedGroupNotFound(baseBook, connectedBook, group);
      }
    }
  }

  protected abstract connectedGroupNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, group: bkper.Group): string;

  protected abstract connectedGroupFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, group: bkper.Group, connectedGroup: Bkper.Group): string;

}