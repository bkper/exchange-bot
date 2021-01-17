class EventHandlerGroupDeleted extends EventHandlerGroup {
  protected connectedGroupNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, group: bkper.Group): string {
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: GROUP ${group.name} NOT Found`;
  }
  protected connectedGroupFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, group: bkper.Group, connectedGroup: Bkper.Group): string {
    connectedGroup.remove();
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: GROUP ${connectedGroup.getName()} DELETED`;
  }

}