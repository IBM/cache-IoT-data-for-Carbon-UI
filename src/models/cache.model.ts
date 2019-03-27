import { Entity, model, property } from '@loopback/repository';

@model()
export class Cache extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  collectionID: string;

  @property({
    type: 'object',
    required: false,
    default: {}
  })
  data: object;


  constructor(data?: Partial<Cache>) {
    super(data);
  }
}
