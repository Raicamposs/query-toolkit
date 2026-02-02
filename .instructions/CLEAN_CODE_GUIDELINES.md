🏗️ SQL Builder Strategy & Rules
Este arquivo define as regras de design para o desenvolvimento deste builder de SQL. O objetivo é criar uma ferramenta fluida, segura contra SQL Injection e fácil de manter.

🏛️ Arquitetura do Pacote
Divida a lógica para garantir a Inversão de Dependência:

Grammar/Dialect: Onde reside a sintaxe específica do PostgreSQL.

Query Builder: A interface fluida (ex: .select().from()).

Compilers: Responsáveis por transformar a estrutura de objetos em uma string SQL e uma lista de parâmetros ($1, $2).

Expressions: Pequenos blocos de construção (Where, Join, OrderBy).

🧼 Clean Code & Patterns
Imutabilidade: Cada método do builder (ex: .where()) deve retornar uma nova instância do builder. Nunca mude o estado interno da instância atual.

Fluent Interface: Mantenha a API encadeável e intuitiva.

Sem Strings Mágicas: Use Enums ou constantes para palavras-chave SQL.

Small Methods: Métodos de compilação de cláusulas (ex: compileWheres) não devem passar de 15 linhas.

🧪 Estratégia de Testes (TDD)
Testes de Unidade: 100% de cobertura nos Compilers. Cada cláusula deve ser testada isoladamente.

Snapshot Testing: Use snapshots para validar se a string SQL gerada e os parâmetros coincidem com o esperado.

Integration: Testar contra um container PostgreSQL apenas para validar a sintaxe final gerada.

🛠️ PostgreSQL Specifics
Sempre use Prepared Statements (parâmetros numerados $1, $2).

Suporte nativo para tipos complexos (JSONB, Arrays).

Tratamento rigoroso de null vs undefined na geração das queries.

🚫 Proibições
❌ Proibido concatenar valores diretamente na string (Risco de SQL Injection).

❌ Proibido criar dependências circulares entre o Builder e o Compiler.

❌ Proibido usar any no TypeScript; defina interfaces claras para as cláusulas.