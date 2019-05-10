import { Entity, model, property } from '@loopback/repository';

@model({ settings: { "strict": false } })
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

  //This is if we want to do a patch for a specific endpoint
  //Simple pass the endpoint ID in the request body along with the collection
  @property({
    type: 'string',
    required: false,
  })
  endpointID: string;

  constructor(data?: Partial<Cache>) {
    super(data);
  }
}
