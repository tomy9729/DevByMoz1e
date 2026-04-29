import { Module } from "@nestjs/common";
import { AdventureIslandsController } from "./controllers/adventure-islands.controller";
import { LostArkEventsController } from "./controllers/lostark-events.controller";
import { LostArkGameContentsController } from "./controllers/lostark-game-contents.controller";
import { LostArkNoticesController } from "./controllers/lostark-notices.controller";
import { LostArkClient } from "./lostark.client";
import { AdventureIslandsService } from "./services/adventure-islands.service";
import { CharactersService } from "./services/characters.service";
import { LostArkEventsService } from "./services/lostark-events.service";
import { LostArkGameContentsService } from "./services/lostark-game-contents.service";
import { LostArkNoticesService } from "./services/lostark-notices.service";

@Module({
    controllers: [
        LostArkEventsController,
        LostArkNoticesController,
        LostArkGameContentsController,
        AdventureIslandsController,
    ],
    providers: [
        LostArkClient,
        LostArkEventsService,
        LostArkNoticesService,
        LostArkGameContentsService,
        AdventureIslandsService,
        CharactersService,
    ],
    exports: [AdventureIslandsService, CharactersService, LostArkGameContentsService, LostArkNoticesService],
})
export class LostArkModule {}
