import { Book, Group } from "bkper";
import { CHILD_BOOK_ID_PROP } from "./constants";
import { EventHandlerGroup } from "./EventHandlerGroup";

export class EventHandlerGroupCreatedOrUpdated extends EventHandlerGroup {
  protected async connectedGroupNotFound(baseBook: Book, connectedBook: Book, baseGroup: bkper.Group): Promise<string> {
    let connectedGroup = await connectedBook.newGroup()
    .setName(baseGroup.name)
    .setHidden(baseGroup.hidden)
    .setProperties(baseGroup.properties)
    .deleteProperty(CHILD_BOOK_ID_PROP)
    .create();
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: GROUP ${connectedGroup.getName()} CREATED`;
  }
  protected async connectedGroupFound(baseBook: Book, connectedBook: Book, baseGroup: bkper.Group, connectedGroup: Group): Promise<string> {
    let connectedChildBookId = connectedGroup.getProperty(CHILD_BOOK_ID_PROP)
    await connectedGroup
    .setName(baseGroup.name)
    .setHidden(baseGroup.hidden)
    .setProperties(baseGroup.properties)
    .setProperty(CHILD_BOOK_ID_PROP, connectedChildBookId)
    .update();
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: GROUP ${connectedGroup.getName()} UPDATED`;
  }


}