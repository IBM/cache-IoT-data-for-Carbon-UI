import {Entity, model, property} from '@loopback/repository';

@model()
export class Cache extends Entity {
  @property({
    type: 'number',
    id: true,
    required: true,
  })
  collectionID: number;

  @property({
    type: 'object',
    required: true,
  })
  data: object;


  constructor(data?: Partial<Cache>) {
    super(data);
  }
}
