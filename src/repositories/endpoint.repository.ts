import {DefaultCrudRepository} from '@loopback/repository';
import {Endpoint} from '../models';
import {EndpointDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class EndpointRepository extends DefaultCrudRepository<
  Endpoint,
  typeof Endpoint.prototype.endpointID
> {
  constructor(
    @inject('datasources.endpoint') dataSource: EndpointDataSource,
  ) {
    super(Endpoint, dataSource);
  }
}
