import {inject} from '@loopback/core';
import {juggler} from '@loopback/repository';
import * as config from './endpoint.datasource.json';

export class EndpointDataSource extends juggler.DataSource {
  static dataSourceName = 'endpoint';

  constructor(
    @inject('datasources.config.endpoint', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
