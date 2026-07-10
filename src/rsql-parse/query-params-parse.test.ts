import { describe, expect, it } from 'vitest';
import { ClassicPage, CursorPage, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../common';
import { EqualsOperator } from '../query-operator';
import { OperatorRegistry } from './operator-registry';
import type { QueryShapeSchema } from './query-params-parse';
import { QueryParamsParse } from './query-params-parse';
import { ValidationException } from './validation-exception';

interface UserTest {
  id: number;
  name: string;
  age: number;
  status: string;
}

describe('QueryParamsParse', () => {
  it('deve parsear parâmetros de consulta simples', () => {
    const params = { name: '==John', age: 'gt=18' };
    const parser = new QueryParamsParse<UserTest>(params);
    const { operators: result } = parser;

    expect(result.name).toHaveLength(1);
    expect(result.name[0]).toBeInstanceOf(EqualsOperator);
    expect(result.age).toHaveLength(1);
    expect(result.age[0].symbol).toBe('gt=');
  });

  it('deve lidar com parâmetros de array', () => {
    const params = { status: ['==active', '==pending'] };
    const parser = new QueryParamsParse<UserTest>(params as any);
    const { operators: result } = parser;

    expect(result.status).toHaveLength(2);
    expect(result.status[0]).toBeInstanceOf(EqualsOperator);
    expect(result.status[1]).toBeInstanceOf(EqualsOperator);
  });

  it('deve ignorar chaves ou valores vazios', () => {
    const params = { name: '', '': '==value' };
    const parser = new QueryParamsParse<UserTest>(params);
    const { operators: result } = parser;

    expect(Object.keys(result)).toHaveLength(0);
  });

  it('deve parsear operadores personalizados registrados no OperatorRegistry', () => {
    class CustomFakeOperator extends EqualsOperator {
      constructor(rawValue: string) {
        super(rawValue);
      }
    }

    // Registrar o operador customizado
    OperatorRegistry.register('fake=', (params: string) => {
      const [, value] = params.split('fake=');
      return new CustomFakeOperator(`==${value}`);
    });

    const params = { field: 'fake=value' };
    const parser = new QueryParamsParse<any>(params);
    const { operators: result } = parser;

    expect(result.field).toHaveLength(1);
    expect(result.field[0]).toBeInstanceOf(CustomFakeOperator);
    expect(result.field[0].value()).toBe('value');
  });

  describe('Filtro de Chaves e Shape Schema', () => {
    it('deve apenas parsear chaves definidas no shape schema', () => {
      const params = { name: '==John', age: 'gt=18', secret: '==forbidden' };
      const shape = { name: true, age: true } as any;
      const parser = new QueryParamsParse<UserTest>(params as any, shape);
      const { operators: result } = parser;

      expect(result.name).toBeDefined();
      expect(result.age).toBeDefined();
      expect((result as any).secret).toBeUndefined();
    });
  });

  describe('Integração com Ordenação (Sort)', () => {
    it('deve parsear direções de ordenação para chaves aprovadas pelo shape schema', () => {
      const params = { sort: 'name:asc,-age,secret:desc' };
      const shape = { name: true, age: true } as any;
      const parser = new QueryParamsParse<UserTest>(params as any, shape);
      const { sort } = parser;

      expect(sort).toBeDefined();
      expect(sort?.name).toBe('asc');
      expect(sort?.age).toBe('desc');
      expect((sort as any).secret).toBeUndefined();
    });

    it('deve ignorar a ordenação se ela for enviada como um array (parâmetros malformados)', () => {
      const params = { sort: ['name:asc', 'age:desc'] };
      const parser = new QueryParamsParse<any>(params as any);
      const { sort } = parser;
      expect(sort).toBeUndefined();
    });
  });

  describe('Estratégias de Paginação', () => {
    it('deve retornar undefined se nenhum parâmetro de paginação for enviado', () => {
      const parser = new QueryParamsParse<any>({});
      const { pagination } = parser;
      expect(pagination).toBeUndefined();
    });

    it('deve parsear CursorPage quando limit e cursor são fornecidos', () => {
      const params = { limit: '15', cursor: 'eyJ2Ijp7ImlkIjo0Mn19' };
      const parser = new QueryParamsParse<any>(params);
      const { pagination } = parser;

      expect(pagination).toBeInstanceOf(CursorPage);
      expect(pagination?.limit).toBe(15);
      expect((pagination as CursorPage).cursor).toBe('eyJ2Ijp7ImlkIjo0Mn19');
    });

    it('deve parsear ClassicPage quando limit e page são fornecidos', () => {
      const params = { limit: '20', page: '3' };
      const parser = new QueryParamsParse<any>(params);
      const { pagination } = parser;

      expect(pagination).toBeInstanceOf(ClassicPage);
      expect(pagination?.limit).toBe(20);
      expect((pagination as ClassicPage).page).toBe(3);
    });

    it('deve parsear ClassicPage a partir do offset quando limit e offset são fornecidos', () => {
      const params = { limit: '50', offset: '100' };
      const parser = new QueryParamsParse<any>(params);
      const { pagination } = parser;

      expect(pagination).toBeInstanceOf(ClassicPage);
      expect(pagination?.limit).toBe(50);
      expect((pagination as ClassicPage).page).toBe(3); // offset 100 / limit 50 + 1 = page 3
    });

    it('deve impor defensivamente o limite MAX_PAGE_LIMIT nas paginações parseadas', () => {
      const paramsPage = { limit: '1000', page: '2' };
      const parserPage = new QueryParamsParse<any>(paramsPage);
      const paginationPage = parserPage.pagination;

      expect(paginationPage?.limit).toBe(MAX_PAGE_LIMIT); // Limitado em MAX_PAGE_LIMIT (250)

      const paramsCursor = { limit: '9999', cursor: 'c_xyz' };
      const parserCursor = new QueryParamsParse<any>(paramsCursor);
      const paginationCursor = parserCursor.pagination;

      expect(paginationCursor?.limit).toBe(MAX_PAGE_LIMIT); // Limitado em MAX_PAGE_LIMIT (250)
    });

    it('deve lidar de forma resiliente com arrays passados no cursor ou offset', () => {
      // Limite é válido, offset é array (inválido) -> o early return entra em ação e a paginação é graciosamente ignorada
      const paramsOffset = { limit: '50', offset: ['100', '200'] };
      const parserOffset = new QueryParamsParse<any>(paramsOffset as any);
      const paginationOffset = parserOffset.pagination;
      expect(paginationOffset).toBeUndefined();

      // Limite é válido, cursor é array (inválido) -> retorna CursorPage sem o cursor
      const paramsCursor = { limit: '20', cursor: ['abc', 'def'] };
      const parserCursor = new QueryParamsParse<any>(paramsCursor as any);
      const paginationCursor = parserCursor.pagination;
      expect(paginationCursor).toBeInstanceOf(CursorPage);
      expect((paginationCursor as CursorPage).limit).toBe(20);
      expect((paginationCursor as CursorPage).cursor).toBeUndefined();
    });

    it('deve retornar paginação ignorada (undefined) quando arrays são passados onde números são esperados', () => {
      const params = { limit: ['10', '20'], page: ['1', '2'] };
      const parser = new QueryParamsParse<any>(params as any);
      const { pagination } = parser;
      expect(pagination).toBeUndefined();
    });
  });

  describe('Conversão asRsqlOperatorsObject', () => {
    it('deve transformar e mesclar com sucesso parâmetros parseados em objetos operacionais', () => {
      const params = { name: '==John', age: 'gt=18' };
      const parser = new QueryParamsParse<UserTest>(params);
      const result = parser.asRsqlOperatorsObject();

      expect(result).toBeDefined();
      expect(result.name).toEqual({ equals: 'John' });
      expect(result.age).toEqual({ gt: 18 });
    });
  });

  describe('Pré-processamento de Booleanos', () => {
    interface BooleanTest {
      isActive: boolean;
      name: string;
    }

    it('deve normalizar valores booleanos a partir de representações textuais como S/N/TRUE/FALSE para booleanos reais', () => {
      const shape = { isActive: 'boolean', name: 'string' } as const;

      // S (true)
      const parser1 = new QueryParamsParse<BooleanTest>({ isActive: '==S' }, shape);
      expect(parser1.validate().success).toBe(true);
      expect(parser1.asRsqlOperatorsObject().isActive).toEqual({ equals: true });

      // N (false)
      const parser2 = new QueryParamsParse<BooleanTest>({ isActive: '==N' }, shape);
      expect(parser2.validate().success).toBe(true);
      expect(parser2.asRsqlOperatorsObject().isActive).toEqual({ equals: false });

      // TRUE (true)
      const parser3 = new QueryParamsParse<BooleanTest>({ isActive: '==TRUE' }, shape);
      expect(parser3.validate().success).toBe(true);
      expect(parser3.asRsqlOperatorsObject().isActive).toEqual({ equals: true });

      // FALSE (false)
      const parser4 = new QueryParamsParse<BooleanTest>({ isActive: '==FALSE' }, shape);
      expect(parser4.validate().success).toBe(true);
      expect(parser4.asRsqlOperatorsObject().isActive).toEqual({ equals: false });

      // Operadores de lista in=(S,N)
      const parser5 = new QueryParamsParse<BooleanTest>({ isActive: 'in=(S,N)' }, shape);
      expect(parser5.validate().success).toBe(true);
      expect(parser5.asRsqlOperatorsObject().isActive).toEqual({ in: [true, false] });

      // Não deve alterar campos de texto normais como name
      const parser6 = new QueryParamsParse<BooleanTest>({ name: '==S' }, shape);
      expect(parser6.validate().success).toBe(true);
      expect(parser6.asRsqlOperatorsObject().name).toEqual({ equals: 'S' });
    });

    it('deve normalizar valores booleanos planos sem operador RSQL (S, N, T, F)', () => {
      const shape = { isActive: 'boolean', name: 'string' } as const;

      // Shorthands sem operador RSQL
      const parserS = new QueryParamsParse<BooleanTest>({ isActive: 'S' }, shape);
      expect(parserS.asRsqlOperatorsObject().isActive).toEqual({ equals: true });

      const parserN = new QueryParamsParse<BooleanTest>({ isActive: 'N' }, shape);
      expect(parserN.asRsqlOperatorsObject().isActive).toEqual({ equals: false });

      const parserT = new QueryParamsParse<BooleanTest>({ isActive: 'T' }, shape);
      expect(parserT.asRsqlOperatorsObject().isActive).toEqual({ equals: true });

      const parserF = new QueryParamsParse<BooleanTest>({ isActive: 'F' }, shape);
      expect(parserF.asRsqlOperatorsObject().isActive).toEqual({ equals: false });

      // Não deve afetar campo de texto
      const parserName = new QueryParamsParse<BooleanTest>({ name: 'S' }, shape);
      expect(parserName.asRsqlOperatorsObject().name).toEqual({ equals: 'S' });
    });
  });

  describe('Coerção de Strings baseada no Schema', () => {
    interface StringTest {
      documento: string;
      tags: string;
    }

    it('deve forçar valores puramente numéricos a se tornarem strings quando o schema esperar string', () => {
      const shape = { documento: 'string', tags: 'string' } as const;

      // Valor numérico simples sem aspas
      const parser1 = new QueryParamsParse<StringTest>({ documento: '==12312' }, shape);
      expect(parser1.validate().success).toBe(true);
      expect(parser1.asRsqlOperatorsObject().documento).toEqual({ equals: '12312' });

      // InOperator com lista de números sem aspas
      const parser2 = new QueryParamsParse<StringTest>({ tags: 'in=(123,456)' }, shape);
      expect(parser2.validate().success).toBe(true);
      expect(parser2.asRsqlOperatorsObject().tags).toEqual({ in: ['123', '456'] });
    });

    it('deve preservar a compatibilidade mantendo a conversão para número se nenhum schema for passado', () => {
      // Sem passar um shape schema
      const parser1 = new QueryParamsParse<any>({ id: '==12345' });
      // A biblioteca historicamente convertia para number, e deve continuar fazendo isso
      expect(parser1.asRsqlOperatorsObject().id).toEqual({ equals: 12345 });

      const parser2 = new QueryParamsParse<any>({ categoryId: 'in=(10,20)' });
      expect(parser2.asRsqlOperatorsObject().categoryId).toEqual({ in: [10, 20] });
    });
  });

  describe('Validação Personalizada (Custom Validators)', () => {
    it('deve validar com sucesso se o validador personalizado retornar true ou void', () => {
      const shape = { age: 'number' } as const;
      const parser = new QueryParamsParse<UserTest>({ age: '==5' }, shape);

      const validation = parser.validate({
        age: (value) => {
          expect(value).toBe(5);
          return true;
        },
      });

      expect(validation.success).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve retornar ValidationError estruturado com field, code e message', () => {
      const shape = { age: 'number' } as const;
      const parser = new QueryParamsParse<UserTest>({ age: '==texto-invalido' }, shape);

      const { errors } = parser.validate();

      expect(errors[0]).toMatchObject({
        field: 'age',
        code: 'INVALID_TYPE',
        message: expect.stringContaining("tipo esperado: 'number'"),
      });
    });

    it('deve falhar na validação com erro customizado se o validador retornar uma string', () => {
      const shape = { age: 'number' } as const;
      const parser = new QueryParamsParse<UserTest>({ age: '==10' }, shape);

      const validation = parser.validate({
        age: (value) => {
          if (value > 6) return 'O valor do campo age deve estar entre 1 e 6';
          return true;
        },
      });

      expect(validation.success).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'age',
          code: 'CUSTOM_VALIDATION_FAILED',
          message: 'O valor do campo age deve estar entre 1 e 6',
        })
      );
    });

    it('deve falhar na validação com erro genérico se o validador retornar false', () => {
      const shape = { age: 'number' } as const;
      const parser = new QueryParamsParse<UserTest>({ age: '==15' }, shape);

      const validation = parser.validate({ age: (value) => value < 10 });

      expect(validation.success).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({ field: 'age', code: 'CUSTOM_VALIDATION_FAILED' })
      );
    });

    it('deve falhar na validação capturando exceção lançada na função validadora', () => {
      const shape = { name: 'string' } as const;
      const parser = new QueryParamsParse<UserTest>({ name: '==John' }, shape);

      const validation = parser.validate({
        name: () => {
          throw new Error('Nome inválido devido a políticas de segurança');
        },
      });

      expect(validation.success).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          code: 'CUSTOM_VALIDATION_FAILED',
          message: 'Nome inválido devido a políticas de segurança',
        })
      );
    });

    it('deve suportar uma cadeia de validadores customizados passados como array', () => {
      const shape = { age: 'number' } as const;
      const parser = new QueryParamsParse<UserTest>({ age: '==5' }, shape);

      const validation = parser.validate({
        age: [
          (value) => value > 0 || 'Deve ser maior que 0',
          (value) => value < 10 || 'Deve ser menor que 10',
          (value) => value === 5 || 'Deve ser igual a 5',
        ],
      });

      expect(validation.success).toBe(true);
    });

    it('deve impedir a execução de validadores customizados caso a validação de tipo inicial do shape falhe', () => {
      const shape = { age: 'number' } as const;
      const parser = new QueryParamsParse<UserTest>({ age: '==texto-invalido' }, shape);

      let customValidatorCalled = false;
      const validation = parser.validate({
        age: () => {
          customValidatorCalled = true;
          return true;
        },
      });

      expect(validation.success).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({ field: 'age', code: 'INVALID_TYPE' })
      );
      expect(customValidatorCalled).toBe(false);
    });

    it('deve validar tipos e aplicar regras personalizadas quando o shape é passado diretamente no validate()', () => {
      const parser = new QueryParamsParse<UserTest>({
        age: '==5',
        name: '==John',
        extra: '==ignored',
      } as any);

      const validation = parser.validate(
        { age: 'number', name: 'string' },
        {
          age: (value) => value > 0 || 'Deve ser positivo',
          name: (value) => value.length > 2 || 'Nome muito curto',
        }
      );

      expect(validation.success).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve falhar a validação se o tipo do shape passado no validate() for incorreto', () => {
      const parser = new QueryParamsParse<UserTest>({ age: '==texto-invalido' });

      const validation = parser.validate({ age: 'number' });

      expect(validation.success).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({ field: 'age', code: 'INVALID_TYPE' })
      );
    });

    it('deve validar com sucesso usando o QueryShapeSchema definido no construtor', () => {
      const schema: QueryShapeSchema<UserTest> = {
        name: 'string',
        age: { type: 'number', validate: (value: any) => value > 0 || 'Idade deve ser positiva' },
      };

      const parser = new QueryParamsParse<UserTest>({ name: '==John', age: '==25' }, schema);
      const validation = parser.validate();

      expect(validation.success).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve falhar a validação usando o QueryShapeSchema definido no construtor quando um validador falhar', () => {
      const schema: QueryShapeSchema<UserTest> = {
        name: 'string',
        age: {
          type: 'number',
          validate: (value: any) => value > 30 || 'Idade deve ser maior que 30',
        },
      };

      const parser = new QueryParamsParse<UserTest>({ name: '==John', age: '==25' }, schema);
      const validation = parser.validate();

      expect(validation.success).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({ field: 'age', message: 'Idade deve ser maior que 30' })
      );
    });

    it('deve suportar uma cadeia de validadores customizados (array) declarados no construtor', () => {
      const schema: QueryShapeSchema<UserTest> = {
        age: {
          type: 'number',
          validate: [
            (value: any) => value >= 18 || 'Deve ser maior de idade',
            (value: any) => value <= 60 || 'Deve ter no máximo 60 anos',
          ],
        },
      };

      const parser1 = new QueryParamsParse<UserTest>({ age: '==65' }, schema);
      expect(parser1.validate().success).toBe(false);
      expect(parser1.validate().errors).toContainEqual(
        expect.objectContaining({ field: 'age', message: 'Deve ter no máximo 60 anos' })
      );

      const parser2 = new QueryParamsParse<UserTest>({ age: '==16' }, schema);
      expect(parser2.validate().success).toBe(false);
      expect(parser2.validate().errors).toContainEqual(
        expect.objectContaining({ field: 'age', message: 'Deve ser maior de idade' })
      );

      const parser3 = new QueryParamsParse<UserTest>({ age: '==25' }, schema);
      expect(parser3.validate().success).toBe(true);
    });

    it('deve impedir a execução de validadores do construtor caso a validação de tipo inicial do shape falhe (curto-circuito)', () => {
      let customValidatorCalled = false;
      const schema: QueryShapeSchema<UserTest> = {
        age: {
          type: 'number',
          validate: () => {
            customValidatorCalled = true;
            return true;
          },
        },
      };

      const parser = new QueryParamsParse<UserTest>({ age: '==invalid-number' }, schema);
      const validation = parser.validate();

      expect(validation.success).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({ field: 'age', code: 'INVALID_TYPE' })
      );
      expect(customValidatorCalled).toBe(false);
    });

    it('deve validar múltiplos tipos e regras no construtor com sucesso', () => {
      const schema: QueryShapeSchema<UserTest> = {
        name: {
          type: 'string',
          validate: (val: any) => val.startsWith('J') || 'Nome deve começar com J',
        },
        age: { type: 'number', validate: (val: any) => val >= 18 || 'Deve ser maior de idade' },
      };

      const parser = new QueryParamsParse<UserTest>({ name: '==John', age: '==20' }, schema);
      expect(parser.validate().success).toBe(true);
    });

    it('deve suportar passar o QueryShapeSchema diretamente no validate() com validadores acoplados', () => {
      const parser = new QueryParamsParse<UserTest>({ name: '==John', age: '==25' });

      const validation = parser.validate({
        name: 'string',
        age: {
          type: 'number',
          validate: (value: any) => value < 20 || 'Idade deve ser menor que 20',
        },
      });

      expect(validation.success).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({ field: 'age', message: 'Idade deve ser menor que 20' })
      );
    });
  });

  describe('validateOrThrow()', () => {
    it('não lança quando a validação passa', () => {
      const parser = new QueryParamsParse<UserTest>({ age: '==25' }, { age: 'number' } as const);
      expect(() => parser.validateOrThrow()).not.toThrow();
    });

    it('lança ValidationException quando a validação falha', () => {
      const parser = new QueryParamsParse<UserTest>({ age: '==texto' }, { age: 'number' } as const);
      expect(() => parser.validateOrThrow()).toThrow(ValidationException);
    });

    it('ValidationException contém os erros estruturados', () => {
      const parser = new QueryParamsParse<UserTest>({ age: '==texto', name: '==John' }, {
        age: 'number',
        name: 'string',
      } as const);
      try {
        parser.validateOrThrow();
        expect.fail('deveria ter lançado');
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationException);
        const exc = e as ValidationException;
        expect(exc.errors).toContainEqual(
          expect.objectContaining({ field: 'age', code: 'INVALID_TYPE' })
        );
      }
    });

    it('mensagem da exceção resume os erros', () => {
      const parser = new QueryParamsParse<UserTest>({ age: '==texto' }, { age: 'number' } as const);
      try {
        parser.validateOrThrow();
      } catch (e) {
        expect((e as Error).message).toContain('age');
      }
    });

    it('aceita customValidators diretamente — mesmo comportamento que validate()', () => {
      const parser = new QueryParamsParse<UserTest>({ age: '==5' }, { age: 'number' } as const);
      expect(() =>
        parser.validateOrThrow({ age: (v) => v > 0 || 'Deve ser positivo' })
      ).not.toThrow();
    });
  });

  describe('Validação de Sort', () => {
    it('reprova quando campo de sort não está no schema', () => {
      const parser = new QueryParamsParse<UserTest>(
        { sort: 'secret:asc' } as any,
        { age: 'number', name: 'string' } as const
      );
      const result = parser.validate();
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'secret', code: 'INVALID_SORT_FIELD' })
      );
    });

    it('aprova quando campo de sort está no schema', () => {
      const parser = new QueryParamsParse<UserTest>(
        { sort: 'name:asc' } as any,
        { age: 'number', name: 'string' } as const
      );
      expect(parser.validate().success).toBe(true);
    });

    it('não valida sort quando schema não está presente', () => {
      const parser = new QueryParamsParse<UserTest>({ sort: 'campoQualquer:asc' } as any);
      expect(parser.validate().success).toBe(true);
    });

    it('validateOrThrow lança quando sort é inválido', () => {
      const parser = new QueryParamsParse<UserTest>(
        { sort: 'secret:asc' } as any,
        { age: 'number' } as const
      );
      expect(() => parser.validateOrThrow()).toThrow(ValidationException);
    });
  });
});
