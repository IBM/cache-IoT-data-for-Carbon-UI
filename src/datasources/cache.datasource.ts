import {inject} from '@loopback/core';
import {juggler} from '@loopback/repository';
import * as config from './cache.datasource.json';

export class CacheDataSource extends juggler.DataSource {
  static dataSourceName = 'cache';

  constructor(
    @inject('datasources.config.cache', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
