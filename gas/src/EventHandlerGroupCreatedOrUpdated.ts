class EventHandlerGroupCreatedOrUpdated extends EventHandlerGroup {
  protected connectedGroupNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, baseGroup: bkper.Group): string {
    let connectedGroup = connectedBook.newGroup()
    .setName(baseGroup.name)
    .setHidden(baseGroup.hidden)
    .setProperties(baseGroup.properties)
    .create();
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: GROUP ${connectedGroup.getName()} CREATED`;
  }
  protected connectedGroupFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, baseGroup: bkper.Group, connectedGroup: Bkper.Group): string {
    connectedGroup
    .setName(baseGroup.name)
    .setHidden(baseGroup.hidden)
    .setProperties(baseGroup.properties)
    .update();
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: GROUP ${connectedGroup.getName()} UPDATED`;
  }


}