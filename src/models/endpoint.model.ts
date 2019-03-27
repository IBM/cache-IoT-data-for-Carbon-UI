import { Entity, model, property } from '@loopback/repository';

@model({ settings: { strict: true } })
export class Endpoint extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  endpointID: string;

  @property({
    type: 'string',
    required: true,
  })
  endpointPath: string;

  @property({
    type: 'string',
    required: true,
  })
  collectionID: string;

  @property({
    type: 'object',
    required: false,
  })
  credentials?: object;

  @property({
    type: 'number',
    required: false,
  })
  refreshInterval?: number;

  @property({
    type: 'string',
    required: false,
  })
  authenticationType?: string;

  @property({
    type: 'string',
    required: false,
  })
  baseURL?: string;

  @property.array(String, {
    required: false
  })
  endpointList?: string[];


  constructor(data?: Partial<Endpoint>) {
    super(data);
  }
}
