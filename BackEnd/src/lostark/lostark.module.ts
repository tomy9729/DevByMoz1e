import { Module } from "@nestjs/common";
import { AdventureIslandsController } from "./controllers/adventure-islands.controller";
import { LostArkEventsController } from "./controllers/lostark-events.controller";
import { LostArkGameContentsController } from "./controllers/lostark-game-contents.controller";
import { LostArkClient } from "./lostark.client";
import { AdventureIslandsService } from "./services/adventure-islands.service";
import { LostArkEventsService } from "./services/lostark-events.service";
import { LostArkGameContentsService } from "./services/lostark-game-contents.service";

@Module({
    controllers: [
        LostArkEventsController,
        LostArkGameContentsController,
        AdventureIslandsController,
    ],
    providers: [
        LostArkClient,
        LostArkEventsService,
        LostArkGameContentsService,
        AdventureIslandsService,
    ],
})
export class LostArkModule {}
