import {
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { ICommandHandler } from '../../../../common/cqrs';

import {
  AddIpToApplicationCommand,
  AddIpToApplicationCommandOutput,
} from '../commands/add-ip-to-application.command';
import {
  CLIENT_APPLICATION_REPOSITORY,
  IClientApplicationRepository,
} from '../../domain/repositories/client-application.repository.interface';
import { ClientApplication } from '../../domain/entities/client-application.entity';
// import { normalizeIp } from '../../domain/utils/ip.utils';

@CommandHandler(AddIpToApplicationCommand)
export class AddIpToApplicationHandler
  implements
    NestCommandHandler<AddIpToApplicationCommand, AddIpToApplicationCommandOutput>,
    ICommandHandler<AddIpToApplicationCommand, AddIpToApplicationCommandOutput>
{
    constructor(    @Inject(CLIENT_APPLICATION_REPOSITORY)
    private readonly clientApplicationRepository: IClientApplicationRepository,) {}
    execute(command: AddIpToApplicationCommand): Promise<AddIpToApplicationCommandOutput> {
     
       return this.clientApplicationRepository.findById(command.applicationId).then(application => {
            if (!application) {
                throw new NotFoundException('Application not found');
            }
        
            application.setIp(command.ipAddress);
            this.clientApplicationRepository.save(application);
            return new AddIpToApplicationCommandOutput(command.applicationId, command.ipAddress);
        });

         }
}
