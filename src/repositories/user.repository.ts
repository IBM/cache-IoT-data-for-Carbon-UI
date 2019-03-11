import {DefaultCrudRepository} from '@loopback/repository';
import {User} from '../models';
import {UserDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.username
> {
  constructor(
    @inject('datasources.User') dataSource: UserDataSource,
  ) {
    super(User, dataSource);
  }
}
