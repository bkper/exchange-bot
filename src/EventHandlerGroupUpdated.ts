class EventHandlerGroupUpdated extends EventHandlerGroup {
  protected connectedGroupNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, group: bkper.Group): string {
    return `GROUP FOUND`;
  }
  protected connectedGroupFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, group: bkper.Group, connectedGroup: Bkper.Group): string {
    return `GROUP NOT FOUND`;
  }

}