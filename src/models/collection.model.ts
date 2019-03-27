import { Entity, model, property } from '@loopback/repository';

@model({ settings: { strict: true } })
export class Collection extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  collectionID: string;

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
