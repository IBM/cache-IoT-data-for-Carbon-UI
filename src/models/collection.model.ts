import { Entity, model, property } from '@loopback/repository';

@model()
export class Collection extends Entity {
  @property({
    type: 'number',
    id: true,
    required: true,
  })
  collectionID: number;

  @property({
    type: 'string',
    required: true,
  })
  collectionName: string;

  @property({
    type: 'string',
    required: true,
  })
  baseURL: string;

  @property({
    type: 'number',
    required: true,
    default: 60,
  })
  refreshInterval: number;

  @property({
    type: 'string',
    required: true,
    default: 'Basic',
  })
  authenticationType: string;

  @property({
    type: 'string',
    required: true,
    default: 'memory',
  })
  cacheLocation: string;

  @property({
    type: 'object',
    required: true,
  })
  credentials: object;


  constructor(data?: Partial<Collection>) {
    super(data);
  }
}
