import {DefaultCrudRepository} from '@loopback/repository';
import {Collection} from '../models';
import {CollectionDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CollectionRepository extends DefaultCrudRepository<
  Collection,
  typeof Collection.prototype.collectionID
> {
  constructor(
    @inject('datasources.collection') dataSource: CollectionDataSource,
  ) {
    super(Collection, dataSource);
  }
}
