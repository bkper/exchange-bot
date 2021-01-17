import { Book, Group } from "bkper";
import { EventHandlerGroup } from "./EventHandlerGroup";

export class EventHandlerGroupCreatedOrUpdated extends EventHandlerGroup {
  protected async connectedGroupNotFound(baseBook: Book, connectedBook: Book, baseGroup: bkper.Group): Promise<string> {
    let connectedGroup = await connectedBook.newGroup()
    .setName(baseGroup.name)
    .setHidden(baseGroup.hidden)
    .setProperties(baseGroup.properties)
    .create();
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: GROUP ${connectedGroup.getName()} CREATED`;
  }
  protected async connectedGroupFound(baseBook: Book, connectedBook: Book, baseGroup: bkper.Group, connectedGroup: Group): Promise<string> {
    await connectedGroup
    .setName(baseGroup.name)
    .setHidden(baseGroup.hidden)
    .setProperties(baseGroup.properties)
    .update();
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: GROUP ${connectedGroup.getName()} UPDATED`;
  }


}