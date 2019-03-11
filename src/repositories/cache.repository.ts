import {DefaultCrudRepository} from '@loopback/repository';
import {Cache} from '../models';
import {CacheDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CacheRepository extends DefaultCrudRepository<
  Cache,
  typeof Cache.prototype.collectionID
> {
  constructor(
    @inject('datasources.cache') dataSource: CacheDataSource,
  ) {
    super(Cache, dataSource);
  }
}
