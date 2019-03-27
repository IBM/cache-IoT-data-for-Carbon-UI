import { Entity, model, property } from '@loopback/repository';

@model({ settings: { strict: true } })
export class User extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  username: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;


  constructor(data?: Partial<User>) {
    super(data);
  }
}
