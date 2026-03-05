import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessRequestsController } from './access-request.controller';
import { AccessRequestService } from './access-requests.service';
import {
  AccessRequest,
  AccessRequestSchema,
} from '@infrastructure/database/schemas/access-request.schema';

@Module({
  imports: [
    // Register the schema so @InjectModel(AccessRequest.name) works
    // inside AccessRequestService.
    MongooseModule.forFeature([
      { name: AccessRequest.name, schema: AccessRequestSchema },
    ]),
  ],
  controllers: [AccessRequestsController],
  providers: [AccessRequestService],
})
export class AccessRequestsModule {}