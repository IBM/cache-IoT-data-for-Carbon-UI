import {inject} from '@loopback/core';
import {juggler} from '@loopback/repository';
import * as config from './collection.datasource.json';

export class CollectionDataSource extends juggler.DataSource {
  static dataSourceName = 'collection';

  constructor(
    @inject('datasources.config.collection', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
