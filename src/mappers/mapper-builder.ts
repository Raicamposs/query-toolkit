import { coalesce, isAssigned, isNullOrUndefined, JSONConverter, ObjectEntries } from "@raicamposs/toolkit"
import { Convert } from "./convert"
import { Mapper } from "./mapper"



export class MapperBuilder<Table extends Record<string, any>, Entity extends Record<string, any>> {
  private readonly convert: Convert<Table, Entity> = new Map()

  constructor(private readonly mapper: Mapper<Table, Entity>) { }

  public addConverter(
    entityProperty: keyof Entity,
    convert: (value: unknown, property: keyof Table) => unknown,
  ) {
    this.convert.set(entityProperty, convert)
    return this
  }

  public convertEmptyToNull(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) =>
      value === '' ? null : value,
    )
  }


  public convertEmptyToUndefined(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) =>
      value === '' ? undefined : value,
    )
  }

  public convertZeroToNull(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) =>
      value === 0 ? null : value,
    )
  }

  public convertOnlyNumbers(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) =>
      isAssigned(value) ? value.toString().replace(/[^0-9]/gi, '') : value,
    )
  }

  public convertDateToIso(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) => {
      if (isNullOrUndefined(value)) {
        return value
      }

      return new Date(value as any).toISOString()
    })
  }

  public convertTime<EntityProperty extends keyof Entity>(
    entityProperty: EntityProperty,
  ) {
    return this.addConverter(entityProperty, (value: unknown) => {
      if (value === null || value === undefined) {
        return value
      }
      const date = new Date(value as any)
      return [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
        .map((item: number) => item.toString().padStart(2, '0'))
        .join(':')
    })
  }

  public convertToUpper(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) =>
      value?.toString().toUpperCase(),
    )
  }

  public convertToLower(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) =>
      value?.toString().toLowerCase(),
    )
  }

  public convertZeroToUndefined(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) =>
      value === 0 ? undefined : value,
    )
  }

  public convertJsonStringToObject(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) =>
      JSONConverter.parse(value as any),
    )
  }

  public convertObjectToJsonString(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) =>
      JSONConverter.stringify(value),
    )
  }

  public convertStrToNumber(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) =>
      Number(value?.toString().replace(',', '.')),
    )
  }

  public convertStrToFloat(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) =>
      parseFloat(value?.toString()?.replace(',', '.') ?? ''),
    )
  }

  public convertStrToBoolean(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) => {
      if (isNullOrUndefined(value)) {
        return value
      }
      return value === 'true' || value === true || value === '1' || value === 1
    })
  }

  public convertStrToDate(entityProperty: keyof Entity) {
    return this.addConverter(entityProperty, (value: unknown) =>
      isNullOrUndefined(value) ? value : new Date(value as any),
    )
  }

  public convertDefaultAs(entityProperty: keyof Entity, defaultValue: unknown) {
    return this.addConverter(entityProperty, (value: unknown) =>
      coalesce(value, defaultValue),
    )
  }
  public entityToModel(entity: Partial<Entity>): Table {
    if (isNullOrUndefined(entity)) {
      return entity as unknown as Table
    }

    const initialValue = {} as Table

    return ObjectEntries(this.mapper).reduce((model, [modelProp, entityProp]) => {
      const modelProperty = modelProp as keyof Table
      const entityProperty = entityProp as keyof Entity

      const originalValue = entity[entityProperty]
      const converter = this.convert.get(entityProperty)

      if (!converter) {
        model[modelProperty] = originalValue as Table[keyof Table]
        return model
      }

      model[modelProperty] = (
        Array.isArray(originalValue)
          ? originalValue.map((item: unknown) => converter(item, modelProperty))
          : converter(originalValue, modelProperty)
      ) as Table[keyof Table]

      return model
    }, initialValue)
  }

  public toColumnMapper(): Record<keyof Entity, keyof Table> {
    const initialValue = {} as Record<keyof Entity, keyof Table>

    return ObjectEntries(this.mapper).reduce((acc, [modelProp, entityProp]) => {
      acc[entityProp as keyof Entity] = modelProp as keyof Table
      return acc
    }, initialValue)
  }

  public modelToEntity(model: Partial<Table>): Entity {
    if (isNullOrUndefined(model)) {
      return model as unknown as Entity
    }

    const initialValue = {} as Entity

    return ObjectEntries(this.mapper).reduce((entity, [modelProp, entityProp]) => {
      const modelProperty = modelProp as keyof Table
      const entityProperty = entityProp as keyof Entity

      entity[entityProperty] = model[modelProperty] as Entity[keyof Entity]
      return entity
    }, initialValue)
  }

  public getMappings(): Mapper<Table, Entity> {
    return this.mapper
  }
}
